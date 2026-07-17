import { CONSTRUCTORS, DRIVERS } from "./data";
import type {
  ChampionshipStanding,
  ClassificationEntry,
  ClassificationStatus,
  RaceClassification,
  RaceResult,
} from "./types";

/** Official F1 race points (P1–P10). Fastest-lap bonus not used (current regulations). */
export const RACE_POINTS: number[] = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

/** Official F1 sprint points (P1–P8). */
export const SPRINT_POINTS: number[] = [8, 7, 6, 5, 4, 3, 2, 1];

export function racePointsForPosition(position: number): number {
  if (position < 1 || position > RACE_POINTS.length) return 0;
  return RACE_POINTS[position - 1];
}

export function sprintPointsForPosition(position: number): number {
  if (position < 1 || position > SPRINT_POINTS.length) return 0;
  return SPRINT_POINTS[position - 1];
}

export function pointsForSession(
  session: "race" | "sprint",
  position: number,
  status: ClassificationStatus = "classified"
): number {
  if (status !== "classified") return 0;
  return session === "sprint"
    ? sprintPointsForPosition(position)
    : racePointsForPosition(position);
}

export function constructorIdForDriver(driverId: string): string | null {
  const driver = DRIVERS.find((d) => d.id === driverId);
  if (!driver) return null;
  const ctor = CONSTRUCTORS.find((c) => c.name === driver.team);
  return ctor?.id ?? null;
}

/** Build a partial race classification from prediction-shaped RaceResult (top 6). */
export function classificationFromRaceResult(
  result: RaceResult
): RaceClassification | null {
  const slots = [
    result.raceWinner,
    result.raceP2,
    result.raceP3,
    result.raceP4,
    result.raceP5,
    result.raceP6,
  ];
  const entries: ClassificationEntry[] = [];
  for (let i = 0; i < slots.length; i++) {
    const driverId = slots[i];
    if (!driverId) continue;
    const position = i + 1;
    entries.push({
      position,
      driverId,
      pointsAwarded: racePointsForPosition(position),
      status: "classified",
    });
  }
  if (entries.length === 0) return null;
  return {
    round: result.round,
    session: "race",
    entries,
    incomplete: true,
    fetchedAt: result.fetchedAt,
    manuallyOverridden: result.manuallyOverridden,
    updatedAt: result.updatedAt,
  };
}

/** Sprint P1–P3 from prediction-shaped RaceResult. */
export function sprintClassificationFromRaceResult(
  result: RaceResult
): RaceClassification | null {
  const slots = [result.sprintWinner, result.sprintP2, result.sprintP3];
  const entries: ClassificationEntry[] = [];
  for (let i = 0; i < slots.length; i++) {
    const driverId = slots[i];
    if (!driverId) continue;
    const position = i + 1;
    entries.push({
      position,
      driverId,
      pointsAwarded: sprintPointsForPosition(position),
      status: "classified",
    });
  }
  if (entries.length === 0) return null;
  return {
    round: result.round,
    session: "sprint",
    entries,
    incomplete: true,
    fetchedAt: result.fetchedAt,
    manuallyOverridden: result.manuallyOverridden,
    updatedAt: result.updatedAt,
  };
}

/**
 * Merge stored full classifications with fallbacks derived from race_results.
 * Stored docs win when present for the same round+session.
 */
export function mergeClassifications(
  stored: RaceClassification[],
  raceResults: RaceResult[]
): RaceClassification[] {
  const byKey = new Map<string, RaceClassification>();
  for (const c of stored) {
    byKey.set(`${c.round}_${c.session}`, c);
  }
  for (const result of raceResults) {
    const raceKey = `${result.round}_race`;
    if (!byKey.has(raceKey)) {
      const derived = classificationFromRaceResult(result);
      if (derived) byKey.set(raceKey, derived);
    }
    const sprintKey = `${result.round}_sprint`;
    if (!byKey.has(sprintKey)) {
      const derived = sprintClassificationFromRaceResult(result);
      if (derived) byKey.set(sprintKey, derived);
    }
  }
  return [...byKey.values()].sort((a, b) =>
    a.round !== b.round ? a.round - b.round : a.session.localeCompare(b.session)
  );
}

export function aggregateChampionship(
  classifications: RaceClassification[],
  raceResults: RaceResult[] = []
): {
  driverStandings: ChampionshipStanding[];
  constructorStandings: ChampionshipStanding[];
  completedRounds: number[];
} {
  const poleByRound = new Map<number, string>();
  for (const r of raceResults) {
    if (r.qualPole) poleByRound.set(r.round, r.qualPole);
  }

  type Acc = {
    points: number;
    wins: number;
    podiums: number;
    poles: number;
    finishesByRound: Record<number, number | null>;
    pointsByRound: Record<number, number>;
    constructorId: string | null;
  };

  const drivers = new Map<string, Acc>();
  const constructors = new Map<string, Acc>();

  function ensureDriver(id: string): Acc {
    let a = drivers.get(id);
    if (!a) {
      a = {
        points: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        finishesByRound: {},
        pointsByRound: {},
        constructorId: constructorIdForDriver(id),
      };
      drivers.set(id, a);
    }
    return a;
  }

  function ensureCtor(id: string): Acc {
    let a = constructors.get(id);
    if (!a) {
      a = {
        points: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        finishesByRound: {},
        pointsByRound: {},
        constructorId: id,
      };
      constructors.set(id, a);
    }
    return a;
  }

  const completedRounds = new Set<number>();

  for (const clas of classifications) {
    completedRounds.add(clas.round);
    for (const entry of clas.entries) {
      const d = ensureDriver(entry.driverId);
      d.points += entry.pointsAwarded;
      d.pointsByRound[clas.round] =
        (d.pointsByRound[clas.round] ?? 0) + entry.pointsAwarded;

      if (clas.session === "race") {
        d.finishesByRound[clas.round] =
          entry.status === "classified" ? entry.position : null;
        if (entry.status === "classified" && entry.position === 1) d.wins += 1;
        if (entry.status === "classified" && entry.position <= 3) d.podiums += 1;
      }

      const ctorId = d.constructorId ?? constructorIdForDriver(entry.driverId);
      if (ctorId) {
        const c = ensureCtor(ctorId);
        c.points += entry.pointsAwarded;
        c.pointsByRound[clas.round] =
          (c.pointsByRound[clas.round] ?? 0) + entry.pointsAwarded;
        if (clas.session === "race" && entry.status === "classified") {
          if (entry.position === 1) c.wins += 1;
          if (entry.position <= 3) c.podiums += 1;
        }
      }
    }
  }

  for (const [round, driverId] of poleByRound) {
    const d = ensureDriver(driverId);
    d.poles += 1;
    const ctorId = d.constructorId ?? constructorIdForDriver(driverId);
    if (ctorId) ensureCtor(ctorId).poles += 1;
    completedRounds.add(round);
  }

  // Seed all grid drivers with zero rows when any results exist
  if (classifications.length > 0 || raceResults.length > 0) {
    for (const driver of DRIVERS) {
      ensureDriver(driver.id);
    }
    for (const ctor of CONSTRUCTORS) {
      ensureCtor(ctor.id);
    }
  }

  /** FIA countback: most wins, then most 2nds, 3rds, … decides points ties. */
  function countbackCompare(
    a: { finishesByRound: Record<number, number | null> },
    b: { finishesByRound: Record<number, number | null> }
  ): number {
    const countAt = (
      finishes: Record<number, number | null>,
      pos: number
    ): number =>
      Object.values(finishes).filter((p) => p === pos).length;
    for (let pos = 1; pos <= DRIVERS.length; pos++) {
      const diff = countAt(b.finishesByRound, pos) - countAt(a.finishesByRound, pos);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  function rankDrivers(): ChampionshipStanding[] {
    return [...drivers.entries()]
      .map(([id, a]) => {
        const driver = DRIVERS.find((d) => d.id === id);
        return {
          id,
          name: driver?.name ?? id,
          points: a.points,
          wins: a.wins,
          podiums: a.podiums,
          poles: a.poles,
          constructorId: a.constructorId ?? undefined,
          finishesByRound: a.finishesByRound,
          pointsByRound: a.pointsByRound,
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const cb = countbackCompare(a, b);
        if (cb !== 0) return cb;
        return a.name.localeCompare(b.name);
      });
  }

  function rankConstructors(): ChampionshipStanding[] {
    return [...constructors.entries()]
      .map(([id, a]) => {
        const ctor = CONSTRUCTORS.find((c) => c.id === id);
        return {
          id,
          name: ctor?.name ?? id,
          points: a.points,
          wins: a.wins,
          podiums: a.podiums,
          poles: a.poles,
          pointsByRound: a.pointsByRound,
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.name.localeCompare(b.name);
      });
  }

  return {
    driverStandings: rankDrivers(),
    constructorStandings: rankConstructors(),
    completedRounds: [...completedRounds].sort((a, b) => a - b),
  };
}
