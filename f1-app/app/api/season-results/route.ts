import { NextResponse } from "next/server";
import { getSessionUid } from "@/lib/server/session";
import { adminLoadAllClassifications } from "@/lib/classificationStorageAdmin";
import { getAdminDb } from "@/lib/firebase/admin";
import { RACES } from "@/lib/data";
import {
  aggregateChampionship,
  mergeClassifications,
} from "@/lib/f1Points";
import type { RaceResult, SeasonResultsPayload } from "@/lib/types";

function rowToRaceResult(row: Record<string, unknown>, round: number): RaceResult {
  return {
    round,
    qualPole: (row.qual_pole as string | null) ?? null,
    qualP2: (row.qual_p2 as string | null) ?? null,
    qualP3: (row.qual_p3 as string | null) ?? null,
    raceWinner: (row.race_winner as string | null) ?? null,
    raceP2: (row.race_p2 as string | null) ?? null,
    raceP3: (row.race_p3 as string | null) ?? null,
    raceP4: (row.race_p4 as string | null) ?? null,
    raceP5: (row.race_p5 as string | null) ?? null,
    raceP6: (row.race_p6 as string | null) ?? null,
    fastestLap: (row.fastest_lap as string | null) ?? null,
    safetyCar: (row.safety_car as boolean | null) ?? null,
    sprintQualPole: (row.sprint_qual_pole as string | null) ?? null,
    sprintQualP2: (row.sprint_qual_p2 as string | null) ?? null,
    sprintQualP3: (row.sprint_qual_p3 as string | null) ?? null,
    sprintWinner: (row.sprint_winner as string | null) ?? null,
    sprintP2: (row.sprint_p2 as string | null) ?? null,
    sprintP3: (row.sprint_p3 as string | null) ?? null,
    fetchedAt: (row.fetched_at as string | null) ?? null,
    manuallyOverridden: (row.manually_overridden as boolean) ?? false,
    updatedAt: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

async function loadAllRaceResultsAdmin(): Promise<RaceResult[]> {
  const snap = await getAdminDb()
    .collection("race_results")
    .orderBy("round", "asc")
    .get();
  return snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const round =
      typeof data.round === "number" ? data.round : parseInt(d.id, 10);
    return rowToRaceResult(data, round);
  });
}

export async function GET(req: Request) {
  const uid = await getSessionUid(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [stored, raceResults] = await Promise.all([
      adminLoadAllClassifications(),
      loadAllRaceResultsAdmin(),
    ]);

    const classifications = mergeClassifications(stored, raceResults);
    const { driverStandings, constructorStandings, completedRounds } =
      aggregateChampionship(classifications, raceResults);

    const payload: SeasonResultsPayload = {
      classifications,
      driverStandings,
      constructorStandings,
      completedRounds,
      raceResults,
    };

    // Include calendar meta so clients don't depend solely on static RACES timing
    return NextResponse.json({
      ...payload,
      calendarRounds: RACES.map((r) => r.r),
    });
  } catch (e) {
    console.error("[season-results]", e);
    return NextResponse.json({ error: "Failed to load season results" }, { status: 500 });
  }
}
