import type { SupabaseClient } from "@supabase/supabase-js";
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

// Maps camelCase SeasonPredictions keys → snake_case DB columns
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

export async function loadPredictions(
  userId: string,
  supabase: SupabaseClient
): Promise<SeasonPredictions> {
  const { data } = await supabase
    .from("season_picks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return { ...DEFAULT_PREDICTIONS };
  return dbRowToPredictions(data);
}

export async function savePrediction(
  userId: string,
  key: keyof SeasonPredictions,
  value: string | null,
  supabase: SupabaseClient
): Promise<void> {
  const column = KEY_MAP[key];
  await supabase.from("season_picks").upsert(
    { user_id: userId, [column]: value, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export async function clearPredictions(
  userId: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase.from("season_picks").delete().eq("user_id", userId);
}
