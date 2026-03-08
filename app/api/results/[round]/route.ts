import { NextResponse } from "next/server";
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { fetchFullRaceResult } from "@/lib/openf1";
import { loadRaceResult, saveRaceResult } from "@/lib/resultsStorage";
import { RACES } from "@/lib/data";
import type { RaceResult } from "@/lib/types";

function adminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return data?.is_admin === true;
}

// GET — authenticated users; returns stored result or 404
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await loadRaceResult(round, supabase);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

// POST — admin only; fetch from OpenF1 and save
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const race = RACES.find((r) => r.r === round);
  const fetched = await fetchFullRaceResult(round, race?.sprint ?? false);

  const admin = adminSupabase();
  await saveRaceResult(round, fetched, false, admin);

  const saved = await loadRaceResult(round, admin);
  if (!saved) return NextResponse.json({ error: "Save failed — race_results table may not exist" }, { status: 500 });
  return NextResponse.json(saved);
}

// PATCH — admin only; merge field overrides
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const overrides: Partial<RaceResult> = await req.json();
  const admin = adminSupabase();

  // Load existing and merge
  const existing = await loadRaceResult(round, admin);
  const merged: Partial<RaceResult> = { ...(existing ?? {}), ...overrides };
  await saveRaceResult(round, merged, true, admin);

  const saved = await loadRaceResult(round, admin);
  if (!saved) return NextResponse.json({ error: "Save failed — race_results table may not exist" }, { status: 500 });
  return NextResponse.json(saved);
}
