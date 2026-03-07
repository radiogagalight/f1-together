import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

// GET — any authenticated user; returns wildcards for a round
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("race_wildcards")
    .select("*")
    .eq("round", round)
    .order("display_order", { ascending: true });
  return NextResponse.json(data ?? []);
}

// POST — admin only; create a new wildcard question
export async function POST(
  req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const admin = adminSupabase();
  const { data, error } = await admin.from("race_wildcards").insert({
    round,
    question:      body.question,
    question_type: body.questionType,
    options:       body.options ?? null,
    points:        body.points ?? 10,
    display_order: body.displayOrder ?? 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — admin only; update a wildcard (set answer, edit question, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.question      !== undefined) updates.question      = body.question;
  if (body.questionType  !== undefined) updates.question_type = body.questionType;
  if (body.options       !== undefined) updates.options       = body.options;
  if (body.points        !== undefined) updates.points        = body.points;
  if (body.correctAnswer !== undefined) updates.correct_answer = body.correctAnswer;
  if (body.displayOrder  !== undefined) updates.display_order  = body.displayOrder;

  const admin = adminSupabase();
  const { data, error } = await admin
    .from("race_wildcards")
    .update(updates)
    .eq("id", body.id)
    .eq("round", round)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE — admin only; remove a wildcard question
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const supabase = await createClient();
  if (!(await isAdmin(supabase))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = adminSupabase();
  const { error } = await admin
    .from("race_wildcards")
    .delete()
    .eq("id", body.id)
    .eq("round", round);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
