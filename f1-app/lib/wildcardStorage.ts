import type { Firestore } from "firebase/firestore";
import {
  doc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
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
    tolerance: (row.tolerance as number | null) ?? null,
    unit: (row.unit as string | null) ?? null,
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
  const picksSnap = await getDocs(
    query(
      collection(db, "wildcard_picks"),
      where("user_id", "==", userId),
      where("round", "==", round)
    )
  );
  const out: WildcardPrediction[] = [];
  picksSnap.forEach((d) => {
    const row = d.data();
    out.push({
      wildcardId: row.wildcard_id as string,
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

export async function createWildcard(
  round: number,
  data: {
    question: string;
    questionType: WildcardQuestionType;
    options?: { id: string; name: string }[] | null;
    points?: number;
    displayOrder?: number;
    tolerance?: number | null;
    unit?: string | null;
  },
  db: Firestore
): Promise<RaceWildcard> {
  const ref = await addDoc(collection(db, "race_wildcards"), {
    round,
    question: data.question,
    question_type: data.questionType,
    options: data.options ?? null,
    points: data.points ?? 10,
    display_order: data.displayOrder ?? 0,
    correct_answer: null,
    tolerance: data.tolerance ?? null,
    unit: data.unit ?? null,
    created_at: new Date().toISOString(),
  });
  return {
    id: ref.id,
    round,
    question: data.question,
    questionType: data.questionType,
    options: data.options ?? null,
    points: data.points ?? 10,
    correctAnswer: null,
    displayOrder: data.displayOrder ?? 0,
    tolerance: data.tolerance ?? null,
    unit: data.unit ?? null,
  };
}

export async function updateWildcard(
  id: string,
  updates: {
    question?: string;
    questionType?: WildcardQuestionType;
    options?: { id: string; name: string }[] | null;
    points?: number;
    correctAnswer?: string | null;
    displayOrder?: number;
    tolerance?: number | null;
    unit?: string | null;
  },
  db: Firestore
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (updates.question !== undefined) payload.question = updates.question;
  if (updates.questionType !== undefined) payload.question_type = updates.questionType;
  if (updates.options !== undefined) payload.options = updates.options;
  if (updates.points !== undefined) payload.points = updates.points;
  if (updates.correctAnswer !== undefined) payload.correct_answer = updates.correctAnswer;
  if (updates.displayOrder !== undefined) payload.display_order = updates.displayOrder;
  if (updates.tolerance !== undefined) payload.tolerance = updates.tolerance;
  if (updates.unit !== undefined) payload.unit = updates.unit;
  await updateDoc(doc(db, "race_wildcards", id), payload);
}

export async function deleteWildcard(id: string, db: Firestore): Promise<void> {
  await deleteDoc(doc(db, "race_wildcards", id));
}
