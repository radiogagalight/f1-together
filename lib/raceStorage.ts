import type { SupabaseClient } from "@supabase/supabase-js";
import type { RacePick } from "./types";

const DEFAULT_RACE_PICK: RacePick = {
  qualPole: null,
  qualP2: null,
  qualP3: null,
  raceWinner: null,
  raceP2: null,
  raceP3: null,
  fastestLap: null,
  safetyCar: null,
};

function dbRowToRacePick(row: Record<string, unknown>): RacePick {
  return {
    qualPole:   (row.qual_pole    as string | null) ?? null,
    qualP2:     (row.qual_p2      as string | null) ?? null,
    qualP3:     (row.qual_p3      as string | null) ?? null,
    raceWinner: (row.race_winner  as string | null) ?? null,
    raceP2:     (row.race_p2      as string | null) ?? null,
    raceP3:     (row.race_p3      as string | null) ?? null,
    fastestLap: (row.fastest_lap  as string | null) ?? null,
    safetyCar:  (row.safety_car   as boolean | null) ?? null,
  };
}

export async function loadRacePick(
  userId: string,
  round: number,
  supabase: SupabaseClient
): Promise<RacePick> {
  const { data } = await supabase
    .from("race_picks")
    .select("*")
    .eq("user_id", userId)
    .eq("round", round)
    .maybeSingle();

  if (!data) return { ...DEFAULT_RACE_PICK };
  return dbRowToRacePick(data);
}

export async function saveRacePick(
  userId: string,
  round: number,
  picks: RacePick,
  supabase: SupabaseClient
): Promise<void> {
  await supabase.from("race_picks").upsert(
    {
      user_id:     userId,
      round,
      qual_pole:   picks.qualPole,
      qual_p2:     picks.qualP2,
      qual_p3:     picks.qualP3,
      race_winner: picks.raceWinner,
      race_p2:     picks.raceP2,
      race_p3:     picks.raceP3,
      fastest_lap: picks.fastestLap,
      safety_car:  picks.safetyCar,
      updated_at:  new Date().toISOString(),
    },
    { onConflict: "user_id,round" }
  );
}

/** Returns a map of round → number of filled picks (0–8) for all races the user has a row for. */
export async function loadRacePickStatuses(
  userId: string,
  supabase: SupabaseClient
): Promise<Map<number, number>> {
  const { data } = await supabase
    .from("race_picks")
    .select("round,qual_pole,qual_p2,qual_p3,race_winner,race_p2,race_p3,fastest_lap,safety_car")
    .eq("user_id", userId);

  const map = new Map<number, number>();
  for (const row of data ?? []) {
    const count = [
      row.qual_pole, row.qual_p2, row.qual_p3,
      row.race_winner, row.race_p2, row.race_p3,
      row.fastest_lap, row.safety_car,
    ].filter((v) => v !== null && v !== undefined).length;
    map.set(row.round, count);
  }
  return map;
}
