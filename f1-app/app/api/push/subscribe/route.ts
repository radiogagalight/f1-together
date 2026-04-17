import { NextResponse } from "next/server";
import { getSessionUid } from "@/lib/server/session";
import { getAdminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  const uid = await getSessionUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await request.json();
  await getAdminDb().collection("push_subscriptions").doc(uid).set({
    user_id: uid,
    subscription,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const uid = await getSessionUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await getAdminDb().collection("push_subscriptions").doc(uid).delete();
  return NextResponse.json({ ok: true });
}
