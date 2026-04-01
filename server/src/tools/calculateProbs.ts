
// ─── Types (mirrors your DB output) ─────────────────────────────────────────

type ServeDirectionRow = {
  shot_type: number; from_court: number;
  serve_t: bigint; serve_body: bigint; serve_wide: bigint; serve_total: bigint;
};
type ServeOutcomeRow = {
  shot_type: number; from_court: number;
  aces: bigint; serve_winners: bigint; faults: bigint; in_play: bigint; total: bigint;
};
type ReturnOutcomeRow = {
  player2_hand: string; prev_direction: number; from_court: number;
  return_winners: bigint; return_errors: bigint; return_in_play: bigint; total: bigint;
};
type RallyOutcomeRow = {
  from_court: number;
  rally_winners: bigint; rally_errors: bigint; crosscourt: bigint; downline: bigint; total: bigint;
};
type PlayerStats = {
  hand: { hand: string } | null;
  serveDirections: ServeDirectionRow[];
  serveOutcomes:   ServeOutcomeRow[];
  returnOutcomes:  ReturnOutcomeRow[];
  rallyOutcomes:   RallyOutcomeRow[];
};

// for type safety
type ServeProbs  = { win: number; t: number; wide: number; body: number; error: number };
type ReturnProbs = { win: number; crosscourt: number; downline: number; error: number };
type RallyProbs  = { win: number; crosscourt: number; downline: number; error: number };


// ─── Lookup helpers ──────────────────────────────────────────────────────────

// shot_type: 1 = 1st serve, 2 = 2nd serve
// from_court: 1 = deuce,    3 = ad

function getServeDir(rows: ServeDirectionRow[], shotType: number, court: number) {
  return rows.find(r => r.shot_type === shotType && r.from_court === court);
}
function getServeOut(rows: ServeOutcomeRow[], shotType: number, court: number) {
  return rows.find(r => r.shot_type === shotType && r.from_court === court);
}
function getReturn(rows: ReturnOutcomeRow[], court: number, dir: number) {
  return rows.find(r => r.from_court === court && r.prev_direction === dir);
}
function getRally(rows: RallyOutcomeRow[], court: number) {
  return rows.find(r => r.from_court === court);
}

// ─── Utility: normalize probabilities ────────────────────────────────────────

function normaliseTo100<T extends Record<string, number>>(weights: T): T {
  const keys = Object.keys(weights) as (keyof T)[];
  const total = Object.values(weights).reduce((s, v) => s + (v as number), 0);

  if (total === 0) {
    const even = Math.floor(100 / keys.length);
    const result = Object.fromEntries(keys.map(k => [k, even])) as T;
    const firstKey = keys[0];
    if (firstKey !== undefined) {
        (result[firstKey] as number) += 100 - even * keys.length;
    }
    return result;
  }

  const exact     = keys.map(k => ((weights[k] as number) / total) * 100); // scale to 100
  const floored   = exact.map(Math.floor);                                  // floor each
  const remainder = 100 - floored.reduce((s, v) => s + v, 0);              // how many 1s left to distribute

  // give leftover 1s to keys with the largest fractional parts
  const fractions = exact.map((v, i) => ({ i, frac: v - floored[i]! }));
  fractions.sort((a, b) => b.frac - a.frac);
  fractions.slice(0, remainder).forEach(({ i }) => floored[i]!++);

  return Object.fromEntries(keys.map((k, i) => [k, floored[i]])) as T;
}


// ─── Per-block calculators ───────────────────────────────────────────────────

function calcServeProbs(
  out: ServeOutcomeRow | undefined,
  dir: ServeDirectionRow | undefined,
): ServeProbs {
  if (!out || !dir) return normaliseTo100({ win: 5, t: 30, wide: 40, body: 20, error: 5 });

  const total    = Number(out.total)       || 1;
  const dirTotal = Number(dir.serve_total) || 1;
  const pInPlay  = Number(out.in_play) / total;

  return normaliseTo100<ServeProbs>({
    win:   (Number(out.aces) + Number(out.serve_winners)) / total,
    t:     (Number(dir.serve_t)    / dirTotal) * pInPlay,
    wide:  (Number(dir.serve_wide) / dirTotal) * pInPlay,
    body:  (Number(dir.serve_body) / dirTotal) * pInPlay,
    error: Number(out.faults) / total,
  });
}

function calcReturnProbs(
  row: ReturnOutcomeRow | undefined,
): ReturnProbs {
  if (!row) return normaliseTo100<ReturnProbs>({ win: 5, crosscourt: 45, downline: 30, error: 20 });

  const total = Number(row.total) || 1;
  const pInPlay = Number(row.return_in_play) / total;

  return normaliseTo100<ReturnProbs>({
    win:        Number(row.return_winners) / total,
    crosscourt: pInPlay * 0.5,   // split evenly — replace with real data if available
    downline:   pInPlay * 0.5,
    error:      Number(row.return_errors) / total,
  });
}

function calcRallyProbs(
  row: RallyOutcomeRow | undefined,
): RallyProbs {
  if (!row) return normaliseTo100<RallyProbs>({ win: 10, crosscourt: 45, downline: 30, error: 15 });

  const total = Number(row.total) || 1;

  return normaliseTo100({
    win:        Number(row.rally_winners) / total,
    crosscourt: Number(row.crosscourt)    / total,
    downline:   Number(row.downline)      / total,
    error:      Number(row.rally_errors)  / total,
  });
}


// ─── Main: build the full token map ─────────────────────────────────────────

/**
 * Call this after fetchPlayerStats resolves for both players.
 * Returns a flat token map ready for injectProbabilities().
 */
export function computeProbabilities(
  p1: PlayerStats,
  p2: PlayerStats,
): Record<string, number> {

  // ── Player 1 serves ──────────────────────────────────────────────────────
  // Deuce court — 1st and 2nd serve
  const p1_de_1st = calcServeProbs(
    getServeOut(p1.serveOutcomes, 1, 1),
    getServeDir(p1.serveDirections, 1, 1),
  );
  const p1_de_2nd = calcServeProbs(
    getServeOut(p1.serveOutcomes, 2, 1),
    getServeDir(p1.serveDirections, 2, 1),
  );
  // Ad court — 1st and 2nd serve
  const p1_ad_1st = calcServeProbs(
    getServeOut(p1.serveOutcomes, 1, 3),
    getServeDir(p1.serveDirections, 1, 3),
  );
  const p1_ad_2nd = calcServeProbs(
    getServeOut(p1.serveOutcomes, 2, 3),
    getServeDir(p1.serveDirections, 2, 3),
  );

  // ── Player 2 serves ──────────────────────────────────────────────────────
  const p2_de_1st = calcServeProbs(
    getServeOut(p2.serveOutcomes, 1, 1),
    getServeDir(p2.serveDirections, 1, 1),
  );
  const p2_de_2nd = calcServeProbs(
    getServeOut(p2.serveOutcomes, 2, 1),
    getServeDir(p2.serveDirections, 2, 1),
  );
  const p2_ad_1st = calcServeProbs(
    getServeOut(p2.serveOutcomes, 1, 3),
    getServeDir(p2.serveDirections, 1, 3),
  );
  const p2_ad_2nd = calcServeProbs(
    getServeOut(p2.serveOutcomes, 2, 3),
    getServeDir(p2.serveDirections, 2, 3),
  );

  // ── Player 2's return vs Player 1's serve ────────────────────────────────
  // prev_direction: 4=wide, 5=body, 6=T  |  from_court: 1=deuce, 3=ad
  const p2ret_de_T    = calcReturnProbs(getReturn(p2.returnOutcomes, 1, 6));
  const p2ret_de_wide = calcReturnProbs(getReturn(p2.returnOutcomes, 1, 4));
  const p2ret_de_body = calcReturnProbs(getReturn(p2.returnOutcomes, 1, 5));
  const p2ret_ad_T    = calcReturnProbs(getReturn(p2.returnOutcomes, 3, 6));
  const p2ret_ad_wide = calcReturnProbs(getReturn(p2.returnOutcomes, 3, 4));
  const p2ret_ad_body = calcReturnProbs(getReturn(p2.returnOutcomes, 3, 5));

  // ── Player 1's return vs Player 2's serve ────────────────────────────────
  const p1ret_de_T    = calcReturnProbs(getReturn(p1.returnOutcomes, 1, 6));
  const p1ret_de_wide = calcReturnProbs(getReturn(p1.returnOutcomes, 1, 4));
  const p1ret_de_body = calcReturnProbs(getReturn(p1.returnOutcomes, 1, 5));
  const p1ret_ad_T    = calcReturnProbs(getReturn(p1.returnOutcomes, 3, 6));
  const p1ret_ad_wide = calcReturnProbs(getReturn(p1.returnOutcomes, 3, 4));
  const p1ret_ad_body = calcReturnProbs(getReturn(p1.returnOutcomes, 3, 5));

  // ── Rally ────────────────────────────────────────────────────────────────
  const p1rally_de = calcRallyProbs(getRally(p1.rallyOutcomes, 1));
  const p1rally_ad = calcRallyProbs(getRally(p1.rallyOutcomes, 3));
  const p2rally_de = calcRallyProbs(getRally(p2.rallyOutcomes, 1));
  const p2rally_ad = calcRallyProbs(getRally(p2.rallyOutcomes, 3));

  // ── Flatten into template token map ─────────────────────────────────────
  return {
    // Player 1 — Deuce court serves
    P1_DE_1ST_WIN:   p1_de_1st.win,   P1_DE_1ST_T:   p1_de_1st.t,
    P1_DE_1ST_WIDE:  p1_de_1st.wide,  P1_DE_1ST_BODY: p1_de_1st.body,  P1_DE_1ST_ERROR: p1_de_1st.error,

    P1_DE_2ND_WIN:   p1_de_2nd.win,   P1_DE_2ND_T:   p1_de_2nd.t,
    P1_DE_2ND_WIDE:  p1_de_2nd.wide,  P1_DE_2ND_BODY: p1_de_2nd.body,  P1_DE_2ND_ERROR: p1_de_2nd.error,

    // Player 1 — Ad court serves
    P1_AD_1ST_WIN:   p1_ad_1st.win,   P1_AD_1ST_T:   p1_ad_1st.t,
    P1_AD_1ST_WIDE:  p1_ad_1st.wide,  P1_AD_1ST_BODY: p1_ad_1st.body,  P1_AD_1ST_ERROR: p1_ad_1st.error,

    P1_AD_2ND_WIN:   p1_ad_2nd.win,   P1_AD_2ND_T:   p1_ad_2nd.t,
    P1_AD_2ND_WIDE:  p1_ad_2nd.wide,  P1_AD_2ND_BODY: p1_ad_2nd.body,  P1_AD_2ND_ERROR: p1_ad_2nd.error,

    // Player 2 — Deuce court serves
    P2_DE_1ST_WIN:   p2_de_1st.win,   P2_DE_1ST_T:   p2_de_1st.t,
    P2_DE_1ST_WIDE:  p2_de_1st.wide,  P2_DE_1ST_BODY: p2_de_1st.body,  P2_DE_1ST_ERROR: p2_de_1st.error,

    P2_DE_2ND_WIN:   p2_de_2nd.win,   P2_DE_2ND_T:   p2_de_2nd.t,
    P2_DE_2ND_WIDE:  p2_de_2nd.wide,  P2_DE_2ND_BODY: p2_de_2nd.body,  P2_DE_2ND_ERROR: p2_de_2nd.error,

    // Player 2 — Ad court serves
    P2_AD_1ST_WIN:   p2_ad_1st.win,   P2_AD_1ST_T:   p2_ad_1st.t,
    P2_AD_1ST_WIDE:  p2_ad_1st.wide,  P2_AD_1ST_BODY: p2_ad_1st.body,  P2_AD_1ST_ERROR: p2_ad_1st.error,

    P2_AD_2ND_WIN:   p2_ad_2nd.win,   P2_AD_2ND_T:   p2_ad_2nd.t,
    P2_AD_2ND_WIDE:  p2_ad_2nd.wide,  P2_AD_2ND_BODY: p2_ad_2nd.body,  P2_AD_2ND_ERROR: p2_ad_2nd.error,

    // Player 2 returning Player 1's serve
    P2RET_DE_T_WIN: p2ret_de_T.win, P2RET_DE_T_CC: p2ret_de_T.crosscourt, P2RET_DE_T_DL: p2ret_de_T.downline, P2RET_DE_T_ERR: p2ret_de_T.error,
    P2RET_DE_WIDE_WIN: p2ret_de_wide.win, P2RET_DE_WIDE_CC: p2ret_de_wide.crosscourt, P2RET_DE_WIDE_DL: p2ret_de_wide.downline, P2RET_DE_WIDE_ERR: p2ret_de_wide.error,
    P2RET_DE_BODY_WIN: p2ret_de_body.win, P2RET_DE_BODY_CC: p2ret_de_body.crosscourt, P2RET_DE_BODY_DL: p2ret_de_body.downline, P2RET_DE_BODY_ERR: p2ret_de_body.error,
    P2RET_AD_T_WIN: p2ret_ad_T.win, P2RET_AD_T_CC: p2ret_ad_T.crosscourt, P2RET_AD_T_DL: p2ret_ad_T.downline, P2RET_AD_T_ERR: p2ret_ad_T.error,
    P2RET_AD_WIDE_WIN: p2ret_ad_wide.win, P2RET_AD_WIDE_CC: p2ret_ad_wide.crosscourt, P2RET_AD_WIDE_DL: p2ret_ad_wide.downline, P2RET_AD_WIDE_ERR: p2ret_ad_wide.error,
    P2RET_AD_BODY_WIN: p2ret_ad_body.win, P2RET_AD_BODY_CC: p2ret_ad_body.crosscourt, P2RET_AD_BODY_DL: p2ret_ad_body.downline, P2RET_AD_BODY_ERR: p2ret_ad_body.error,

    // Player 1 returning Player 2's serve
    P1RET_DE_T_WIN: p1ret_de_T.win, P1RET_DE_T_CC: p1ret_de_T.crosscourt, P1RET_DE_T_DL: p1ret_de_T.downline, P1RET_DE_T_ERR: p1ret_de_T.error,
    P1RET_DE_WIDE_WIN: p1ret_de_wide.win, P1RET_DE_WIDE_CC: p1ret_de_wide.crosscourt, P1RET_DE_WIDE_DL: p1ret_de_wide.downline, P1RET_DE_WIDE_ERR: p1ret_de_wide.error,
    P1RET_DE_BODY_WIN: p1ret_de_body.win, P1RET_DE_BODY_CC: p1ret_de_body.crosscourt, P1RET_DE_BODY_DL: p1ret_de_body.downline, P1RET_DE_BODY_ERR: p1ret_de_body.error,
    P1RET_AD_T_WIN: p1ret_ad_T.win, P1RET_AD_T_CC: p1ret_ad_T.crosscourt, P1RET_AD_T_DL: p1ret_ad_T.downline, P1RET_AD_T_ERR: p1ret_ad_T.error,
    P1RET_AD_WIDE_WIN: p1ret_ad_wide.win, P1RET_AD_WIDE_CC: p1ret_ad_wide.crosscourt, P1RET_AD_WIDE_DL: p1ret_ad_wide.downline, P1RET_AD_WIDE_ERR: p1ret_ad_wide.error,
    P1RET_AD_BODY_WIN: p1ret_ad_body.win, P1RET_AD_BODY_CC: p1ret_ad_body.crosscourt, P1RET_AD_BODY_DL: p1ret_ad_body.downline, P1RET_AD_BODY_ERR: p1ret_ad_body.error,

    // Rally
    P1RALLY_DE_WIN: p1rally_de.win, P1RALLY_DE_CC: p1rally_de.crosscourt, P1RALLY_DE_DL: p1rally_de.downline, P1RALLY_DE_ERR: p1rally_de.error,
    P1RALLY_AD_WIN: p1rally_ad.win, P1RALLY_AD_CC: p1rally_ad.crosscourt, P1RALLY_AD_DL: p1rally_ad.downline, P1RALLY_AD_ERR: p1rally_ad.error,
    P2RALLY_DE_WIN: p2rally_de.win, P2RALLY_DE_CC: p2rally_de.crosscourt, P2RALLY_DE_DL: p2rally_de.downline, P2RALLY_DE_ERR: p2rally_de.error,
    P2RALLY_AD_WIN: p2rally_ad.win, P2RALLY_AD_CC: p2rally_ad.crosscourt, P2RALLY_AD_DL: p2rally_ad.downline, P2RALLY_AD_ERR: p2rally_ad.error,
  };
}