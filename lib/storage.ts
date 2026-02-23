import type { SupabaseClient } from "@supabase/supabase-js";
import type { SeasonPicks } from "./types";

const DEFAULT_PICKS: SeasonPicks = {
  wdcWinner: null,
  wccWinner: null,
  mostWins: null,
  mostPoles: null,
  mostPodiums: null,
  firstDnfDriver: null,
  firstDnfConstructor: null,
};

// Maps camelCase SeasonPicks keys → snake_case DB columns
const KEY_MAP: Record<keyof SeasonPicks, string> = {
  wdcWinner: "wdc_winner",
  wccWinner: "wcc_winner",
  mostWins: "most_wins",
  mostPoles: "most_poles",
  mostPodiums: "most_podiums",
  firstDnfDriver: "first_dnf_driver",
  firstDnfConstructor: "first_dnf_constructor",
};

function dbRowToPicks(row: Record<string, string | null>): SeasonPicks {
  return {
    wdcWinner: row.wdc_winner ?? null,
    wccWinner: row.wcc_winner ?? null,
    mostWins: row.most_wins ?? null,
    mostPoles: row.most_poles ?? null,
    mostPodiums: row.most_podiums ?? null,
    firstDnfDriver: row.first_dnf_driver ?? null,
    firstDnfConstructor: row.first_dnf_constructor ?? null,
  };
}

export async function loadPicks(
  userId: string,
  supabase: SupabaseClient
): Promise<SeasonPicks> {
  const { data } = await supabase
    .from("season_picks")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return { ...DEFAULT_PICKS };
  return dbRowToPicks(data);
}

export async function savePick(
  userId: string,
  key: keyof SeasonPicks,
  value: string | null,
  supabase: SupabaseClient
): Promise<void> {
  const column = KEY_MAP[key];
  await supabase.from("season_picks").upsert(
    { user_id: userId, [column]: value, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export async function clearPicks(
  userId: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase.from("season_picks").delete().eq("user_id", userId);
}
