import { and, count, eq, inArray, or, sql } from 'drizzle-orm';
import { type Tool } from 'tools/types';

import { db } from 'db';
import { shot } from 'db/schema';

// ---------------------------------------------------------------------------
// Helper: fuzzy-match a player name against player1_name column
// ---------------------------------------------------------------------------

async function findClosestPlayerName(
  playerName: string,
): Promise<{ player1Name: string; similarity: number } | null> {
  const rows = await db
    .select({
      player1Name: shot.player1Name,
      similarity: sql<number>`similarity(${shot.player1Name}, ${playerName}::text)`,
    })
    .from(shot)
    .groupBy(shot.player1Name)
    .having(sql`similarity(${shot.player1Name}, ${playerName}::text) > 0.3`)
    .orderBy(sql`similarity(${shot.player1Name}, ${playerName}::text) DESC`)
    .limit(1);

  return rows[0] ?? null;
}

async function resolvePlayerName(playerName: string): Promise<string | null> {
  const exact = await db
    .selectDistinct({ player1Hand: shot.player1Hand })
    .from(shot)
    .where(eq(shot.player1Name, playerName))
    .limit(1);

  if (exact.length > 0) return playerName;

  const match = await findClosestPlayerName(playerName);
  return match ? match.player1Name : null;
}

// ---------------------------------------------------------------------------
// H2H-scoped query helpers
//
// The dataset stores each shot from the serving/hitting player's perspective
// as player1. In a match between A and B, rows alternate:
//   - A as player1, B as player2  (when A is serving or hitting)
//   - B as player1, A as player2  (when B is serving or hitting)
//
// Each helper accepts (p1, p2) = the two resolved names and returns stats
// for BOTH players, labelled by their role in that row.
// ---------------------------------------------------------------------------

const h2hFilter = (p1: string, p2: string) =>
  or(
    and(eq(shot.player1Name, p1), eq(shot.player2Name, p2)),
    and(eq(shot.player1Name, p2), eq(shot.player2Name, p1)),
  );

async function queryServeDirections(p1: string, p2: string) {
  return db
    .select({
      servingPlayer: shot.player1Name,
      shotType: shot.shotType,
      fromCourt: shot.fromCourt,
      serveT:     sql<number>`COUNT(*) FILTER (WHERE ${shot.direction} = 6)`,
      serveBody:  sql<number>`COUNT(*) FILTER (WHERE ${shot.direction} = 5)`,
      serveWide:  sql<number>`COUNT(*) FILTER (WHERE ${shot.direction} = 4)`,
      serveTotal: sql<number>`COUNT(*) FILTER (WHERE ${shot.direction} IN (4, 5, 6))`,
    })
    .from(shot)
    .where(
      and(
        h2hFilter(p1, p2),
        inArray(shot.shotType, [1, 2]),
        inArray(shot.fromCourt, [1, 3]),
        inArray(shot.direction, [4, 5, 6]),
      ),
    )
    .groupBy(shot.player1Name, shot.shotType, shot.fromCourt)
    .orderBy(shot.player1Name, shot.shotType, shot.fromCourt);
}

async function queryServeOutcomes(p1: string, p2: string) {
  return db
    .select({
      servingPlayer: shot.player1Name,
      shotType:      shot.shotType,
      fromCourt:     shot.fromCourt,
      aces:          sql<number>`COUNT(*) FILTER (WHERE ${shot.shotOutcome} = 1)`,
      serveWinners:  sql<number>`COUNT(*) FILTER (WHERE ${shot.shotOutcome} = 6)`,
      faults:        sql<number>`COUNT(*) FILTER (WHERE ${shot.shotOutcome} = 2)`,
      inPlay:        sql<number>`COUNT(*) FILTER (WHERE ${shot.shotOutcome} = 7)`,
      total:         count(),
    })
    .from(shot)
    .where(
      and(
        h2hFilter(p1, p2),
        inArray(shot.shotType, [1, 2]),
        inArray(shot.fromCourt, [1, 3]),
      ),
    )
    .groupBy(shot.player1Name, shot.shotType, shot.fromCourt)
    .orderBy(shot.player1Name, shot.shotType, shot.fromCourt);
}

async function queryReturnOutcomes(p1: string, p2: string) {
  return db
    .select({
      returningPlayer: shot.player2Name,
      returnerHand:    shot.player2Hand,
      prevDirection:   shot.prevDirection,
      fromCourt:       shot.fromCourt,
      returnWinners:   sql<number>`COUNT(*) FILTER (WHERE ${shot.shotOutcome} IN (6))`,
      returnErrors:    sql<number>`COUNT(*) FILTER (WHERE ${shot.shotOutcome} IN (3, 4))`,
      returnInPlay:    sql<number>`COUNT(*) FILTER (WHERE ${shot.shotOutcome} = 7)`,
      total:           count(),
    })
    .from(shot)
    .where(
      and(
        h2hFilter(p1, p2),
        eq(shot.shotType, 3),
        inArray(shot.fromCourt, [1, 2, 3]),
        inArray(shot.prevDirection, [4, 5, 6]),
      ),
    )
    .groupBy(shot.player2Name, shot.player2Hand, shot.prevDirection, shot.fromCourt)
    .orderBy(shot.player2Name, shot.fromCourt, shot.prevDirection);
}

async function queryRallyOutcomes(p1: string, p2: string) {
  return db
    .select({
      hittingPlayer: shot.player1Name,
      fromCourt:     shot.fromCourt,
      rallyWinners:  sql<number>`COUNT(*) FILTER (WHERE ${shot.shotOutcome} = 5)`,
      rallyErrors:   sql<number>`COUNT(*) FILTER (WHERE ${shot.shotOutcome} IN (3, 4))`,
      crosscourt:    sql<number>`COUNT(*) FILTER (WHERE ${shot.direction} = 7)`,
      downLine:      sql<number>`COUNT(*) FILTER (WHERE ${shot.direction} = 8)`,
      total:         count(),
    })
    .from(shot)
    .where(and(h2hFilter(p1, p2), eq(shot.shotType, 4)))
    .groupBy(shot.player1Name, shot.fromCourt)
    .orderBy(shot.player1Name, shot.fromCourt);
}

async function queryHandedness(p1: string, p2: string) {
  const [p1Rows, p2Rows] = await Promise.all([
    db
      .selectDistinct({ player1Hand: shot.player1Hand })
      .from(shot)
      .where(eq(shot.player1Name, p1))
      .limit(1),
    db
      .selectDistinct({ player1Hand: shot.player1Hand })
      .from(shot)
      .where(eq(shot.player1Name, p2))
      .limit(1),
  ]);

  return {
    [p1]: p1Rows[0]?.player1Hand ?? null,
    [p2]: p2Rows[0]?.player1Hand ?? null,
  };
}

// ---------------------------------------------------------------------------
// Tool export
// ---------------------------------------------------------------------------

export const fetchMatchStats: Tool = {
  schema: {
    type: 'function' as const,
    function: {
      name: 'fetch_match_stats',
      description:
        'Fetches head-to-head tennis stats for two players from matches they played ' +
        'against each other. Returns serve direction counts, serve outcomes, return ' +
        'outcomes, and rally stats for both players, scoped exclusively to their ' +
        'mutual matches. Use this instead of fetch_player_stats when the query is ' +
        'specifically about how these two players perform against each other.',
      parameters: {
        type: 'object',
        properties: {
          player1Name: {
            type: 'string',
            description: 'Full name of the first player.',
          },
          player2Name: {
            type: 'string',
            description: 'Full name of the second player.',
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

    const [resolved1, resolved2] = await Promise.all([
      resolvePlayerName(player1Name),
      resolvePlayerName(player2Name),
    ]);

    if (!resolved1) {
      return {
        error: `Player "${player1Name}" not found. Please check the spelling.`,
        player1Name,
        player2Name,
      };
    }
    if (!resolved2) {
      return {
        error: `Player "${player2Name}" not found. Please check the spelling.`,
        player1Name,
        player2Name,
      };
    }

    const [handedness, serveDirections, serveOutcomes, returnOutcomes, rallyOutcomes] =
      await Promise.all([
        queryHandedness(resolved1, resolved2),
        queryServeDirections(resolved1, resolved2),
        queryServeOutcomes(resolved1, resolved2),
        queryReturnOutcomes(resolved1, resolved2),
        queryRallyOutcomes(resolved1, resolved2),
      ]);

    // serveDirections is the most reliable signal — it will be empty if
    // these two players have never appeared in the same match in the dataset.
    if (serveDirections.length === 0) {
      return {
        noH2hData: true,
        player1Name: resolved1,
        player2Name: resolved2,
      };
    }

    return {
      player1Name: resolved1,
      player2Name: resolved2,
      requestedPlayer1Name: player1Name,
      requestedPlayer2Name: player2Name,
      handedness,
      serveDirections,
      serveOutcomes,
      returnOutcomes,
      rallyOutcomes,
    };
  },
};