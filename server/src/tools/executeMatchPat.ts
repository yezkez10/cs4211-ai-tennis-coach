import { resolveTemplatePath } from './helpers/templateRegistry';
import { injectStats } from './helpers/injectStats';
import { MatchStats } from './helpers/getMatchWeights';

import { type Tool } from 'tools/types';
import { readFile } from 'fs/promises';
import fs from 'fs';
import { fetchMatchStats } from './fetchMatchStats';

export const executeMatchPat: Tool = {
    schema: {
    type: 'function' as const,
    function: {
      name: 'execute_pat',
      description:
      'Fetches head-to-head tennis stats for two players from matches they played using fetchMatchStats tool' +  
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

    const matchStats = await Promise.resolve(fetchMatchStats.execute({ player1Name, player2Name })) as MatchStats;

    console.log('Retrieving matchup stats for', matchStats.player1Name, 'vs', matchStats.player2Name);

    // Debug logs
    console.log('Match Stats:', JSON.stringify(matchStats, null, 2));

    const templatePath = resolveTemplatePath(
        matchStats.handedness?.player1Name ?? 'RH',
        matchStats.handedness?.player2Name ?? 'RH'
    );
    const template = await readFile(templatePath, 'utf-8');
    const filledModel = injectStats(template, matchStats);
    // Write filledModel to a temporary file
    const tempFilePath = `./temp/${matchStats.player1Name}_vs_${matchStats.player2Name}.pcsp`;
    await fs.promises.writeFile(tempFilePath, filledModel, 'utf-8');

    return {
      filledModelPath: tempFilePath,
    };
  }
};
