export interface Driver {
  id: string;
  name: string;
  team: string;
}

export interface Constructor {
  id: string;
  name: string;
}

export interface Category {
  key: keyof SeasonPredictions;
  label: string;
  description: string;
  type: "driver" | "constructor";
}

export interface SeasonPredictions {
  wdcWinner: string | null;
  wccWinner: string | null;
  mostWins: string | null;
  mostPoles: string | null;
  mostPodiums: string | null;
  mostDnfsDriver: string | null;
  mostDnfsConstructor: string | null;
}

export interface MidseasonPredictions {
  wdcWinner: string | null;
  wccWinner: string | null;
}

export interface RacePrediction {
  qualPole: string | null;
  qualP2: string | null;
  qualP3: string | null;
  raceWinner: string | null;
  raceP2: string | null;
  raceP3: string | null;
  raceP4: string | null;
  raceP5: string | null;
  raceP6: string | null;
  fastestLap: string | null;
  safetyCar: boolean | null;
  boostedPredictions: string[];
  sprintQualPole: string | null;
  sprintQualP2: string | null;
  sprintQualP3: string | null;
  sprintWinner: string | null;
  sprintP2: string | null;
  sprintP3: string | null;
}

export interface RaceResult {
  round: number;
  qualPole: string | null; qualP2: string | null; qualP3: string | null;
  raceWinner: string | null; raceP2: string | null; raceP3: string | null;
  raceP4: string | null; raceP5: string | null; raceP6: string | null;
  fastestLap: string | null; safetyCar: boolean | null;
  sprintQualPole: string | null; sprintQualP2: string | null; sprintQualP3: string | null;
  sprintWinner: string | null; sprintP2: string | null; sprintP3: string | null;
  fetchedAt: string | null;
  manuallyOverridden: boolean;
  updatedAt: string;
}

export interface ScoreBreakdown {
  qualPole: number; qualP2: number; qualP3: number;
  raceWinner: number; raceP2: number; raceP3: number;
  raceP4: number; raceP5: number; raceP6: number;
  fastestLap: number; safetyCar: number;
  sprintQualPole: number; sprintQualP2: number; sprintQualP3: number;
  sprintWinner: number; sprintP2: number; sprintP3: number;
}

export type WildcardQuestionType = 'driver' | 'constructor' | 'boolean' | 'battle';

export interface RaceWildcard {
  id: string;
  round: number;
  question: string;
  questionType: WildcardQuestionType;
  /** For 'battle' type: the two drivers to choose between. Null for other types. */
  options: { id: string; name: string }[] | null;
  points: number;
  correctAnswer: string | null;
  displayOrder: number;
}

export interface WildcardPrediction {
  wildcardId: string;
  pickValue: string;
  boosted: boolean;
}

export interface RaceScore {
  round: number; userId: string; totalPoints: number; breakdown: ScoreBreakdown;
}

export interface LeaderboardEntry {
  userId: string; displayName: string | null; favTeam1: string | null;
  totalPoints: number;
  /** Race rounds with a result that had a deduped pick row. Wildcards do not increment this. */
  roundsScored: number;
  /** Competition rank (1-based); tied totals share the same rank (e.g. 1, 1, 3). */
  rank: number;
  scoresByRound: Record<number, number>;
  breakdownsByRound: Record<number, ScoreBreakdown>;
}
