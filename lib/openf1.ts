import { DRIVERS } from "./data";
import type { RaceResult } from "./types";

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
  1: "melbourne", 2: "shanghai",   3: "suzuka",    4: "sakhir",
  5: "jeddah",    6: "miami",      7: "montreal",  8: "monte",
  9: "catalunya", 10: "spielberg", 11: "silverstone",12: "spa",
  13: "hungaroring",14: "zandvoort",15: "monza",   16: "madring",
  17: "baku",    18: "singapore",  19: "austin",   20: "mexico",
  21: "interlagos",22: "las vegas",23: "lusail",   24: "yas",
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
    const meetingKey = await getMeetingKey(round);
    console.log(`[openf1] round=${round} meetingKey=${meetingKey}`);
    if (!meetingKey) return result;

    // ── Qualifying ──────────────────────────────────────────────────────────
    const qualKey = await getSessionKey(meetingKey, "Qualifying");
    console.log(`[openf1] qualKey=${qualKey}`);
    if (qualKey) {
      try {
        const [p1, p2, p3] = await fetchPositionTopN(qualKey, 3);
        console.log(`[openf1] qual positions: p1=${p1} p2=${p2} p3=${p3}`);
        result.qualPole = p1 ? await fetchDriverName(qualKey, p1) ?? null : null;
        result.qualP2   = p2 ? await fetchDriverName(qualKey, p2) ?? null : null;
        result.qualP3   = p3 ? await fetchDriverName(qualKey, p3) ?? null : null;
        console.log(`[openf1] qual mapped: pole=${result.qualPole} p2=${result.qualP2} p3=${result.qualP3}`);
      } catch (e) { console.error("[openf1] qual error", e); }
    }

    // ── Race ────────────────────────────────────────────────────────────────
    const raceKey = await getSessionKey(meetingKey, "Race");
    console.log(`[openf1] raceKey=${raceKey}`);
    if (raceKey) {
      try {
        const [p1, p2, p3, p4, p5, p6] = await fetchPositionTopN(raceKey, 6);
        console.log(`[openf1] race positions: p1=${p1} p2=${p2} p3=${p3} p4=${p4} p5=${p5} p6=${p6}`);
        result.raceWinner = p1 ? await fetchDriverName(raceKey, p1) ?? null : null;
        result.raceP2     = p2 ? await fetchDriverName(raceKey, p2) ?? null : null;
        result.raceP3     = p3 ? await fetchDriverName(raceKey, p3) ?? null : null;
        result.raceP4     = p4 ? await fetchDriverName(raceKey, p4) ?? null : null;
        result.raceP5     = p5 ? await fetchDriverName(raceKey, p5) ?? null : null;
        result.raceP6     = p6 ? await fetchDriverName(raceKey, p6) ?? null : null;
        console.log(`[openf1] race mapped: winner=${result.raceWinner} p2=${result.raceP2} p3=${result.raceP3} p4=${result.raceP4} p5=${result.raceP5} p6=${result.raceP6}`);
      } catch (e) { console.error("[openf1] race error", e); }

      try {
        const flNum = await fetchFastestLap(raceKey);
        result.fastestLap = flNum ? await fetchDriverName(raceKey, flNum) ?? null : null;
        console.log(`[openf1] fastestLap=${result.fastestLap}`);
      } catch (e) { console.error("[openf1] fastestLap error", e); }

      try {
        result.safetyCar = await detectSafetyCar(raceKey);
        console.log(`[openf1] safetyCar=${result.safetyCar}`);
      } catch (e) { console.error("[openf1] safetyCar error", e); }
    }

    // ── Sprint (if applicable) ───────────────────────────────────────────────
    if (isSprint) {
      const sqKey = await getSessionKey(meetingKey, "Sprint Qualifying");
      if (sqKey) {
        try {
          const [p1, p2, p3] = await fetchPositionTopN(sqKey, 3);
          result.sprintQualPole = p1 ? await fetchDriverName(sqKey, p1) ?? null : null;
          result.sprintQualP2   = p2 ? await fetchDriverName(sqKey, p2) ?? null : null;
          result.sprintQualP3   = p3 ? await fetchDriverName(sqKey, p3) ?? null : null;
        } catch { /* ignore */ }
      }

      const sprintKey = await getSessionKey(meetingKey, "Sprint");
      if (sprintKey) {
        try {
          const [p1, p2, p3] = await fetchPositionTopN(sprintKey, 3);
          result.sprintWinner = p1 ? await fetchDriverName(sprintKey, p1) ?? null : null;
          result.sprintP2     = p2 ? await fetchDriverName(sprintKey, p2) ?? null : null;
          result.sprintP3     = p3 ? await fetchDriverName(sprintKey, p3) ?? null : null;
        } catch { /* ignore */ }
      }
    }
  } catch { /* top-level safety net */ }

  return result;
}
