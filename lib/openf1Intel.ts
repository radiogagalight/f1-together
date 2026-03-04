import { DRIVERS } from "./data";
import { fullNameToSlug } from "./openf1";

// ─── Circuit keyword map (mirrors openf1.ts — avoids coupling) ─────────────────

// Keywords matched against BOTH circuit_short_name AND meeting_name (case-insensitive).
// Verified against OpenF1 2024 + 2025 meeting data.
const CIRCUIT_KEYWORDS: Record<number, string> = {
  1: "australia", 2: "shanghai",    3: "suzuka",    4: "bahrain",
  5: "jeddah",   6: "miami",       7: "montreal",  8: "monaco",
  9: "catalu",   10: "spielberg",  11: "silverstone",12: "spa",
  13: "hungaroring",14: "zandvoort",15: "monza",   16: "madrid",
  17: "baku",    18: "singapore",  19: "austin",   20: "mexico",
  21: "interlagos",22: "las vegas",23: "lusail",   24: "yas",
};

const BASE = "https://api.openf1.org/v1";

async function apiFetch<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    return res.json() as Promise<T[]>;
  } catch {
    return [];
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DriverRef {
  driverId: string | null;  // null = not on 2026 grid
  rawName: string;          // always present for display fallback
}

export interface HistoricalResult {
  year: number;
  available: boolean;
  qualPole: DriverRef | null;
  qualP2: DriverRef | null;
  qualP3: DriverRef | null;
  raceWinner: DriverRef | null;
  raceP2: DriverRef | null;
  raceP3: DriverRef | null;
  fastestLap: DriverRef | null;
  safetyCar: boolean | null;
  sprintQualPole: DriverRef | null;
  sprintQualP2: DriverRef | null;
  sprintQualP3: DriverRef | null;
  sprintWinner: DriverRef | null;
  sprintP2: DriverRef | null;
  sprintP3: DriverRef | null;
}

export interface DriverFormRow {
  driverId: string;
  driverName: string;
  team: string;
  positions: Array<{ raceName: string; position: number | null }>;
}

// ─── Name resolution ──────────────────────────────────────────────────────────

function slugToDriverRef(slug: string, rawName: string): DriverRef {
  const match = DRIVERS.find((d) => fullNameToSlug(d.name) === slug);
  return { driverId: match?.id ?? null, rawName };
}

// ─── Session key helpers ──────────────────────────────────────────────────────

export async function getHistoricalMeetingKey(round: number, year: number): Promise<number | null> {
  const keyword = CIRCUIT_KEYWORDS[round];
  if (!keyword) return null;
  const meetings = await apiFetch<{ meeting_key: number; circuit_short_name: string; meeting_name: string; year: number }>(
    `/meetings?year=${year}`
  );
  const match = meetings.find((m) => {
    const circuit = (m.circuit_short_name ?? "").toLowerCase();
    const name    = (m.meeting_name    ?? "").toLowerCase();
    return circuit.includes(keyword) || name.includes(keyword);
  });
  return match?.meeting_key ?? null;
}

async function getHistoricalSessionKey(meetingKey: number, sessionName: string): Promise<number | null> {
  const sessions = await apiFetch<{ session_key: number; session_name: string }>(
    `/sessions?meeting_key=${meetingKey}`
  );
  const match = sessions.find(
    (s) => s.session_name.toLowerCase() === sessionName.toLowerCase()
  );
  return match?.session_key ?? null;
}

// ─── Driver map from session ──────────────────────────────────────────────────

export async function fetchSessionDriverMap(sessionKey: number): Promise<Map<number, DriverRef>> {
  const drivers = await apiFetch<{ driver_number: number; full_name: string }>(
    `/drivers?session_key=${sessionKey}`
  );
  const map = new Map<number, DriverRef>();
  for (const d of drivers) {
    if (!d.full_name) continue;
    const slug = fullNameToSlug(d.full_name);
    map.set(d.driver_number, slugToDriverRef(slug, d.full_name));
  }
  return map;
}

// ─── Final positions (targeted — avoids downloading full telemetry stream) ────

// Queries P1, P2, P3 separately. Each returns ~30 rows vs. ~20 000 for the
// full unfiltered stream, making this safe to call from the browser.
async function fetchTop3PositionMap(sessionKey: number): Promise<Map<number, number>> {
  const [p1rows, p2rows, p3rows] = await Promise.all([
    apiFetch<{ driver_number: number; date: string }>(`/position?session_key=${sessionKey}&position=1`),
    apiFetch<{ driver_number: number; date: string }>(`/position?session_key=${sessionKey}&position=2`),
    apiFetch<{ driver_number: number; date: string }>(`/position?session_key=${sessionKey}&position=3`),
  ]);

  function lastDriver(rows: Array<{ driver_number: number; date: string }>): number | null {
    if (rows.length === 0) return null;
    return rows.reduce((best, r) => r.date > best.date ? r : best).driver_number;
  }

  const map = new Map<number, number>();
  const d1 = lastDriver(p1rows);
  const d2 = lastDriver(p2rows);
  const d3 = lastDriver(p3rows);
  if (d1 !== null) map.set(d1, 1);
  if (d2 !== null) map.set(d2, 2);
  if (d3 !== null) map.set(d3, 3);
  return map;
}

async function fetchFastestLapDriver(sessionKey: number, driverMap: Map<number, DriverRef>): Promise<DriverRef | null> {
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
  return driverMap.get(fastest.driver_number) ?? null;
}

async function detectSafetyCarInSession(sessionKey: number): Promise<boolean | null> {
  const events = await apiFetch<{ category: string; message: string }>(
    `/race_control?session_key=${sessionKey}`
  );
  if (events.length === 0) return null;
  return events.some(
    (e) =>
      e.category === "SafetyCar" &&
      !e.message?.toLowerCase().includes("virtual")
  );
}

function positionDriverRef(
  pos: number,
  posMap: Map<number, number>,
  driverMap: Map<number, DriverRef>
): DriverRef | null {
  for (const [num, p] of posMap.entries()) {
    if (p === pos) return driverMap.get(num) ?? null;
  }
  return null;
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export async function fetchHistoricalCircuitResult(
  round: number,
  year: number
): Promise<HistoricalResult> {
  const base: HistoricalResult = {
    year,
    available: false,
    qualPole: null, qualP2: null, qualP3: null,
    raceWinner: null, raceP2: null, raceP3: null,
    fastestLap: null, safetyCar: null,
    sprintQualPole: null, sprintQualP2: null, sprintQualP3: null,
    sprintWinner: null, sprintP2: null, sprintP3: null,
  };

  try {
    const meetingKey = await getHistoricalMeetingKey(round, year);
    if (!meetingKey) return base;
    base.available = true;

    // ── Qualifying ──────────────────────────────────────────────────────────
    const qualKey = await getHistoricalSessionKey(meetingKey, "Qualifying");
    if (qualKey) {
      try {
        const [driverMap, posMap] = await Promise.all([
          fetchSessionDriverMap(qualKey),
          fetchTop3PositionMap(qualKey),
        ]);
        base.qualPole = positionDriverRef(1, posMap, driverMap);
        base.qualP2   = positionDriverRef(2, posMap, driverMap);
        base.qualP3   = positionDriverRef(3, posMap, driverMap);
      } catch { /* ignore */ }
    }

    // ── Race ────────────────────────────────────────────────────────────────
    const raceKey = await getHistoricalSessionKey(meetingKey, "Race");
    if (raceKey) {
      try {
        const [driverMap, posMap] = await Promise.all([
          fetchSessionDriverMap(raceKey),
          fetchTop3PositionMap(raceKey),
        ]);
        base.raceWinner = positionDriverRef(1, posMap, driverMap);
        base.raceP2     = positionDriverRef(2, posMap, driverMap);
        base.raceP3     = positionDriverRef(3, posMap, driverMap);
        base.fastestLap = await fetchFastestLapDriver(raceKey, driverMap);
        base.safetyCar  = await detectSafetyCarInSession(raceKey);
      } catch { /* ignore */ }
    }

    // ── Sprint ──────────────────────────────────────────────────────────────
    const sqKey = await getHistoricalSessionKey(meetingKey, "Sprint Qualifying");
    if (sqKey) {
      try {
        const [driverMap, posMap] = await Promise.all([
          fetchSessionDriverMap(sqKey),
          fetchTop3PositionMap(sqKey),
        ]);
        base.sprintQualPole = positionDriverRef(1, posMap, driverMap);
        base.sprintQualP2   = positionDriverRef(2, posMap, driverMap);
        base.sprintQualP3   = positionDriverRef(3, posMap, driverMap);
      } catch { /* ignore */ }
    }

    const sprintKey = await getHistoricalSessionKey(meetingKey, "Sprint");
    if (sprintKey) {
      try {
        const [driverMap, posMap] = await Promise.all([
          fetchSessionDriverMap(sprintKey),
          fetchTop3PositionMap(sprintKey),
        ]);
        base.sprintWinner = positionDriverRef(1, posMap, driverMap);
        base.sprintP2     = positionDriverRef(2, posMap, driverMap);
        base.sprintP3     = positionDriverRef(3, posMap, driverMap);
      } catch { /* ignore */ }
    }
  } catch { /* top-level safety net */ }

  return base;
}

// ─── Driver form (Drivers tab) ────────────────────────────────────────────────

export async function getLastNRaceSessions(
  year: number,
  n: number
): Promise<Array<{ sessionKey: number; raceName: string }>> {
  const meetings = await apiFetch<{ meeting_key: number; meeting_name: string; date_start: string }>(
    `/meetings?year=${year}`
  );
  if (meetings.length === 0) return [];

  const sorted = [...meetings].sort(
    (a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
  );
  const lastN = sorted.slice(-n);

  const results: Array<{ sessionKey: number; raceName: string }> = [];
  for (const meeting of lastN) {
    const sessions = await apiFetch<{ session_key: number; session_name: string; meeting_key: number }>(
      `/sessions?meeting_key=${meeting.meeting_key}`
    );
    const race = sessions.find((s) => s.session_name.toLowerCase() === "race");
    if (race) {
      results.push({
        sessionKey: race.session_key,
        raceName: meeting.meeting_name.replace("Grand Prix", "GP"),
      });
    }
  }
  return results;
}

export async function fetchDriverFormData(year: number, numRaces: number): Promise<DriverFormRow[]> {
  const sessions = await getLastNRaceSessions(year, numRaces);
  if (sessions.length === 0) return [];

  // Fetch all sessions in parallel
  const sessionData = await Promise.all(
    sessions.map(async ({ sessionKey, raceName }) => {
      const [driverMap, posMap] = await Promise.all([
        fetchSessionDriverMap(sessionKey),
        fetchTop3PositionMap(sessionKey),
      ]);
      return { raceName, driverMap, posMap };
    })
  );

  // Build a map: driverName -> DriverRef (first seen)
  const driverRefs = new Map<string, DriverRef>();
  for (const { driverMap } of sessionData) {
    for (const ref of driverMap.values()) {
      if (!driverRefs.has(ref.rawName)) {
        driverRefs.set(ref.rawName, ref);
      }
    }
  }

  // For each driver found, build their form row
  const rows: DriverFormRow[] = [];
  for (const [rawName, ref] of driverRefs.entries()) {
    // Only include drivers on the 2026 grid (have a driverId)
    if (!ref.driverId) continue;
    const driver = DRIVERS.find((d) => d.id === ref.driverId);
    if (!driver) continue;

    const positions = sessions.map(({ raceName }, i) => {
      const { driverMap, posMap } = sessionData[i];
      // Find this driver's number in the session
      let position: number | null = null;
      for (const [num, dr] of driverMap.entries()) {
        if (dr.rawName === rawName) {
          position = posMap.get(num) ?? null;
          break;
        }
      }
      return { raceName, position };
    });

    rows.push({
      driverId: driver.id,
      driverName: driver.name,
      team: driver.team,
      positions,
    });
  }

  return rows;
}
