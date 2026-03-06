import type { RacePick, RaceResult, RaceScore, ScoreBreakdown, LeaderboardEntry } from "./types";

export const PICK_POINTS: Record<keyof ScoreBreakdown, number> = {
  qualPole: 8,   qualP2: 5,    qualP3: 3,
  raceWinner: 25, raceP2: 18,  raceP3: 15,
  fastestLap: 5,  safetyCar: 5,
  sprintQualPole: 8, sprintQualP2: 5, sprintQualP3: 3,
  sprintWinner: 8,   sprintP2: 7,    sprintP3: 6,
};

// Points awarded when a driver is picked for the wrong qualifying slot but still appears in the top 3
const QUAL_PARTIAL_POINTS = 2;

export function scoreRound(
  userId: string,
  pick: RacePick,
  result: RaceResult
): RaceScore {
  function pts(pickVal: string | boolean | null, resultVal: string | boolean | null, key: keyof ScoreBreakdown): number {
    // If result not yet available, no points awarded (no penalty)
    if (resultVal === null || resultVal === undefined) return 0;
    if (pickVal === null || pickVal === undefined) return 0;
    return pickVal === resultVal ? PICK_POINTS[key] : 0;
  }

  // Qualifying slots award full points for exact position, partial credit if the
  // picked driver appears in one of the other two qualifying positions.
  function qualPts(
    pickVal: string | null,
    exactResult: string | null,
    otherResults: (string | null)[],
    key: keyof ScoreBreakdown
  ): number {
    if (exactResult === null || exactResult === undefined) return 0;
    if (pickVal === null || pickVal === undefined) return 0;
    if (pickVal === exactResult) return PICK_POINTS[key];
    if (otherResults.some((r) => r !== null && r === pickVal)) return QUAL_PARTIAL_POINTS;
    return 0;
  }

  const breakdown: ScoreBreakdown = {
    qualPole: qualPts(pick.qualPole, result.qualPole, [result.qualP2,      result.qualP3],      "qualPole"),
    qualP2:   qualPts(pick.qualP2,   result.qualP2,   [result.qualPole,    result.qualP3],      "qualP2"),
    qualP3:   qualPts(pick.qualP3,   result.qualP3,   [result.qualPole,    result.qualP2],      "qualP3"),
    raceWinner:   pts(pick.raceWinner,   result.raceWinner,   "raceWinner"),
    raceP2:       pts(pick.raceP2,       result.raceP2,       "raceP2"),
    raceP3:       pts(pick.raceP3,       result.raceP3,       "raceP3"),
    fastestLap:   pts(pick.fastestLap,   result.fastestLap,   "fastestLap"),
    safetyCar:    pts(pick.safetyCar,    result.safetyCar,    "safetyCar"),
    sprintQualPole: qualPts(pick.sprintQualPole, result.sprintQualPole, [result.sprintQualP2,   result.sprintQualP3], "sprintQualPole"),
    sprintQualP2:   qualPts(pick.sprintQualP2,   result.sprintQualP2,   [result.sprintQualPole, result.sprintQualP3], "sprintQualP2"),
    sprintQualP3:   qualPts(pick.sprintQualP3,   result.sprintQualP3,   [result.sprintQualPole, result.sprintQualP2], "sprintQualP3"),
    sprintWinner:   pts(pick.sprintWinner,   result.sprintWinner,   "sprintWinner"),
    sprintP2:       pts(pick.sprintP2,       result.sprintP2,       "sprintP2"),
    sprintP3:       pts(pick.sprintP3,       result.sprintP3,       "sprintP3"),
  };

  const totalPoints = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  return { round: result.round, userId, totalPoints, breakdown };
}

export function buildLeaderboard(
  allPicks: Array<{ userId: string; round: number; pick: RacePick }>,
  allResults: RaceResult[],
  profiles: Array<{ id: string; display_name: string | null; fav_team_1: string | null }>
): LeaderboardEntry[] {
  const resultMap = new Map(allResults.map((r) => [r.round, r]));

  // Build per-user score accumulator
  const userMap = new Map<string, { totalPoints: number; roundsScored: number; scoresByRound: Record<number, number> }>();

  for (const { userId, round, pick } of allPicks) {
    const result = resultMap.get(round);
    if (!result) continue;

    const score = scoreRound(userId, pick, result);
    if (!userMap.has(userId)) {
      userMap.set(userId, { totalPoints: 0, roundsScored: 0, scoresByRound: {} });
    }
    const entry = userMap.get(userId)!;
    entry.totalPoints += score.totalPoints;
    entry.roundsScored += 1;
    entry.scoresByRound[round] = score.totalPoints;
  }

  const entries: LeaderboardEntry[] = profiles.map((p) => {
    const scores = userMap.get(p.id) ?? { totalPoints: 0, roundsScored: 0, scoresByRound: {} };
    return {
      userId: p.id,
      displayName: p.display_name,
      favTeam1: p.fav_team_1,
      totalPoints: scores.totalPoints,
      roundsScored: scores.roundsScored,
      scoresByRound: scores.scoresByRound,
    };
  });

  return entries.sort((a, b) => b.totalPoints - a.totalPoints);
}
