import type { Firestore } from "firebase/firestore";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import type { SeasonPredictions } from "./types";

const DEFAULT_PREDICTIONS: SeasonPredictions = {
  wdcWinner: null,
  wccWinner: null,
  mostWins: null,
  mostPoles: null,
  mostPodiums: null,
  mostDnfsDriver: null,
  mostDnfsConstructor: null,
};

const KEY_MAP: Record<keyof SeasonPredictions, string> = {
  wdcWinner: "wdc_winner",
  wccWinner: "wcc_winner",
  mostWins: "most_wins",
  mostPoles: "most_poles",
  mostPodiums: "most_podiums",
  mostDnfsDriver: "most_dnfs_driver",
  mostDnfsConstructor: "most_dnfs_constructor",
};

function dbRowToPredictions(row: Record<string, string | null>): SeasonPredictions {
  return {
    wdcWinner: row.wdc_winner ?? null,
    wccWinner: row.wcc_winner ?? null,
    mostWins: row.most_wins ?? null,
    mostPoles: row.most_poles ?? null,
    mostPodiums: row.most_podiums ?? null,
    mostDnfsDriver: row.most_dnfs_driver ?? null,
    mostDnfsConstructor: row.most_dnfs_constructor ?? null,
  };
}

export async function loadPredictions(userId: string, db: Firestore): Promise<SeasonPredictions> {
  const ref = doc(db, "season_picks", userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ...DEFAULT_PREDICTIONS };
  return dbRowToPredictions(snap.data() as Record<string, string | null>);
}

export async function savePrediction(
  userId: string,
  key: keyof SeasonPredictions,
  value: string | null,
  db: Firestore
): Promise<void> {
  const column = KEY_MAP[key];
  const ref = doc(db, "season_picks", userId);
  await setDoc(
    ref,
    {
      user_id: userId,
      [column]: value,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function clearPredictions(userId: string, db: Firestore): Promise<void> {
  await deleteDoc(doc(db, "season_picks", userId));
}
