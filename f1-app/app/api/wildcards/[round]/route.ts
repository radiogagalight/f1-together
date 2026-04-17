import { NextResponse } from "next/server";
import { getSessionUid } from "@/lib/server/session";
import { isAdminUid } from "@/lib/server/isAdmin";
import { getAdminDb } from "@/lib/firebase/admin";
// GET — any authenticated user; returns wildcards for a round
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const uid = await getSessionUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const snap = await getAdminDb()
    .collection("race_wildcards")
    .where("round", "==", round)
    .orderBy("display_order", "asc")
    .get();

  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json(rows);
}

// POST — admin only; create a new wildcard question
export async function POST(
  req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const uid = await getSessionUid();
  if (!uid || !(await isAdminUid(uid))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const body = await req.json();
  const ref = await getAdminDb().collection("race_wildcards").add({
    round,
    question: body.question,
    question_type: body.questionType,
    options: body.options ?? null,
    points: body.points ?? 10,
    display_order: body.displayOrder ?? 0,
    correct_answer: null,
    created_at: new Date().toISOString(),
  });
  const doc = await ref.get();
  return NextResponse.json({ id: doc.id, ...doc.data() });
}

// PATCH — admin only
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const uid = await getSessionUid();
  if (!uid || !(await isAdminUid(uid))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.question !== undefined) updates.question = body.question;
  if (body.questionType !== undefined) updates.question_type = body.questionType;
  if (body.options !== undefined) updates.options = body.options;
  if (body.points !== undefined) updates.points = body.points;
  if (body.correctAnswer !== undefined) updates.correct_answer = body.correctAnswer;
  if (body.displayOrder !== undefined) updates.display_order = body.displayOrder;

  const ref = getAdminDb().collection("race_wildcards").doc(body.id);
  const existing = await ref.get();
  if (!existing.exists || (existing.data()?.round as number) !== round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await ref.update(updates);
  const doc = await ref.get();
  return NextResponse.json({ id: doc.id, ...doc.data() });
}

// DELETE — admin only
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const uid = await getSessionUid();
  if (!uid || !(await isAdminUid(uid))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ref = getAdminDb().collection("race_wildcards").doc(body.id);
  const existing = await ref.get();
  if (!existing.exists || (existing.data()?.round as number) !== round) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await ref.delete();
  return NextResponse.json({ ok: true });
}
