import type { Firestore } from "firebase/firestore";
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import type { RaceWildcard, WildcardPrediction, WildcardQuestionType } from "./types";

function wcPickDocId(userId: string, wildcardId: string): string {
  return `${userId}_${wildcardId}`;
}

function dbRowToWildcard(id: string, row: Record<string, unknown>): RaceWildcard {
  return {
    id,
    round: row.round as number,
    question: row.question as string,
    questionType: row.question_type as WildcardQuestionType,
    options: (row.options as { id: string; name: string }[] | null) ?? null,
    points: row.points as number,
    correctAnswer: (row.correct_answer as string | null) ?? null,
    displayOrder: row.display_order as number,
  };
}

export async function loadWildcards(round: number, db: Firestore): Promise<RaceWildcard[]> {
  const q = query(
    collection(db, "race_wildcards"),
    where("round", "==", round),
    orderBy("display_order", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => dbRowToWildcard(d.id, d.data() as Record<string, unknown>));
}

export async function loadWildcardPredictions(
  userId: string,
  round: number,
  db: Firestore
): Promise<WildcardPrediction[]> {
  const wcSnap = await getDocs(
    query(collection(db, "race_wildcards"), where("round", "==", round))
  );
  const ids = new Set(wcSnap.docs.map((d) => d.id));
  const picksSnap = await getDocs(
    query(collection(db, "wildcard_picks"), where("user_id", "==", userId))
  );
  const out: WildcardPrediction[] = [];
  picksSnap.forEach((d) => {
    const row = d.data();
    const wid = row.wildcard_id as string;
    if (!ids.has(wid)) return;
    out.push({
      wildcardId: wid,
      pickValue: row.pick_value as string,
      boosted: row.boosted as boolean,
    });
  });
  return out;
}

export async function saveWildcardPick(
  userId: string,
  wildcardId: string,
  pickValue: string,
  boosted: boolean,
  round: number,
  db: Firestore
): Promise<void> {
  const ref = doc(db, "wildcard_picks", wcPickDocId(userId, wildcardId));
  await setDoc(ref, {
    user_id: userId,
    wildcard_id: wildcardId,
    round,
    pick_value: pickValue,
    boosted,
  });
}

export async function deleteWildcardPick(
  userId: string,
  wildcardId: string,
  db: Firestore
): Promise<void> {
  await deleteDoc(doc(db, "wildcard_picks", wcPickDocId(userId, wildcardId)));
}
