import type { RacePick, RaceResult, RaceScore, ScoreBreakdown, LeaderboardEntry } from "./types";

export const PICK_POINTS: Record<keyof ScoreBreakdown, number> = {
  qualPole: 5,   qualP2: 3,    qualP3: 1,
  raceWinner: 25, raceP2: 18,  raceP3: 15,
  fastestLap: 5,  safetyCar: 5,
  sprintQualPole: 5, sprintQualP2: 3, sprintQualP3: 1,
  sprintWinner: 8,   sprintP2: 7,    sprintP3: 6,
};

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

  const breakdown: ScoreBreakdown = {
    qualPole:     pts(pick.qualPole,     result.qualPole,     "qualPole"),
    qualP2:       pts(pick.qualP2,       result.qualP2,       "qualP2"),
    qualP3:       pts(pick.qualP3,       result.qualP3,       "qualP3"),
    raceWinner:   pts(pick.raceWinner,   result.raceWinner,   "raceWinner"),
    raceP2:       pts(pick.raceP2,       result.raceP2,       "raceP2"),
    raceP3:       pts(pick.raceP3,       result.raceP3,       "raceP3"),
    fastestLap:   pts(pick.fastestLap,   result.fastestLap,   "fastestLap"),
    safetyCar:    pts(pick.safetyCar,    result.safetyCar,    "safetyCar"),
    sprintQualPole: pts(pick.sprintQualPole, result.sprintQualPole, "sprintQualPole"),
    sprintQualP2:   pts(pick.sprintQualP2,   result.sprintQualP2,   "sprintQualP2"),
    sprintQualP3:   pts(pick.sprintQualP3,   result.sprintQualP3,   "sprintQualP3"),
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
