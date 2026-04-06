export interface MatchStats {
  player1Name: string;
  player2Name: string;
  requestedPlayer1Name: string;
  requestedPlayer2Name: string;
  handedness: Record<string, string | null>;
  serveDirections: Array<{
    servingPlayer: string;
    shotType: number;
    fromCourt: number;
    serveT: string;
    serveBody: string;
    serveWide: string;
    serveTotal: string;
  }>;
  serveOutcomes: Array<{
    servingPlayer: string;
    shotType: number;
    fromCourt: number;
    aces: string;
    serveWinners: string;
    faults: string;
    inPlay: string;
    total: number;
  }>;
  returnOutcomes: Array<{
    returningPlayer: string;
    returnerHand: string;
    prevDirection: number;
    fromCourt: number;
    returnWinners: string;
    returnErrors: string;
    returnInPlay: string;
    total: number;
  }>;
  rallyOutcomes: Array<{
    hittingPlayer: string;
    fromCourt: number;
    rallyWinners: string;
    rallyErrors: string;
    crosscourt: string;
    downLine: string;
    total: number;
  }>;
}

export function getMatchWeights(matchStats: MatchStats): Record<string, number> {
    const modelParams: Record<string, number> = {};
    const p1 = matchStats.player1Name;
    const p2 = matchStats.player2Name;

    const safeInt = (val: string | number | undefined): number => {
        if (!val) return 0;
        const parsed = typeof val === 'string' ? parseInt(val, 10) : val;
        return isNaN(parsed) ? 0 : parsed;
    };

    // Using a tuple for fixed-length arrays to ensure all values are of type number
    type Weights4 = [number, number, number, number];
    type Weights5 = [number, number, number, number, number];

    function validateWeights(weights: Weights4): Weights4;
    function validateWeights(weights: Weights5): Weights5;
    function validateWeights(weights: number[]) {
    const total = weights.reduce((sum, w) => sum + w, 0);
    return total === 0 ? weights.map(() => 1) : weights;
    };

    // --- 1. PROCESS SERVES ---
    const processServe = (player: string, shotType: number, fromCourt: number, prefix: string) => {
        const outcome = matchStats.serveOutcomes.find(s => s.servingPlayer === player && s.shotType === shotType && s.fromCourt === fromCourt);
        const direction = matchStats.serveDirections.find(s => s.servingPlayer === player && s.shotType === shotType && s.fromCourt === fromCourt);

        if (!outcome || !direction) {
        const fallback = validateWeights([0, 0, 0, 0, 0]); 
        modelParams[`${prefix}_WIN`] = fallback[0];
        modelParams[`${prefix}_T`] = fallback[1];
        modelParams[`${prefix}_WIDE`] = fallback[2];
        modelParams[`${prefix}_BODY`] = fallback[3];
        modelParams[`${prefix}_ERROR`] = fallback[4];
        return;
        }

        const aces = safeInt(outcome.aces);
        const winners = safeInt(outcome.serveWinners);
        const faults = safeInt(outcome.faults);
        const inPlay = safeInt(outcome.inPlay);

        const t = safeInt(direction.serveT);
        const body = safeInt(direction.serveBody);
        const wide = safeInt(direction.serveWide);
        const totalDir = t + body + wide;

        const t_in = totalDir > 0 ? Math.round(inPlay * (t / totalDir)) : Math.round(inPlay / 3);
        const body_in = totalDir > 0 ? Math.round(inPlay * (body / totalDir)) : Math.round(inPlay / 3);
        const wide_in = totalDir > 0 ? Math.round(inPlay * (wide / totalDir)) : Math.round(inPlay / 3);

        const rawCounts = validateWeights([
        aces + winners,
        t_in,
        wide_in,
        body_in,
        faults
        ]);
        
        modelParams[`${prefix}_WIN`] = rawCounts[0];
        modelParams[`${prefix}_T`] = rawCounts[1];
        modelParams[`${prefix}_WIDE`] = rawCounts[2];
        modelParams[`${prefix}_BODY`] = rawCounts[3];
        modelParams[`${prefix}_ERROR`] = rawCounts[4];
    };

    processServe(p1, 1, 1, "P1_DE_1ST");
    processServe(p1, 2, 1, "P1_DE_2ND");
    processServe(p1, 1, 3, "P1_AD_1ST");
    processServe(p1, 2, 3, "P1_AD_2ND");

    processServe(p2, 1, 1, "P2_DE_1ST");
    processServe(p2, 2, 1, "P2_DE_2ND");
    processServe(p2, 1, 3, "P2_AD_1ST");
    processServe(p2, 2, 3, "P2_AD_2ND");

    // --- 2. PROCESS RALLIES ---
    const processRally = (player: string, fromCourt: number, prefix: string) => {
        const rally = matchStats.rallyOutcomes.find(r => r.hittingPlayer === player && r.fromCourt === fromCourt);
        
        if (!rally) {
        const fallback = validateWeights([0, 0, 0, 0, 0]);
        modelParams[`${prefix}_WIN`] = fallback[0];
        modelParams[`${prefix}_CC`] = fallback[1];
        modelParams[`${prefix}_DL`] = fallback[2];
        modelParams[`${prefix}_ERR`] = fallback[3];
        return;
        }

        const rawCounts = validateWeights([
        safeInt(rally.rallyWinners),
        safeInt(rally.crosscourt),
        safeInt(rally.downLine),
        safeInt(rally.rallyErrors)
        ]);
        
        modelParams[`${prefix}_WIN`] = rawCounts[0];
        modelParams[`${prefix}_CC`] = rawCounts[1];
        modelParams[`${prefix}_DL`] = rawCounts[2];
        modelParams[`${prefix}_ERR`] = rawCounts[3];
    };

    processRally(p1, 1, "P1RALLY_DE");
    processRally(p1, 3, "P1RALLY_AD");
    processRally(p2, 1, "P2RALLY_DE");
    processRally(p2, 3, "P2RALLY_AD");

    // --- 3. PROCESS RETURNS ---
    const processReturn = (player: string, fromCourt: number, prevDir: number, prefix: string) => {
        const ret = matchStats.returnOutcomes.find(r => r.returningPlayer === player && r.fromCourt === fromCourt && r.prevDirection === prevDir);
        
        if (!ret) {
        const fallback = validateWeights([0, 0, 0, 0]);
        modelParams[`${prefix}_WIN`] = fallback[0];
        modelParams[`${prefix}_CC`] = fallback[1];
        modelParams[`${prefix}_DL`] = fallback[2];
        modelParams[`${prefix}_ERR`] = fallback[3];
        return;
        }

        const win = safeInt(ret.returnWinners);
        const err = safeInt(ret.returnErrors);
        const inPlay = safeInt(ret.returnInPlay);

        const cc = Math.floor(inPlay / 2);
        const dl = Math.ceil(inPlay / 2);

        const rawCounts = validateWeights([win, cc, dl, err]);

        modelParams[`${prefix}_WIN`] = rawCounts[0];
        modelParams[`${prefix}_CC`] = rawCounts[1];
        modelParams[`${prefix}_DL`] = rawCounts[2];
        modelParams[`${prefix}_ERR`] = rawCounts[3];
    };

    processReturn(p2, 1, 6, "P2RET_DE_T");
    processReturn(p2, 1, 4, "P2RET_DE_WIDE");
    processReturn(p2, 3, 6, "P2RET_AD_T");
    processReturn(p2, 3, 4, "P2RET_AD_WIDE");
    
    processReturn(p1, 1, 6, "P1RET_DE_T");
    processReturn(p1, 1, 4, "P1RET_DE_WIDE");
    processReturn(p1, 3, 6, "P1RET_AD_T");
    processReturn(p1, 3, 4, "P1RET_AD_WIDE");

    return modelParams;
    }