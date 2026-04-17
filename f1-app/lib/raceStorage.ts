import type { Firestore } from "firebase/firestore";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import type { RacePrediction } from "./types";

const DEFAULT_RACE_PREDICTION: RacePrediction = {
  qualPole: null,
  qualP2: null,
  qualP3: null,
  raceWinner: null,
  raceP2: null,
  raceP3: null,
  raceP4: null,
  raceP5: null,
  raceP6: null,
  fastestLap: null,
  safetyCar: null,
  boostedPredictions: [],
  sprintQualPole: null,
  sprintQualP2: null,
  sprintQualP3: null,
  sprintWinner: null,
  sprintP2: null,
  sprintP3: null,
};

function pickDocId(userId: string, round: number): string {
  return `${userId}_${round}`;
}

function dbRowToRacePick(row: Record<string, unknown>): RacePrediction {
  return {
    qualPole: (row.qual_pole as string | null) ?? null,
    qualP2: (row.qual_p2 as string | null) ?? null,
    qualP3: (row.qual_p3 as string | null) ?? null,
    raceWinner: (row.race_winner as string | null) ?? null,
    raceP2: (row.race_p2 as string | null) ?? null,
    raceP3: (row.race_p3 as string | null) ?? null,
    raceP4: (row.race_p4 as string | null) ?? null,
    raceP5: (row.race_p5 as string | null) ?? null,
    raceP6: (row.race_p6 as string | null) ?? null,
    fastestLap: (row.fastest_lap as string | null) ?? null,
    safetyCar: (row.safety_car as boolean | null) ?? null,
    boostedPredictions: (row.boosted_picks as string[] | null) ?? [],
    sprintQualPole: (row.sprint_qual_pole as string | null) ?? null,
    sprintQualP2: (row.sprint_qual_p2 as string | null) ?? null,
    sprintQualP3: (row.sprint_qual_p3 as string | null) ?? null,
    sprintWinner: (row.sprint_winner as string | null) ?? null,
    sprintP2: (row.sprint_p2 as string | null) ?? null,
    sprintP3: (row.sprint_p3 as string | null) ?? null,
  };
}

export async function loadRacePick(
  userId: string,
  round: number,
  db: Firestore
): Promise<RacePrediction> {
  const ref = doc(db, "race_picks", pickDocId(userId, round));
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ...DEFAULT_RACE_PREDICTION };
  return dbRowToRacePick(snap.data() as Record<string, unknown>);
}

export async function saveRacePick(
  userId: string,
  round: number,
  predictions: RacePrediction,
  db: Firestore
): Promise<void> {
  const ref = doc(db, "race_picks", pickDocId(userId, round));
  await setDoc(
    ref,
    {
      user_id: userId,
      round,
      qual_pole: predictions.qualPole,
      qual_p2: predictions.qualP2,
      qual_p3: predictions.qualP3,
      race_winner: predictions.raceWinner,
      race_p2: predictions.raceP2,
      race_p3: predictions.raceP3,
      race_p4: predictions.raceP4,
      race_p5: predictions.raceP5,
      race_p6: predictions.raceP6,
      fastest_lap: predictions.fastestLap,
      safety_car: predictions.safetyCar,
      boosted_picks: predictions.boostedPredictions,
      sprint_qual_pole: predictions.sprintQualPole,
      sprint_qual_p2: predictions.sprintQualP2,
      sprint_qual_p3: predictions.sprintQualP3,
      sprint_winner: predictions.sprintWinner,
      sprint_p2: predictions.sprintP2,
      sprint_p3: predictions.sprintP3,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function loadRacePickStatuses(
  userId: string,
  db: Firestore
): Promise<Map<number, number>> {
  const q = query(collection(db, "race_picks"), where("user_id", "==", userId));
  const snap = await getDocs(q);
  const map = new Map<number, number>();
  snap.forEach((d) => {
    const row = d.data();
    const round = row.round as number;
    const count = [
      row.qual_pole,
      row.qual_p2,
      row.qual_p3,
      row.race_winner,
      row.race_p2,
      row.race_p3,
      row.race_p4,
      row.race_p5,
      row.race_p6,
      row.fastest_lap,
      row.safety_car,
      row.sprint_qual_pole,
      row.sprint_qual_p2,
      row.sprint_qual_p3,
      row.sprint_winner,
      row.sprint_p2,
      row.sprint_p3,
    ].filter((v) => v !== null && v !== undefined).length;
    map.set(round, count);
  });
  return map;
}
