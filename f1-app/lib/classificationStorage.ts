import type { Firestore } from "firebase/firestore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import type {
  ClassificationEntry,
  ClassificationSession,
  RaceClassification,
} from "./types";

export function classificationDocId(
  round: number,
  session: ClassificationSession
): string {
  return `${round}_${session}`;
}

function parseEntries(raw: unknown): ClassificationEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const driverId = typeof r.driverId === "string" ? r.driverId : null;
      const position = typeof r.position === "number" ? r.position : null;
      if (!driverId || position == null) return null;
      return {
        position,
        driverId,
        pointsAwarded: typeof r.pointsAwarded === "number" ? r.pointsAwarded : 0,
        status:
          r.status === "dnf" ||
          r.status === "dns" ||
          r.status === "dsq" ||
          r.status === "classified" ||
          r.status === "unknown"
            ? r.status
            : "classified",
      } satisfies ClassificationEntry;
    })
    .filter((e): e is ClassificationEntry => e != null)
    .sort((a, b) => a.position - b.position);
}

function dbRowToClassification(
  row: Record<string, unknown>,
  fallbackRound: number,
  fallbackSession: ClassificationSession
): RaceClassification {
  const session =
    row.session === "sprint" || row.session === "race"
      ? row.session
      : fallbackSession;
  return {
    round: typeof row.round === "number" ? row.round : fallbackRound,
    session,
    entries: parseEntries(row.entries),
    incomplete: Boolean(row.incomplete),
    fetchedAt: (row.fetched_at as string | null) ?? null,
    manuallyOverridden: Boolean(row.manually_overridden),
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

export async function loadClassification(
  round: number,
  session: ClassificationSession,
  db: Firestore
): Promise<RaceClassification | null> {
  const ref = doc(db, "race_classifications", classificationDocId(round, session));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return dbRowToClassification(snap.data() as Record<string, unknown>, round, session);
}

export async function loadAllClassifications(
  db: Firestore
): Promise<RaceClassification[]> {
  const q = query(collection(db, "race_classifications"), orderBy("round", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const parts = d.id.split("_");
    const round =
      typeof data.round === "number" ? data.round : parseInt(parts[0] ?? "0", 10);
    const session: ClassificationSession =
      data.session === "sprint" || parts[1] === "sprint" ? "sprint" : "race";
    return dbRowToClassification(data, round, session);
  });
}

export async function saveClassification(
  classification: RaceClassification,
  db: Firestore,
  manuallyOverridden = false
): Promise<void> {
  const ref = doc(
    db,
    "race_classifications",
    classificationDocId(classification.round, classification.session)
  );
  await setDoc(
    ref,
    {
      round: classification.round,
      session: classification.session,
      entries: classification.entries,
      incomplete: classification.incomplete,
      fetched_at: classification.fetchedAt,
      manually_overridden: manuallyOverridden,
      updated_at: new Date().toISOString(),
    },
    { merge: true }
  );
}
