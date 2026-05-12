import type { DriverRef, HistoricalResult } from "./openf1Intel";

// ─── Driver helpers ────────────────────────────────────────────────────────────

function dr(driverId: string | null, rawName: string): DriverRef {
  return { driverId, rawName };
}

// 2026 grid
const MV = dr("max-verstappen",    "Max Verstappen");
const LH = dr("lewis-hamilton",    "Lewis Hamilton");
const CL = dr("charles-leclerc",  "Charles Leclerc");
const GR = dr("george-russell",   "George Russell");
const KA = dr("kimi-antonelli",   "Kimi Antonelli");
const LN = dr("lando-norris",     "Lando Norris");
const OP = dr("oscar-piastri",    "Oscar Piastri");
const FA = dr("fernando-alonso",  "Fernando Alonso");
const CS = dr("carlos-sainz",     "Carlos Sainz");
const NH = dr("nico-hulkenberg",  "Nico Hülkenberg");
const LL = dr("liam-lawson",      "Liam Lawson");
const EO = dr("esteban-ocon",     "Esteban Ocon");
const SP = dr("sergio-perez",     "Sergio Pérez");
const IH = dr("isack-hadjar",     "Isack Hadjar");
const PG = dr("pierre-gasly",     "Pierre Gasly");

// Not on 2026 grid
const DRI = dr(null, "Daniel Ricciardo");
const KMG = dr(null, "Kevin Magnussen");
const YT  = dr(null, "Yuki Tsunoda");

// ─── Helpers ───────────────────────────────────────────────────────────────────

type SprintResult = {
  sprintQualPole: DriverRef; sprintQualP2: DriverRef; sprintQualP3: DriverRef;
  sprintWinner:   DriverRef; sprintP2:     DriverRef; sprintP3:     DriverRef;
};

function r(
  year: number,
  qual:  [DriverRef | null, DriverRef | null, DriverRef | null],
  race:  [DriverRef | null, DriverRef | null, DriverRef | null],
  fl:    DriverRef | null,
  sc:    boolean | null,
  sprint?: SprintResult,
): HistoricalResult {
  return {
    year, available: true,
    qualPole: qual[0], qualP2: qual[1], qualP3: qual[2],
    raceWinner: race[0], raceP2: race[1], raceP3: race[2],
    fastestLap: fl, safetyCar: sc,
    sprintQualPole: sprint?.sprintQualPole ?? null,
    sprintQualP2:   sprint?.sprintQualP2   ?? null,
    sprintQualP3:   sprint?.sprintQualP3   ?? null,
    sprintWinner:   sprint?.sprintWinner   ?? null,
    sprintP2:       sprint?.sprintP2       ?? null,
    sprintP3:       sprint?.sprintP3       ?? null,
  };
}

function unavailable(year: number): HistoricalResult {
  return {
    year, available: false,
    qualPole: null, qualP2: null, qualP3: null,
    raceWinner: null, raceP2: null, raceP3: null,
    fastestLap: null, safetyCar: null,
    sprintQualPole: null, sprintQualP2: null, sprintQualP3: null,
    sprintWinner: null, sprintP2: null, sprintP3: null,
  };
}

// ─── Data — indexed by 2026 round number ──────────────────────────────────────
// SC = true means full physical Safety Car deployed (not VSC/Virtual).
// Sprint fields present only when that year's race at that circuit was a sprint weekend.

const DATA: Record<number, { 2024: HistoricalResult; 2025: HistoricalResult }> = {

  // ── R1 Australia ─────────────────────────────────────────────────────────────
  1: {
    2024: r(2024, [MV, CS, CL], [CS, CL, LN], CL,   false),
    2025: r(2025, [LN, OP, MV], [LN, MV, GR], LN,   true),
  },

  // ── R2 China (Sprint in 2024 & 2025) ─────────────────────────────────────────
  2: {
    2024: r(2024, [MV, SP, FA], [MV, LN, SP], FA, true, {
      sprintQualPole: LN, sprintQualP2: LH, sprintQualP3: FA,
      sprintWinner:   MV, sprintP2:     LH, sprintP3:     SP,
    }),
    2025: r(2025, [OP, GR, LN], [OP, LN, GR], null, false, {
      sprintQualPole: LH, sprintQualP2: MV, sprintQualP3: OP,
      sprintWinner:   LH, sprintP2:     OP, sprintP3:     MV,
    }),
  },

  // ── R3 Japan ─────────────────────────────────────────────────────────────────
  3: {
    2024: r(2024, [MV, SP, LN], [MV, SP, CS], MV,   true),
    2025: r(2025, [MV, LN, OP], [MV, LN, OP], KA,   false),
  },

  // ── R4 Bahrain ───────────────────────────────────────────────────────────────
  4: {
    2024: r(2024, [MV, CL, GR], [MV, SP, CS], MV,   false),
    2025: r(2025, [OP, CL, GR], [OP, GR, LN], null, true),
  },

  // ── R5 Saudi Arabia ──────────────────────────────────────────────────────────
  5: {
    2024: r(2024, [MV, CL, SP], [MV, SP, CL], CL,   true),
    2025: r(2025, [MV, OP, GR], [OP, MV, CL], null, true),
  },

  // ── R6 Miami (Sprint in 2024 & 2025) ─────────────────────────────────────────
  6: {
    2024: r(2024, [MV, CL, CS], [LN, MV, CL], OP, true, {
      sprintQualPole: MV, sprintQualP2: CL, sprintQualP3: SP,
      sprintWinner:   MV, sprintP2:     CL, sprintP3:     SP,
    }),
    2025: r(2025, [MV, LN, KA], [OP, LN, GR], null, false, {
      sprintQualPole: KA, sprintQualP2: OP, sprintQualP3: LN,
      sprintWinner:   LN, sprintP2:     OP, sprintP3:     LH,
    }),
  },

  // ── R7 Canada (not a sprint in 2024 or 2025) ─────────────────────────────────
  7: {
    2024: r(2024, [GR, MV, LN], [MV, LN, GR], LH,   true),
    2025: r(2025, [GR, MV, OP], [GR, MV, KA], null, true),
  },

  // ── R8 Monaco ────────────────────────────────────────────────────────────────
  8: {
    2024: r(2024, [CL, OP, CS], [CL, OP, CS], LH,   true),
    2025: r(2025, [LN, CL, OP], [LN, CL, OP], LN,   false),
  },

  // ── R9 Spain ─────────────────────────────────────────────────────────────────
  9: {
    2024: r(2024, [LN, MV, LH], [MV, LN, LH], MV,   false),
    2025: r(2025, [OP, LN, MV], [OP, LN, CL], null, true),
  },

  // ── R10 Austria (Sprint in 2024 only) ────────────────────────────────────────
  10: {
    2024: r(2024, [MV, LN, GR], [GR, OP, CS], FA, false, {
      sprintQualPole: MV, sprintQualP2: LN, sprintQualP3: OP,
      sprintWinner:   MV, sprintP2:     OP, sprintP3:     LN,
    }),
    2025: r(2025, [LN, CL, OP], [LN, OP, CL], null, true),
  },

  // ── R11 Britain (not a sprint in 2024 or 2025) ───────────────────────────────
  11: {
    2024: r(2024, [GR, LH, LN],     [LH, MV, LN], CS,   true),
    2025: r(2025, [MV, null, null],  [LN, OP, NH], null, true),
  },

  // ── R12 Belgium (Sprint in 2025 only) ────────────────────────────────────────
  12: {
    2024: r(2024, [CL, SP, LH], [LH, OP, CL], SP,   false),
    2025: r(2025, [LN, OP, CL], [OP, LN, CL], null, true, {
      sprintQualPole: OP, sprintQualP2: MV, sprintQualP3: LN,
      sprintWinner:   MV, sprintP2:     OP, sprintP3:     LN,
    }),
  },

  // ── R13 Hungary ──────────────────────────────────────────────────────────────
  13: {
    2024: r(2024, [LN, OP, MV], [OP, LN, LH], GR,   false),
    2025: r(2025, [CL, OP, LN], [LN, OP, GR], null, false),
  },

  // ── R14 Netherlands (not a sprint in 2024 or 2025) ───────────────────────────
  14: {
    2024: r(2024, [LN, MV, OP], [LN, MV, CL], LN,   false),
    2025: r(2025, [OP, LN, MV], [OP, MV, IH], null, true),
  },

  // ── R15 Italy / Monza ────────────────────────────────────────────────────────
  15: {
    2024: r(2024, [LN, OP, GR], [CL, OP, LN], LN,   false),
    2025: r(2025, [MV, LN, OP], [MV, LN, OP], null, false),
  },

  // ── R16 Madrid (new 2026 circuit — no history) ───────────────────────────────
  16: {
    2024: unavailable(2024),
    2025: unavailable(2025),
  },

  // ── R17 Azerbaijan ───────────────────────────────────────────────────────────
  17: {
    2024: r(2024, [CL, OP, CS], [OP, CL, GR], LN,   false),
    2025: r(2025, [MV, CS, LL], [MV, GR, CS], MV,   true),
  },

  // ── R18 Singapore (not a sprint in 2024 or 2025) ─────────────────────────────
  18: {
    2024: r(2024, [LN, MV, LH], [LN, MV, OP], DRI,  false),
    2025: r(2025, [GR, MV, OP], [GR, MV, LN], LH,   true),
  },

  // ── R19 USA / COTA (Sprint in 2024 & 2025) ───────────────────────────────────
  19: {
    2024: r(2024, [LN, MV, CS], [CL, CS, MV], EO, true, {
      sprintQualPole: MV, sprintQualP2: GR, sprintQualP3: CL,
      sprintWinner:   MV, sprintP2:     CS, sprintP3:     LN,
    }),
    2025: r(2025, [MV, LN, CL], [MV, LN, CL], null, false, {
      sprintQualPole: MV, sprintQualP2: LN, sprintQualP3: OP,
      sprintWinner:   MV, sprintP2:     GR, sprintP3:     CS,
    }),
  },

  // ── R20 Mexico ───────────────────────────────────────────────────────────────
  20: {
    2024: r(2024, [CS, MV, LN], [CS, LN, CL], CL,   false),
    2025: r(2025, [LN, CL, LH], [LN, CL, MV], null, false),
  },

  // ── R21 Brazil (Sprint in 2024 & 2025) ───────────────────────────────────────
  21: {
    2024: r(2024, [LN, GR, YT], [MV, EO, PG], MV, true, {
      sprintQualPole: OP, sprintQualP2: LN, sprintQualP3: CL,
      sprintWinner:   LN, sprintP2:     OP, sprintP3:     CL,
    }),
    2025: r(2025, [LN, KA, CL], [LN, KA, MV], null, true, {
      sprintQualPole: LN, sprintQualP2: KA, sprintQualP3: OP,
      sprintWinner:   LN, sprintP2:     KA, sprintP3:     GR,
    }),
  },

  // ── R22 Las Vegas ────────────────────────────────────────────────────────────
  22: {
    2024: r(2024, [GR, CS, PG], [GR, LH, CS], LN,   false),
    2025: r(2025, [LN, MV, CS], [MV, GR, KA], MV,   false),
  },

  // ── R23 Qatar (Sprint in 2024 & 2025) ────────────────────────────────────────
  23: {
    2024: r(2024, [GR, MV, LN], [MV, CL, OP], MV, true, {
      sprintQualPole: LN, sprintQualP2: GR, sprintQualP3: OP,
      sprintWinner:   OP, sprintP2:     LN, sprintP3:     GR,
    }),
    2025: r(2025, [OP, LN, MV], [MV, OP, CS], null, true, {
      sprintQualPole: OP, sprintQualP2: GR, sprintQualP3: LN,
      sprintWinner:   OP, sprintP2:     GR, sprintP3:     LN,
    }),
  },

  // ── R24 Abu Dhabi ────────────────────────────────────────────────────────────
  24: {
    2024: r(2024, [LN, OP, CS], [LN, CS, CL], KMG,  true),
    2025: r(2025, [MV, LN, OP], [MV, OP, LN], null, false),
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getStaticHistoricalResult(round: number, year: 2024 | 2025): HistoricalResult {
  return DATA[round]?.[year] ?? unavailable(year);
}

