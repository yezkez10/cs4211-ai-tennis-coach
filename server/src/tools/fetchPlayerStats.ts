import { type Tool } from 'tools/types';

export const fetchPlayerStats: Tool = {
  schema: {
    type: 'function' as const,
    function: {
      name: 'fetch_player_stats',
      description: 'Fetches historical tennis stats for a given player.',
      parameters: {
        type: 'object',
        properties: {
          playerName: {
            type: 'string',
            description: 'Full name of the player.',
          },
        },
        required: ['playerName'],
      },
    },
  },
  execute: async (args) => {
    const { playerName } = args as { playerName: string };

    await new Promise((resolve) => setTimeout(resolve, 5000));

    return {
      playerName,
      serveStats: {
        firstServePercentage: 0.61,
        firstServeWinPercentage: 0.74,
        secondServeWinPercentage: 0.52,
        aceRate: 0.08,
        doubleFaultRate: 0.03,
      },
      returnStats: {
        firstServeReturnWinPercentage: 0.28,
        secondServeReturnWinPercentage: 0.51,
      },
      serveDirection: {
        deuceCourt: { wide: 0.35, body: 0.2, t: 0.45 },
        adCourt: { wide: 0.4, body: 0.15, t: 0.45 },
      },
    };
  },
};
