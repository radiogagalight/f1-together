import { NextResponse } from "next/server";
import { getSessionUid } from "@/lib/server/session";
import { isAdminUid } from "@/lib/server/isAdmin";
import { adminLoadRaceResult, adminSaveRaceResult } from "@/lib/resultsStorageAdmin";
import type { RaceResult } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ round: string }> }
) {
  const uid = await getSessionUid();
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { round: roundStr } = await params;
  const round = parseInt(roundStr, 10);
  const result = await adminLoadRaceResult(round);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(result);
}

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
  const overrides: Partial<RaceResult> = await req.json();

  const existing = await adminLoadRaceResult(round);
  const merged: Partial<RaceResult> = { ...(existing ?? {}), ...overrides };
  await adminSaveRaceResult(round, merged, true);

  const saved = await adminLoadRaceResult(round);
  if (!saved) {
    return NextResponse.json(
      { error: "Save failed — race_results may be missing or blocked" },
      { status: 500 }
    );
  }
  return NextResponse.json(saved);
}
