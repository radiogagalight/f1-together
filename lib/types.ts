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
  key: keyof SeasonPicks;
  label: string;
  description: string;
  type: "driver" | "constructor";
}

export interface SeasonPicks {
  wdcWinner: string | null;
  wccWinner: string | null;
  mostWins: string | null;
  mostPoles: string | null;
  mostPodiums: string | null;
  firstDnfDriver: string | null;
  firstDnfConstructor: string | null;
}

export interface MidseasonPicks {
  wdcWinner: string | null;
  wccWinner: string | null;
}

export interface RacePick {
  qualPole: string | null;
  qualP2: string | null;
  qualP3: string | null;
  raceWinner: string | null;
  raceP2: string | null;
  raceP3: string | null;
  fastestLap: string | null;
  safetyCar: boolean | null;
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
  fastestLap: number; safetyCar: number;
  sprintQualPole: number; sprintQualP2: number; sprintQualP3: number;
  sprintWinner: number; sprintP2: number; sprintP3: number;
}

export interface RaceScore {
  round: number; userId: string; totalPoints: number; breakdown: ScoreBreakdown;
}

export interface LeaderboardEntry {
  userId: string; displayName: string | null; favTeam1: string | null;
  totalPoints: number; roundsScored: number; scoresByRound: Record<number, number>;
}
