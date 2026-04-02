import { fetchPlayerStats } from 'tools/fetchPlayerStats';
import { resolveTemplatePath } from 'tools/templateRegistry';
import { computeProbabilities } from './calculateProbs';
import { type Tool } from 'tools/types';
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

function injectProbabilities(template: string, tokens: Record<string, number>): string {
  let result = template;
  for (const [key, value] of Object.entries(tokens)) {
    const placeholder = `{{${key}}}`;
    result = result.replaceAll(placeholder, value.toString());
  }
  return result;
}

function runPat(modelContent: string): Promise<number> {
  // This function would contain the logic to execute the PAT model, e.g. by calling a CLI tool or an API.
  // For demonstration, we return a mocked probability after a delay.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(0.673); // Mocked probability
    }, 5000);
  });
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

    // fetch stats
    const [p1Stats, p2Stats] = await Promise.all([
      fetchPlayerStats.execute({ playerName: player1Name }),
      fetchPlayerStats.execute({ playerName: player2Name }),
    ]) as [PlayerStats, PlayerStats];

    console.log('P1 Stats:', JSON.stringify(p1Stats, null, 2));
    console.log('P2 Stats:', JSON.stringify(p2Stats, null, 2));

    // compute probabilities
    const tokens = computeProbabilities(p1Stats as any, p2Stats as any);
    console.log('Token map', {
      P1_DE_1ST_WIN:   tokens.P1_DE_1ST_WIN,
      P2RET_DE_T_WIN:  tokens.P2RET_DE_T_WIN,
      P1RALLY_DE_WIN:  tokens.P1RALLY_DE_WIN,
    });

    // pick the right PAT template
    const templatePath = resolveTemplatePath(
      p1Stats.hand?.hand ?? 'RH',
      p2Stats.hand?.hand ?? 'RH',
    );
    console.log('Resolved template path:', templatePath);

    const template = await readFile(templatePath, 'utf-8');

    // Inject probabilities into the template
    const filledModel = injectProbabilities(template, tokens);

    // output filled model into output/filled_models for debugging
    await fs.promises.mkdir('output/filled_models', { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `output/filled_models/${player1Name}_vs_${player2Name}_${timestamp}.pcsp`;
    await fs.promises.writeFile(filename, filledModel);
    console.log(`Filled model written to ${filename}`);

    const p1WinProb = await runPat(filledModel);

    return {
      player1WinProbability: p1WinProb,
      modelUsed: templatePath,
    };
  },
};
