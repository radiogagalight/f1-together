import { NextResponse } from "next/server";
import { getSessionUid } from "@/lib/server/session";
import { isAdminUid } from "@/lib/server/isAdmin";
import { RACES } from "@/lib/data";
import { fetchRoundClassifications } from "@/lib/openf1";
import {
  adminLoadAllClassifications,
  adminSaveClassification,
} from "@/lib/classificationStorageAdmin";
import type { RaceClassification } from "@/lib/types";

export async function GET(req: Request) {
  const uid = await getSessionUid(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const classifications = await adminLoadAllClassifications();
    return NextResponse.json({ classifications });
  } catch (e) {
    console.error("[classifications GET]", e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

/** Sync classification(s) for a round from OpenF1. Body: { round: number } */
export async function POST(req: Request) {
  const uid = await getSessionUid(req);
  if (!uid || !(await isAdminUid(uid))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { round?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const round = body.round;
  if (typeof round !== "number" || !Number.isFinite(round)) {
    return NextResponse.json({ error: "round required" }, { status: 400 });
  }

  const race = RACES.find((r) => r.r === round);
  if (!race) {
    return NextResponse.json({ error: "Unknown round" }, { status: 404 });
  }

  try {
    const fetched = await fetchRoundClassifications(round, race.sprint);
    if (fetched.length === 0) {
      return NextResponse.json(
        { error: "OpenF1 returned no classification data for this round" },
        { status: 404 }
      );
    }

    const saved: RaceClassification[] = [];
    for (const clas of fetched) {
      await adminSaveClassification(clas, false);
      saved.push(clas);
    }

    return NextResponse.json({ classifications: saved });
  } catch (e) {
    console.error("[classifications POST]", e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

/** Manually save a classification. Body: RaceClassification */
export async function PUT(req: Request) {
  const uid = await getSessionUid(req);
  if (!uid || !(await isAdminUid(uid))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let clas: RaceClassification;
  try {
    clas = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    typeof clas?.round !== "number" ||
    (clas.session !== "race" && clas.session !== "sprint") ||
    !Array.isArray(clas.entries)
  ) {
    return NextResponse.json({ error: "Invalid classification" }, { status: 400 });
  }

  try {
    const now = new Date().toISOString();
    const payload: RaceClassification = {
      ...clas,
      incomplete: clas.incomplete ?? clas.entries.length < 15,
      fetchedAt: clas.fetchedAt ?? now,
      manuallyOverridden: true,
      updatedAt: now,
    };
    await adminSaveClassification(payload, true);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[classifications PUT]", e);
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
