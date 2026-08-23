import { DRIVERS } from "./data";
import { pointsForSession } from "./f1Points";
import type {
  ClassificationEntry,
  ClassificationSession,
  RaceClassification,
  RaceResult,
} from "./types";

// ─── Name helpers ─────────────────────────────────────────────────────────────

export function fullNameToSlug(fullName: string): string {
  return fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function slugToDriverId(slug: string): string | null {
  const match = DRIVERS.find((d) => fullNameToSlug(d.name) === slug);
  return match?.id ?? null;
}

// ─── Circuit keyword map ──────────────────────────────────────────────────────

const CIRCUIT_KEYWORDS: Record<number, string> = {
  1: "melbourne", 2: "shanghai", 3: "suzuka", 4: "miami",
  5: "montreal", 6: "monte", 7: "catalunya", 8: "spielberg",
  9: "silverstone", 10: "spa", 11: "hungaroring", 12: "zandvoort",
  13: "monza", 14: "madring", 15: "baku", 16: "sepang",
  17: "singapore", 18: "austin", 19: "mexico", 20: "interlagos",
  21: "vegas", 22: "lusail", 23: "yas",
};

const BASE = "https://api.openf1.org/v1";

async function apiFetch<T>(path: string): Promise<T[]> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json() as Promise<T[]>;
}

// ─── Session key helpers ──────────────────────────────────────────────────────

export async function getMeetingKey(round: number): Promise<number | null> {
  const keyword = CIRCUIT_KEYWORDS[round];
  if (!keyword) return null;
  const meetings = await apiFetch<{ meeting_key: number; circuit_short_name: string; year: number }>(
    `/meetings?year=2026`
  );
  const match = meetings.find((m) =>
    (m.circuit_short_name ?? "").toLowerCase().includes(keyword)
  );
  return match?.meeting_key ?? null;
}

export async function getSessionKey(
  meetingKey: number,
  sessionName: string
): Promise<number | null> {
  const sessions = await apiFetch<{ session_key: number; session_name: string }>(
    `/sessions?meeting_key=${meetingKey}`
  );
  const match = sessions.find(
    (s) => s.session_name.toLowerCase() === sessionName.toLowerCase()
  );
  return match?.session_key ?? null;
}

// ─── Data fetchers ────────────────────────────────────────────────────────────

export async function fetchPositionTopN(
  sessionKey: number,
  n: number
): Promise<(number | null)[]> {
  const rows = await apiFetch<{ driver_number: number; position: number; date: string }>(
    `/position?session_key=${sessionKey}`
  );
  // Latest position entry per driver
  const latest = new Map<number, { position: number; date: string }>();
  for (const row of rows) {
    const existing = latest.get(row.driver_number);
    if (!existing || row.date > existing.date) {
      latest.set(row.driver_number, { position: row.position, date: row.date });
    }
  }
  const sorted = [...latest.entries()]
    .sort((a, b) => a[1].position - b[1].position)
    .slice(0, n);
  return Array.from({ length: n }, (_, i) => sorted[i]?.[0] ?? null);
}

export async function fetchFastestLap(sessionKey: number): Promise<number | null> {
  const laps = await apiFetch<{ driver_number: number; lap_duration: number | null }>(
    `/laps?session_key=${sessionKey}`
  );
  const valid = laps.filter(
    (l) => l.lap_duration !== null && l.lap_duration > 60
  ) as Array<{ driver_number: number; lap_duration: number }>;
  if (valid.length === 0) return null;
  const fastest = valid.reduce((best, l) =>
    l.lap_duration < best.lap_duration ? l : best
  );
  return fastest.driver_number;
}

export async function detectSafetyCar(sessionKey: number): Promise<boolean> {
  const events = await apiFetch<{ category: string; message: string }>(
    `/race_control?session_key=${sessionKey}`
  );
  return events.some(
    (e) =>
      e.category === "SafetyCar" &&
      !e.message?.toLowerCase().includes("virtual")
  );
}

export async function fetchDriverName(
  sessionKey: number,
  driverNumber: number
): Promise<string | null> {
  const drivers = await apiFetch<{ driver_number: number; full_name: string }>(
    `/drivers?session_key=${sessionKey}&driver_number=${driverNumber}`
  );
  const d = drivers[0];
  if (!d?.full_name) return null;
  return slugToDriverId(fullNameToSlug(d.full_name));
}

// ─── Master orchestrator ──────────────────────────────────────────────────────
// Parallelised: sessions in 1 call, driver maps + position/lap/safety all
// fetched concurrently. Stays well within Vercel Hobby's 10 s function limit.

export async function fetchFullRaceResult(
  round: number,
  isSprint: boolean
): Promise<Partial<RaceResult>> {
  const result: Partial<RaceResult> = {
    round,
    fetchedAt: new Date().toISOString(),
    manuallyOverridden: false,
  };

  try {
    // Round 1: meeting key
    const meetingKey = await getMeetingKey(round);
    console.log(`[openf1] round=${round} meetingKey=${meetingKey}`);
    if (!meetingKey) return result;

    // Round 2: all sessions in one call
    const sessions = await apiFetch<{ session_key: number; session_name: string }>(
      `/sessions?meeting_key=${meetingKey}`
    );
    const getKey = (name: string) =>
      sessions.find((s) => s.session_name.toLowerCase() === name.toLowerCase())?.session_key ?? null;

    const qualKey    = getKey("Qualifying");
    const raceKey    = getKey("Race");
    const sqKey      = isSprint ? getKey("Sprint Qualifying") : null;
    const sprintKey  = isSprint ? getKey("Sprint") : null;
    console.log(`[openf1] qualKey=${qualKey} raceKey=${raceKey}`);

    // Round 3 (parallel): fetch driver roster for every relevant session,
    // and fetch positions + race telemetry simultaneously.
    const sessionKeys = [qualKey, raceKey, sqKey, sprintKey].filter((k): k is number => k != null);
    const null3 = (): Promise<(number | null)[]> => Promise.resolve([null, null, null]);
    const null6 = (): Promise<(number | null)[]> => Promise.resolve([null, null, null, null, null, null]);

    const [driverMaps, qualPos, racePos, flNum, sc, sqPos, sprintPos] = await Promise.all([
      // Build a driver-number → driver-id map per session (all sessions in parallel)
      Promise.all(
        sessionKeys.map(async (sk) => {
          const drivers = await apiFetch<{ driver_number: number; full_name: string }>(
            `/drivers?session_key=${sk}`
          );
          const map = new Map<number, string | null>();
          for (const d of drivers) {
            if (!map.has(d.driver_number) && d.full_name) {
              map.set(d.driver_number, slugToDriverId(fullNameToSlug(d.full_name)));
            }
          }
          return { sk, map };
        })
      ),
      qualKey   ? fetchPositionTopN(qualKey, 3)   : null3(),
      raceKey   ? fetchPositionTopN(raceKey, 6)   : null6(),
      raceKey   ? fetchFastestLap(raceKey)        : Promise.resolve(null),
      raceKey   ? detectSafetyCar(raceKey)        : Promise.resolve(false),
      sqKey     ? fetchPositionTopN(sqKey, 3)     : null3(),
      sprintKey ? fetchPositionTopN(sprintKey, 3) : null3(),
    ]);

    const driverMap = (sk: number) =>
      driverMaps.find((m) => m.sk === sk)?.map ?? new Map<number, string | null>();
    const resolve = (map: Map<number, string | null>, num: number | null) =>
      num != null ? (map.get(num) ?? null) : null;

    // Map positions to driver IDs
    if (qualKey) {
      const m = driverMap(qualKey);
      const [p1, p2, p3] = qualPos;
      result.qualPole = resolve(m, p1);
      result.qualP2   = resolve(m, p2);
      result.qualP3   = resolve(m, p3);
      console.log(`[openf1] qual: pole=${result.qualPole} p2=${result.qualP2} p3=${result.qualP3}`);
    }

    if (raceKey) {
      const m = driverMap(raceKey);
      const [p1, p2, p3, p4, p5, p6] = racePos;
      result.raceWinner = resolve(m, p1);
      result.raceP2     = resolve(m, p2);
      result.raceP3     = resolve(m, p3);
      result.raceP4     = resolve(m, p4);
      result.raceP5     = resolve(m, p5);
      result.raceP6     = resolve(m, p6);
      result.fastestLap = resolve(m, flNum);
      result.safetyCar  = sc;
      console.log(`[openf1] race: winner=${result.raceWinner} p2=${result.raceP2} p3=${result.raceP3} fl=${result.fastestLap} sc=${result.safetyCar}`);
    }

    if (isSprint) {
      if (sqKey) {
        const m = driverMap(sqKey);
        const [p1, p2, p3] = sqPos;
        result.sprintQualPole = resolve(m, p1);
        result.sprintQualP2   = resolve(m, p2);
        result.sprintQualP3   = resolve(m, p3);
      }
      if (sprintKey) {
        const m = driverMap(sprintKey);
        const [p1, p2, p3] = sprintPos;
        result.sprintWinner = resolve(m, p1);
        result.sprintP2     = resolve(m, p2);
        result.sprintP3     = resolve(m, p3);
      }
    }
  } catch (e) { console.error("[openf1] top-level error", e); }

  return result;
}

/** Fetch full finishing order for a race or sprint session (up to 20). */
export async function fetchSessionClassification(
  round: number,
  session: ClassificationSession
): Promise<RaceClassification | null> {
  try {
    const meetingKey = await getMeetingKey(round);
    if (!meetingKey) return null;

    const sessions = await apiFetch<{ session_key: number; session_name: string }>(
      `/sessions?meeting_key=${meetingKey}`
    );
    const sessionName = session === "sprint" ? "Sprint" : "Race";
    const sessionKey =
      sessions.find((s) => s.session_name.toLowerCase() === sessionName.toLowerCase())
        ?.session_key ?? null;
    if (!sessionKey) return null;

    const [positions, drivers] = await Promise.all([
      apiFetch<{ driver_number: number; position: number; date: string }>(
        `/position?session_key=${sessionKey}`
      ),
      apiFetch<{ driver_number: number; full_name: string }>(
        `/drivers?session_key=${sessionKey}`
      ),
    ]);

    const nameMap = new Map<number, string | null>();
    for (const d of drivers) {
      if (!nameMap.has(d.driver_number) && d.full_name) {
        nameMap.set(d.driver_number, slugToDriverId(fullNameToSlug(d.full_name)));
      }
    }

    const latest = new Map<number, { position: number; date: string }>();
    for (const row of positions) {
      const existing = latest.get(row.driver_number);
      if (!existing || row.date > existing.date) {
        latest.set(row.driver_number, { position: row.position, date: row.date });
      }
    }

    const sorted = [...latest.entries()].sort((a, b) => a[1].position - b[1].position);
    const entries: ClassificationEntry[] = [];
    for (const [num, { position }] of sorted) {
      const driverId = nameMap.get(num) ?? null;
      if (!driverId || position < 1) continue;
      entries.push({
        position,
        driverId,
        pointsAwarded: pointsForSession(session, position, "classified"),
        status: "classified",
      });
    }

    if (entries.length === 0) return null;

    const now = new Date().toISOString();
    return {
      round,
      session,
      entries,
      incomplete: entries.length < 15,
      fetchedAt: now,
      manuallyOverridden: false,
      updatedAt: now,
    };
  } catch (e) {
    console.error("[openf1] fetchSessionClassification error", e);
    return null;
  }
}

/** Fetch race (+ sprint if applicable) classifications for a round. */
export async function fetchRoundClassifications(
  round: number,
  isSprint: boolean
): Promise<RaceClassification[]> {
  const race = await fetchSessionClassification(round, "race");
  const out: RaceClassification[] = [];
  if (race) out.push(race);
  if (isSprint) {
    const sprint = await fetchSessionClassification(round, "sprint");
    if (sprint) out.push(sprint);
  }
  return out;
}
