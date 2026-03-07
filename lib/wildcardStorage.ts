import type { SupabaseClient } from "@supabase/supabase-js";
import type { RaceWildcard, WildcardPick, WildcardQuestionType } from "./types";

function dbRowToWildcard(row: Record<string, unknown>): RaceWildcard {
  return {
    id:            row.id as string,
    round:         row.round as number,
    question:      row.question as string,
    questionType:  row.question_type as WildcardQuestionType,
    options:       (row.options as { id: string; name: string }[] | null) ?? null,
    points:        row.points as number,
    correctAnswer: (row.correct_answer as string | null) ?? null,
    displayOrder:  row.display_order as number,
  };
}

export async function loadWildcards(
  round: number,
  supabase: SupabaseClient
): Promise<RaceWildcard[]> {
  const { data } = await supabase
    .from("race_wildcards")
    .select("*")
    .eq("round", round)
    .order("display_order", { ascending: true });
  return (data ?? []).map(dbRowToWildcard);
}

export async function loadWildcardPicks(
  userId: string,
  round: number,
  supabase: SupabaseClient
): Promise<WildcardPick[]> {
  // Join via wildcard_id → race_wildcards.round
  const { data } = await supabase
    .from("wildcard_picks")
    .select("wildcard_id, pick_value, boosted, race_wildcards!inner(round)")
    .eq("user_id", userId)
    .eq("race_wildcards.round", round);
  return (data ?? []).map((row) => ({
    wildcardId: row.wildcard_id as string,
    pickValue:  row.pick_value as string,
    boosted:    row.boosted as boolean,
  }));
}

export async function saveWildcardPick(
  userId: string,
  wildcardId: string,
  pickValue: string,
  boosted: boolean,
  supabase: SupabaseClient
): Promise<void> {
  await supabase.from("wildcard_picks").upsert(
    { user_id: userId, wildcard_id: wildcardId, pick_value: pickValue, boosted },
    { onConflict: "user_id,wildcard_id" }
  );
}

export async function deleteWildcardPick(
  userId: string,
  wildcardId: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from("wildcard_picks")
    .delete()
    .eq("user_id", userId)
    .eq("wildcard_id", wildcardId);
}
