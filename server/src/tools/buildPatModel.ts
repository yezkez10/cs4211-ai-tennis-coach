import { type Tool } from 'tools/types';
import * as fs from 'fs/promises';
import { resolveTemplatePath } from './templateRegistry';
import { injectProbabilities } from './patInjector';
import { executePat } from './executePAT';

export const buildPatModel: Tool = {
  schema: {
    type: 'function' as const,
    function: {
      name: 'inject_probabilities_to_pat',
      description: 'Injects calculated tennis probabilities into a PAT .pcsp template and runs the simulation. ALWAYS call this after fetching stats for BOTH players.',
      parameters: {
        type: 'object',
        properties: {
          matchupName: { type: 'string', description: 'e.g., "Federer_vs_Nadal"' },
          player1Hand: { type: 'string', description: '"RH" or "LH"' },
          player2Hand: { type: 'string', description: '"RH" or "LH"' },
          probabilityMap: {
            type: 'object',
            description: 'A JSON map mapping State blocks (e.g. "De_Ply1Serve") to Action percentages (e.g. {"Win": 10, "ServeT_in": 30}). Each state block MUST sum to 100.',
            additionalProperties: {
              type: 'object',
              additionalProperties: { type: 'number' }
            }
          }
        },
        required: ['matchupName', 'player1Hand', 'player2Hand', 'probabilityMap'],
      },
    },
  },
  execute: async (args) => {
    const { matchupName, player1Hand, player2Hand, probabilityMap } = args as any;

    try {
      const templatePath = resolveTemplatePath(player1Hand, player2Hand);
      const filledTemplateText = await injectProbabilities(templatePath, probabilityMap);

      // Save to a temporary file for PAT to read
      const outputPath = `./models/run_${matchupName}.pcsp`;
      await fs.writeFile(outputPath, filledTemplateText);

      // execute PAT run and return results
      const results = await executePat(outputPath);

      return {
        success: true,
        matchup: matchupName,
        player1WinProbability: results.probability,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};