import type { SupabaseClient } from "@supabase/supabase-js";
import type { RaceResult } from "./types";

function dbRowToRaceResult(row: Record<string, unknown>): RaceResult {
  return {
    round:              row.round as number,
    qualPole:           (row.qual_pole           as string | null) ?? null,
    qualP2:             (row.qual_p2             as string | null) ?? null,
    qualP3:             (row.qual_p3             as string | null) ?? null,
    raceWinner:         (row.race_winner         as string | null) ?? null,
    raceP2:             (row.race_p2             as string | null) ?? null,
    raceP3:             (row.race_p3             as string | null) ?? null,
    fastestLap:         (row.fastest_lap         as string | null) ?? null,
    safetyCar:          (row.safety_car          as boolean | null) ?? null,
    sprintQualPole:     (row.sprint_qual_pole    as string | null) ?? null,
    sprintQualP2:       (row.sprint_qual_p2      as string | null) ?? null,
    sprintQualP3:       (row.sprint_qual_p3      as string | null) ?? null,
    sprintWinner:       (row.sprint_winner       as string | null) ?? null,
    sprintP2:           (row.sprint_p2           as string | null) ?? null,
    sprintP3:           (row.sprint_p3           as string | null) ?? null,
    fetchedAt:          (row.fetched_at          as string | null) ?? null,
    manuallyOverridden: (row.manually_overridden as boolean) ?? false,
    updatedAt:          row.updated_at as string,
  };
}

export async function loadRaceResult(
  round: number,
  supabase: SupabaseClient
): Promise<RaceResult | null> {
  const { data } = await supabase
    .from("race_results")
    .select("*")
    .eq("round", round)
    .maybeSingle();
  if (!data) return null;
  return dbRowToRaceResult(data);
}

export async function loadAllRaceResults(
  supabase: SupabaseClient
): Promise<RaceResult[]> {
  const { data } = await supabase
    .from("race_results")
    .select("*")
    .order("round", { ascending: true });
  return (data ?? []).map(dbRowToRaceResult);
}

export async function saveRaceResult(
  round: number,
  result: Partial<RaceResult>,
  manuallyOverridden: boolean,
  supabase: SupabaseClient
): Promise<void> {
  await supabase.from("race_results").upsert(
    {
      round,
      qual_pole:           result.qualPole          ?? null,
      qual_p2:             result.qualP2             ?? null,
      qual_p3:             result.qualP3             ?? null,
      race_winner:         result.raceWinner         ?? null,
      race_p2:             result.raceP2             ?? null,
      race_p3:             result.raceP3             ?? null,
      fastest_lap:         result.fastestLap         ?? null,
      safety_car:          result.safetyCar          ?? null,
      sprint_qual_pole:    result.sprintQualPole     ?? null,
      sprint_qual_p2:      result.sprintQualP2       ?? null,
      sprint_qual_p3:      result.sprintQualP3       ?? null,
      sprint_winner:       result.sprintWinner       ?? null,
      sprint_p2:           result.sprintP2           ?? null,
      sprint_p3:           result.sprintP3           ?? null,
      fetched_at:          result.fetchedAt          ?? null,
      manually_overridden: manuallyOverridden,
      updated_at:          new Date().toISOString(),
    },
    { onConflict: "round" }
  );
}
