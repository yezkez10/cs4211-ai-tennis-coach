import { sql } from 'drizzle-orm';
import { type Tool } from 'tools/types';

import { db } from 'db';

async function findClosestPlayerName(
  playerName: string,
): Promise<{ matched_name: string; similarity: number } | null> {
  const result = await db.execute(sql`
    SELECT 
      player1_name AS matched_name,
      similarity(player1_name, ${playerName}) AS similarity
    FROM public.shot
    GROUP BY player1_name
    HAVING similarity(player1_name, ${playerName}) > 0.3
    ORDER BY similarity DESC
    LIMIT 1
  `);
  return (
    (result.rows[0] as { matched_name: string; similarity: number }) ?? null
  );
}

async function queryServeDirections(playerName: string) {
  const result = await db.execute(sql`
    SELECT
      shot_type,
      from_court,
      COUNT(*) FILTER (WHERE direction = 6) AS serve_t,
      COUNT(*) FILTER (WHERE direction = 5) AS serve_body,
      COUNT(*) FILTER (WHERE direction = 4) AS serve_wide,
      COUNT(*) FILTER (WHERE direction IN (4,5,6)) AS serve_total
    FROM public.shot
    WHERE player1_name = ${playerName}
      AND shot_type IN (1, 2)
      AND from_court IN (1, 3)
      AND direction IN (4, 5, 6)
    GROUP BY shot_type, from_court
    ORDER BY shot_type, from_court
  `);
  return result.rows;
}

async function queryServeOutcomes(playerName: string) {
  const result = await db.execute(sql`
    SELECT
      shot_type,
      from_court,
      COUNT(*) FILTER (WHERE shot_outcome = 1)   AS aces,
      COUNT(*) FILTER (WHERE shot_outcome = 6)   AS serve_winners,
      COUNT(*) FILTER (WHERE shot_outcome = 2)   AS faults,
      COUNT(*) FILTER (WHERE shot_outcome = 7)   AS in_play,
      COUNT(*)                                   AS total
    FROM public.shot
    WHERE player1_name = ${playerName}
      AND shot_type IN (1, 2)
      AND from_court IN (1, 3)
    GROUP BY shot_type, from_court
    ORDER BY shot_type, from_court
  `);
  return result.rows;
}

async function queryReturnOutcomes(playerName: string) {
  const result = await db.execute(sql`
    SELECT
      player2_hand,
      prev_direction,
      from_court,
      COUNT(*) FILTER (WHERE shot_outcome IN (5,6)) AS return_winners,
      COUNT(*) FILTER (WHERE shot_outcome IN (3,4)) AS return_errors,
      COUNT(*) FILTER (WHERE shot_outcome = 7)      AS return_in_play,
      COUNT(*)                                      AS total
    FROM public.shot
    WHERE player2_name = ${playerName}
      AND shot_type = 3
      AND from_court IN (1, 2, 3)
      AND prev_direction IN (4, 5, 6)
    GROUP BY player2_hand, prev_direction, from_court
    ORDER BY from_court, prev_direction
  `);
  return result.rows;
}

async function queryRallyOutcomes(playerName: string) {
  const result = await db.execute(sql`
    SELECT
      from_court,
      COUNT(*) FILTER (WHERE shot_outcome = 5)      AS rally_winners,
      COUNT(*) FILTER (WHERE shot_outcome IN (3,4)) AS rally_errors,
      COUNT(*) FILTER (WHERE direction = 7)         AS crosscourt,
      COUNT(*) FILTER (WHERE direction = 8)         AS downline,
      COUNT(*)                                      AS total
    FROM public.shot
    WHERE player1_name = ${playerName}
      AND shot_type = 4
    GROUP BY from_court
    ORDER BY from_court
  `);
  return result.rows;
}

async function queryHandedness(playerName: string) {
  const result = await db.execute(sql`
    SELECT DISTINCT player1_hand AS hand
    FROM public.shot
    WHERE player1_name = ${playerName}
    LIMIT 1
  `);
  return result.rows[0] ?? null;
}

export const fetchPlayerStats: Tool = {
  schema: {
    type: 'function' as const,
    function: {
      name: 'fetch_player_stats',
      description:
        'Fetches historical tennis stats for a given player from the match database. ' +
        'Returns serve direction counts, serve outcomes, return outcomes, and rally stats ' +
        'for use in PCSP# model construction. Always call this before run_pat_model.',
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

    let resolvedName = playerName;

    // Try exact match first
    let hand = await queryHandedness(playerName);

    // Fall back to fuzzy match
    if (!hand) {
      const match = await findClosestPlayerName(playerName);
      if (!match) {
        return {
          error: `Player "${playerName}" not found. Please check the spelling.`,
          playerName,
        };
      }
      resolvedName = match.matched_name;

      hand = await queryHandedness(resolvedName);
    }

    // All queries now use the resolved name
    const [serveDirections, serveOutcomes, returnOutcomes, rallyOutcomes] =
      await Promise.all([
        queryServeDirections(resolvedName),
        queryServeOutcomes(resolvedName),
        queryReturnOutcomes(resolvedName),
        queryRallyOutcomes(resolvedName),
      ]);

    return {
      playerName: resolvedName,
      requestedName: playerName,
      hand,
      serveDirections,
      serveOutcomes,
      returnOutcomes,
      rallyOutcomes,
    };
  },
};
