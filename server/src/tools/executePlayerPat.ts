import { fetchPlayerStats } from './fetchPlayerStats';
import { resolveTemplatePath } from './helpers/templateRegistry';
import { injectStats } from './helpers/injectStats';
import { type Tool } from './types';
import { readFile } from 'fs/promises';
import fs from 'fs';

// interface defitions for the output of the fetchPlayerStats tool, for type safety and clarity when accessing properties in executePAT.ts
export interface PlayerStats {
  playerName: string;
  requestedName: string;
  hand: { hand: string } | null;
  serveDirections: any[]; // replace any with specific row types where applicable
  serveOutcomes: any[];
  returnOutcomes: any[];
  rallyOutcomes: any[];
  error?: string;
}

export const executePat: Tool = {
  schema: {
    type: 'function' as const,
    function: {
      name: 'execute_pat',
      description:
        'Executes a PAT model for a tennis match based on player statistics and returns the win probability.',
      parameters: {
        type: 'object',
        properties: {
          player1Name: {
            type: 'string',
            description: 'Full name of player 1.',
          },
          player2Name: {
            type: 'string',
            description: 'Full name of player 2.',  
          },
        },
        required: ['player1Name', 'player2Name'],
      },
    },
  },
  execute: async (args) => {
    const { player1Name, player2Name } = args as {
      player1Name: string;
      player2Name: string;
    };

    /**fetch stats

    console.log('P1 Stats:', JSON.stringify(p1Stats, null, 2));
    console.log('P2 Stats:', JSON.stringify(p2Stats, null, 2));


    const template = await readFile(templatePath, 'utf-8');

    // output filled model into output/filled_models for debugging
    await fs.promises.mkdir('output/filled_models', { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `output/filled_models/${player1Name}_vs_${player2Name}_${timestamp}.pcsp`;
    // await fs.promises.writeFile(filename, filledModel);
    console.log(`Filled model written to ${filename}`);

    // const p1WinProb = await runPat(filledModel);
    */
    const [p1Stats, p2Stats] = await Promise.all([
      fetchPlayerStats.execute({ playerName: player1Name }),
      fetchPlayerStats.execute({ playerName: player2Name }),
    ]) as [PlayerStats, PlayerStats];

    // pick the right PAT template
    const templatePath = resolveTemplatePath(
      p1Stats.hand?.hand ?? 'RH',
      p2Stats.hand?.hand ?? 'RH',
    );
    console.log('fetchPlayerStats - Resolved template path:', templatePath);

    return {
      // player1WinProbability: p1WinProb,
      modelUsed: templatePath,
    };
  },
};
