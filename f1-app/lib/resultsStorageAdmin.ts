import { getAdminDb } from "@/lib/firebase/admin";
import type { RaceResult } from "./types";

function dbRowToRaceResult(row: Record<string, unknown>): RaceResult {
  return {
    round: row.round as number,
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
    sprintQualPole: (row.sprint_qual_pole as string | null) ?? null,
    sprintQualP2: (row.sprint_qual_p2 as string | null) ?? null,
    sprintQualP3: (row.sprint_qual_p3 as string | null) ?? null,
    sprintWinner: (row.sprint_winner as string | null) ?? null,
    sprintP2: (row.sprint_p2 as string | null) ?? null,
    sprintP3: (row.sprint_p3 as string | null) ?? null,
    fetchedAt: (row.fetched_at as string | null) ?? null,
    manuallyOverridden: (row.manually_overridden as boolean) ?? false,
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

export async function adminLoadRaceResult(round: number): Promise<RaceResult | null> {
  const snap = await getAdminDb().collection("race_results").doc(String(round)).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  return dbRowToRaceResult({ ...data, round });
}

export async function adminSaveRaceResult(
  round: number,
  result: Partial<RaceResult>,
  manuallyOverridden: boolean
): Promise<void> {
  await getAdminDb()
    .collection("race_results")
    .doc(String(round))
    .set(
      {
        round,
        qual_pole: result.qualPole ?? null,
        qual_p2: result.qualP2 ?? null,
        qual_p3: result.qualP3 ?? null,
        race_winner: result.raceWinner ?? null,
        race_p2: result.raceP2 ?? null,
        race_p3: result.raceP3 ?? null,
        race_p4: result.raceP4 ?? null,
        race_p5: result.raceP5 ?? null,
        race_p6: result.raceP6 ?? null,
        fastest_lap: result.fastestLap ?? null,
        safety_car: result.safetyCar ?? null,
        sprint_qual_pole: result.sprintQualPole ?? null,
        sprint_qual_p2: result.sprintQualP2 ?? null,
        sprint_qual_p3: result.sprintQualP3 ?? null,
        sprint_winner: result.sprintWinner ?? null,
        sprint_p2: result.sprintP2 ?? null,
        sprint_p3: result.sprintP3 ?? null,
        fetched_at: result.fetchedAt ?? null,
        manually_overridden: manuallyOverridden,
        updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
}
