"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RACES, DRIVERS } from "@/lib/data";
import { CIRCUIT_INTEL } from "@/lib/circuitIntel";
import type { CircuitCharacter } from "@/lib/circuitIntel";
import { fetchHistoricalCircuitResult, fetchDriverFormData } from "@/lib/openf1Intel";
import type { HistoricalResult, DriverRef, DriverFormRow } from "@/lib/openf1Intel";
import { PICK_POINTS } from "@/lib/scoring";
import { TEAM_COLORS } from "@/lib/teamColors";

// ─── 2025 championship order for Drivers tab ──────────────────────────────────

const DRIVER_ORDER_2025: string[] = [
  "lando-norris",
  "oscar-piastri",
  "charles-leclerc",
  "george-russell",
  "lewis-hamilton",
  "max-verstappen",
  "carlos-sainz",
  "fernando-alonso",
  "pierre-gasly",
  "lance-stroll",
  "nico-hulkenberg",
  "liam-lawson",
  "esteban-ocon",
  "oliver-bearman",
  "franco-colapinto",
  "valtteri-bottas",
  "isack-hadjar",
  "kimi-antonelli",
  "alexander-albon",
  "gabriel-bortoleto",
  "sergio-perez",
  "arvid-lindblad",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNextRaceRound(): number {
  const idx = RACES.findIndex((r) => new Date(r.startUtc).getTime() > Date.now());
  return idx === -1 ? RACES[RACES.length - 1].r : RACES[idx].r;
}

function driverColor(ref: DriverRef | null): string {
  if (!ref?.driverId) return "rgba(255,255,255,0.35)";
  const driver = DRIVERS.find((d) => d.id === ref.driverId);
  if (!driver) return "rgba(255,255,255,0.35)";
  const teamId = driver.team.toLowerCase().replace(/\s+/g, "-");
  return TEAM_COLORS[teamId] ?? "rgba(255,255,255,0.35)";
}

function driverDisplay(ref: DriverRef | null): string {
  if (!ref) return "—";
  if (ref.driverId) {
    const d = DRIVERS.find((d) => d.id === ref.driverId);
    if (d) return d.name.split(" ").pop() ?? d.name;
  }
  // Not on 2026 grid — show last name from rawName
  return ref.rawName.split(" ").pop() ?? ref.rawName;
}

function teamColorById(teamName: string): string {
  const teamId = teamName.toLowerCase().replace(/\s+/g, "-");
  return TEAM_COLORS[teamId] ?? "#888888";
}

// ─── Pill / badge components ──────────────────────────────────────────────────

function OvertakingPill({ value }: { value: "Rare" | "Occasional" | "Frequent" }) {
  const colors: Record<string, string> = {
    Rare: "#ef4444",
    Occasional: "#f59e0b",
    Frequent: "#22c55e",
  };
  return (
    <span style={{ background: `${colors[value]}22`, color: colors[value], border: `1px solid ${colors[value]}55`, borderRadius: "999px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 }}>
      {value}
    </span>
  );
}

function SCPill({ value }: { value: "Low" | "Medium" | "High" }) {
  const colors: Record<string, string> = {
    Low: "#22c55e",
    Medium: "#f59e0b",
    High: "#ef4444",
  };
  return (
    <span style={{ background: `${colors[value]}22`, color: colors[value], border: `1px solid ${colors[value]}55`, borderRadius: "999px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 }}>
      {value}
    </span>
  );
}

function PoleWinPill({ pct }: { pct: number }) {
  const color = pct >= 70 ? "#ef4444" : pct >= 55 ? "#f59e0b" : "#22c55e";
  return (
    <span style={{ background: `${color}22`, color, border: `1px solid ${color}55`, borderRadius: "999px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 }}>
      {pct}%
    </span>
  );
}

function DriverPill({ ref: dRef }: { ref: DriverRef | null }) {
  const color = driverColor(dRef);
  const name = driverDisplay(dRef);
  if (!dRef) return <span style={{ color: "var(--muted)", fontSize: "13px" }}>—</span>;
  return (
    <span style={{ color, fontWeight: 700, fontSize: "13px" }}>{name}</span>
  );
}

// ─── Position pill for driver form ────────────────────────────────────────────

function PosPill({ position, raceName }: { position: number | null; raceName: string }) {
  if (position === null) {
    return (
      <span title={raceName} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "24px", borderRadius: "6px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)", fontSize: "11px", fontWeight: 600 }}>
        —
      </span>
    );
  }
  const isP1 = position === 1;
  const isP2 = position === 2;
  const isP3 = position === 3;
  const bg = isP1 ? "rgba(255,215,0,0.15)" : isP2 ? "rgba(192,192,192,0.15)" : isP3 ? "rgba(205,127,50,0.15)" : "rgba(255,255,255,0.07)";
  const border = isP1 ? "1px solid rgba(255,215,0,0.5)" : isP2 ? "1px solid rgba(192,192,192,0.4)" : isP3 ? "1px solid rgba(205,127,50,0.4)" : "1px solid rgba(255,255,255,0.1)";
  const color = isP1 ? "#ffd700" : isP2 ? "#c0c0c0" : isP3 ? "#cd7f32" : "rgba(255,255,255,0.65)";
  return (
    <span title={raceName} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "24px", borderRadius: "6px", background: bg, border, color, fontSize: "11px", fontWeight: 700 }}>
      {isP1 ? "🥇" : isP2 ? "🥈" : isP3 ? "🥉" : position}
    </span>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(10,10,18,0.85)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "14px",
      padding: "16px",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Result card (2024 / 2025) ────────────────────────────────────────────────

function ResultCard({ result, raceName, newCircuit = false }: { result: HistoricalResult | null; raceName: string; newCircuit?: boolean }) {
  if (!result) {
    return (
      <Card>
        <div style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "12px 0" }}>
          Loading {raceName}…
        </div>
      </Card>
    );
  }

  const yearBadgeColor = result.year === 2024 ? "#818cf8" : "#f472b6";
  const hasSprint = result.sprintWinner !== null || result.sprintQualPole !== null;

  if (!result.available) {
    return (
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <span style={{ background: `${yearBadgeColor}22`, color: yearBadgeColor, border: `1px solid ${yearBadgeColor}55`, borderRadius: "999px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 }}>
            {result.year}
          </span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "13px", fontStyle: "italic" }}>
          {newCircuit ? `No data for ${result.year} — new circuit` : `No data found for ${result.year}.`}
        </p>
      </Card>
    );
  }

  function Section({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div style={{ marginBottom: "10px" }}>
        <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "6px" }}>{label}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>{children}</div>
      </div>
    );
  }

  function Row({ label, dRef, extra }: { label: string; dRef: DriverRef | null; extra?: React.ReactNode }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", color: "var(--muted)", minWidth: "80px" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {extra}
          <DriverPill ref={dRef} />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span style={{ background: `${yearBadgeColor}22`, color: yearBadgeColor, border: `1px solid ${yearBadgeColor}55`, borderRadius: "999px", padding: "2px 10px", fontSize: "12px", fontWeight: 700 }}>
          {result.year}
        </span>
      </div>

      <Section label="Qualifying">
        <Row label="Pole" dRef={result.qualPole} />
        <Row label="P2" dRef={result.qualP2} />
        <Row label="P3" dRef={result.qualP3} />
      </Section>

      <Section label="Race">
        <Row label="Winner" dRef={result.raceWinner} />
        <Row label="P2" dRef={result.raceP2} />
        <Row label="P3" dRef={result.raceP3} />
        <Row label="Fastest Lap" dRef={result.fastestLap} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", color: "var(--muted)" }}>Safety Car</span>
          <span style={{
            fontSize: "12px", fontWeight: 700,
            color: result.safetyCar === true ? "#ef4444" : result.safetyCar === false ? "#22c55e" : "var(--muted)"
          }}>
            {result.safetyCar === null ? "—" : result.safetyCar ? "Yes" : "No"}
          </span>
        </div>
      </Section>

      {hasSprint && (
        <>
          <Section label="Sprint Qualifying">
            <Row label="Pole" dRef={result.sprintQualPole} />
            <Row label="P2" dRef={result.sprintQualP2} />
            <Row label="P3" dRef={result.sprintQualP3} />
          </Section>
          <Section label="Sprint Race">
            <Row label="Winner" dRef={result.sprintWinner} />
            <Row label="P2" dRef={result.sprintP2} />
            <Row label="P3" dRef={result.sprintP3} />
          </Section>
        </>
      )}
    </Card>
  );
}

// ─── Tips tab ─────────────────────────────────────────────────────────────────

function TipsTab({
  result2024,
  result2025,
  circuitChar,
  isSprint,
}: {
  result2024: HistoricalResult | null;
  result2025: HistoricalResult | null;
  circuitChar: CircuitCharacter | undefined;
  isSprint: boolean;
}) {
  function name24(ref: DriverRef | null | undefined): string {
    if (!ref) return "—";
    return driverDisplay(ref);
  }
  function name25(ref: DriverRef | null | undefined): string {
    if (!ref) return "—";
    return driverDisplay(ref);
  }

  const noHistory = circuitChar?.hasHistory === false;

  function TipCard({ label, pts, hint }: { label: string; pts: number; hint: string }) {
    return (
      <Card style={{ marginBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--foreground)" }}>{label}</span>
          <span style={{ background: "rgba(225,6,0,0.15)", color: "#e10600", border: "1px solid rgba(225,6,0,0.4)", borderRadius: "999px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 }}>
            {pts} pts
          </span>
        </div>
        <p style={{ fontSize: "13px", color: "var(--muted)", fontStyle: "italic", lineHeight: 1.5 }}>{hint}</p>
      </Card>
    );
  }

  if (noHistory) {
    const noDataHint = "Not enough historical data for this circuit. Check the Drivers tab for current form.";
    return (
      <div>
        <TipCard label="Qualifying Pole" pts={PICK_POINTS.qualPole} hint={noDataHint} />
        <TipCard label="Race Winner" pts={PICK_POINTS.raceWinner} hint={noDataHint} />
        <TipCard label="Race P2" pts={PICK_POINTS.raceP2} hint={noDataHint} />
        <TipCard label="Race P3" pts={PICK_POINTS.raceP3} hint={noDataHint} />
        <TipCard label="Fastest Lap" pts={PICK_POINTS.fastestLap} hint={noDataHint} />
        <TipCard label="Safety Car" pts={PICK_POINTS.safetyCar} hint={noDataHint} />
        {isSprint && (
          <>
            <TipCard label="Sprint Qual Pole" pts={PICK_POINTS.sprintQualPole} hint={noDataHint} />
            <TipCard label="Sprint Qual P2" pts={PICK_POINTS.sprintQualP2} hint={noDataHint} />
            <TipCard label="Sprint Qual P3" pts={PICK_POINTS.sprintQualP3} hint={noDataHint} />
            <TipCard label="Sprint Winner" pts={PICK_POINTS.sprintWinner} hint={noDataHint} />
            <TipCard label="Sprint P2" pts={PICK_POINTS.sprintP2} hint={noDataHint} />
            <TipCard label="Sprint P3" pts={PICK_POINTS.sprintP3} hint={noDataHint} />
          </>
        )}
      </div>
    );
  }

  const p2wNote = circuitChar ? `Pole converts to a win ${circuitChar.poleToWinPct}% of the time here.` : "";
  const scLikelihood = circuitChar?.safetyCarLikelihood ?? "Medium";
  const scNote = circuitChar?.safetyCarNote ?? "";

  const sc24 = result2024?.safetyCar;
  const sc25 = result2025?.safetyCar;
  const scHistoryStr = [
    sc24 !== null && sc24 !== undefined ? `2024: ${sc24 ? "Yes" : "No"}` : null,
    sc25 !== null && sc25 !== undefined ? `2025: ${sc25 ? "Yes" : "No"}` : null,
  ].filter(Boolean).join(", ");

  const scWorthIt = (scLikelihood === "High" || (sc24 === true && sc25 === true)) ? "Worth picking Yes." : scLikelihood === "Low" && sc24 === false && sc25 === false ? "Lean towards No." : "Historical data is split — a coin flip.";

  return (
    <div>
      <TipCard
        label="Qualifying Pole"
        pts={PICK_POINTS.qualPole}
        hint={`2024 pole: ${name24(result2024?.qualPole)}. 2025 pole: ${name25(result2025?.qualPole)}. ${p2wNote}`}
      />
      <TipCard
        label="Race Winner"
        pts={PICK_POINTS.raceWinner}
        hint={`2024 winner: ${name24(result2024?.raceWinner)}. 2025 winner: ${name25(result2025?.raceWinner)}. ${p2wNote}`}
      />
      <TipCard
        label="Race P2"
        pts={PICK_POINTS.raceP2}
        hint={`2024 P2: ${name24(result2024?.raceP2)}. 2025 P2: ${name25(result2025?.raceP2)}.`}
      />
      <TipCard
        label="Race P3"
        pts={PICK_POINTS.raceP3}
        hint={`2024 P3: ${name24(result2024?.raceP3)}. 2025 P3: ${name25(result2025?.raceP3)}.`}
      />
      <TipCard
        label="Fastest Lap"
        pts={PICK_POINTS.fastestLap}
        hint={`2024: ${name24(result2024?.fastestLap)}. 2025: ${name25(result2025?.fastestLap)}. Fastest lap typically goes to a top team making a free late stop.`}
      />
      <TipCard
        label="Safety Car"
        pts={PICK_POINTS.safetyCar}
        hint={`Safety car likelihood: ${scLikelihood}. ${scHistoryStr ? `Appeared — ${scHistoryStr}. ` : ""}${scWorthIt} ${scNote}`}
      />
      {isSprint && (
        <>
          <TipCard
            label="Sprint Qual Pole"
            pts={PICK_POINTS.sprintQualPole}
            hint={`2024 SQ pole: ${name24(result2024?.sprintQualPole)}. 2025 SQ pole: ${name25(result2025?.sprintQualPole)}.`}
          />
          <TipCard
            label="Sprint Qual P2"
            pts={PICK_POINTS.sprintQualP2}
            hint={`2024 SQ P2: ${name24(result2024?.sprintQualP2)}. 2025 SQ P2: ${name25(result2025?.sprintQualP2)}.`}
          />
          <TipCard
            label="Sprint Qual P3"
            pts={PICK_POINTS.sprintQualP3}
            hint={`2024 SQ P3: ${name24(result2024?.sprintQualP3)}. 2025 SQ P3: ${name25(result2025?.sprintQualP3)}.`}
          />
          <TipCard
            label="Sprint Winner"
            pts={PICK_POINTS.sprintWinner}
            hint={`2024 sprint winner: ${name24(result2024?.sprintWinner)}. 2025 sprint winner: ${name25(result2025?.sprintWinner)}.`}
          />
          <TipCard
            label="Sprint P2"
            pts={PICK_POINTS.sprintP2}
            hint={`2024 sprint P2: ${name24(result2024?.sprintP2)}. 2025 sprint P2: ${name25(result2025?.sprintP2)}.`}
          />
          <TipCard
            label="Sprint P3"
            pts={PICK_POINTS.sprintP3}
            hint={`2024 sprint P3: ${name24(result2024?.sprintP3)}. 2025 sprint P3: ${name25(result2025?.sprintP3)}.`}
          />
        </>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function IntelPage() {
  const [selectedRound, setSelectedRound] = useState(getNextRaceRound);
  const [tab, setTab] = useState<"circuit" | "drivers" | "tips">("circuit");
  const [result2024, setResult2024] = useState<HistoricalResult | null>(null);
  const [result2025, setResult2025] = useState<HistoricalResult | null>(null);
  const [driverForm, setDriverForm] = useState<DriverFormRow[] | null>(null);
  const [loadingCircuit, setLoadingCircuit] = useState(false);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driversEverLoaded, setDriversEverLoaded] = useState(false);

  const race = RACES.find((r) => r.r === selectedRound) ?? RACES[0];
  const circuitChar = CIRCUIT_INTEL.find((c) => c.round === selectedRound);

  const loadCircuitData = useCallback(async (round: number) => {
    setLoadingCircuit(true);
    setResult2024(null);
    setResult2025(null);
    const [r24, r25] = await Promise.all([
      fetchHistoricalCircuitResult(round, 2024),
      fetchHistoricalCircuitResult(round, 2025),
    ]);
    setResult2024(r24);
    setResult2025(r25);
    setLoadingCircuit(false);
  }, []);

  const loadDriverData = useCallback(async () => {
    setLoadingDrivers(true);
    const rows = await fetchDriverFormData(2025, 5);
    setDriverForm(rows);
    setDriversEverLoaded(true);
    setLoadingDrivers(false);
  }, []);

  // Load circuit data on mount + when round changes
  useEffect(() => {
    loadCircuitData(selectedRound);
    // If drivers tab is open, reset driver form so it re-fetches on next visible
    setDriverForm(null);
    setDriversEverLoaded(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRound]);

  // Load driver data on first Drivers tab select (lazy)
  useEffect(() => {
    if (tab === "drivers" && !driversEverLoaded && !loadingDrivers) {
      loadDriverData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function handleRoundChange(round: number) {
    setSelectedRound(round);
    setDriversEverLoaded(false);
    setDriverForm(null);
  }

  // Sort driver form rows by 2025 championship order
  const sortedDriverForm = driverForm
    ? [...driverForm].sort((a, b) => {
        const ai = DRIVER_ORDER_2025.indexOf(a.driverId);
        const bi = DRIVER_ORDER_2025.indexOf(b.driverId);
        const aIdx = ai === -1 ? 999 : ai;
        const bIdx = bi === -1 ? 999 : bi;
        return aIdx - bIdx;
      })
    : null;

  const TABS: { key: "circuit" | "drivers" | "tips"; label: string }[] = [
    { key: "circuit", label: "Circuit" },
    { key: "drivers", label: "Drivers" },
    { key: "tips", label: "Tips" },
  ];

  return (
    <div className="min-h-screen pb-28 md:pb-8" style={{ backgroundColor: "#13131f" }}>
      {/* Header */}
      <div className="sticky top-0 z-20" style={{ backgroundColor: "rgba(19,19,31,0.95)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="px-4 pt-4 pb-2" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="flex items-center gap-3 mb-3">
            <Link href="/" style={{ color: "var(--muted)", fontSize: "13px" }}>← Home</Link>
            <h1 style={{ fontFamily: "var(--font-orbitron)", fontSize: "18px", fontWeight: 700, color: "var(--foreground)" }}>
              Race Intel
            </h1>
          </div>

          {/* Round picker */}
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {RACES.map((r) => {
              const isSelected = r.r === selectedRound;
              const isPast = new Date(r.startUtc).getTime() < Date.now();
              return (
                <button
                  key={r.r}
                  onClick={() => handleRoundChange(r.r)}
                  style={{
                    flexShrink: 0,
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: isSelected ? 700 : 500,
                    fontFamily: "var(--font-orbitron)",
                    background: isSelected ? "#e10600" : "rgba(255,255,255,0.06)",
                    color: isSelected ? "#fff" : isPast ? "rgba(255,255,255,0.3)" : "var(--muted)",
                    border: isSelected ? "1px solid #e10600" : "1px solid rgba(255,255,255,0.1)",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  R{r.r} {r.flag}
                </button>
              );
            })}
          </div>

          {/* Race name + sprint badge */}
          <div className="flex items-center gap-2 mt-1 mb-2">
            <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--foreground)" }}>{race.name}</span>
            {race.sprint && (
              <span style={{ background: "rgba(255,200,0,0.1)", color: "#ffc800", border: "1px solid rgba(255,200,0,0.3)", borderRadius: "999px", padding: "1px 8px", fontSize: "10px", fontWeight: 700 }}>
                Sprint
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: "6px 16px",
                  borderRadius: "8px 8px 0 0",
                  fontSize: "13px",
                  fontWeight: tab === key ? 700 : 500,
                  background: tab === key ? "rgba(255,255,255,0.1)" : "transparent",
                  color: tab === key ? "var(--foreground)" : "var(--muted)",
                  border: "none",
                  borderBottom: tab === key ? "2px solid #e10600" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pt-4" style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* ── Circuit tab ── */}
        {tab === "circuit" && (
          <div>
            {/* Circuit character card */}
            {circuitChar ? (
              <Card style={{ marginBottom: "16px" }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--foreground)" }}>{race.circuit}</span>
                  <span style={{ background: circuitChar.trackType === "Street" ? "rgba(99,102,241,0.15)" : "rgba(34,197,94,0.12)", color: circuitChar.trackType === "Street" ? "#818cf8" : "#22c55e", border: `1px solid ${circuitChar.trackType === "Street" ? "rgba(99,102,241,0.4)" : "rgba(34,197,94,0.3)"}`, borderRadius: "999px", padding: "2px 10px", fontSize: "11px", fontWeight: 700 }}>
                    {circuitChar.trackType}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)", minWidth: "110px" }}>Overtaking</span>
                      <OvertakingPill value={circuitChar.overtaking} />
                    </div>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginLeft: "118px", lineHeight: 1.4 }}>{circuitChar.overtakingNote}</p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)", minWidth: "110px" }}>Safety Car</span>
                      <SCPill value={circuitChar.safetyCarLikelihood} />
                    </div>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginLeft: "118px", lineHeight: 1.4 }}>{circuitChar.safetyCarNote}</p>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "12px", color: "var(--muted)", minWidth: "110px" }}>Pole → Win</span>
                      <PoleWinPill pct={circuitChar.poleToWinPct} />
                    </div>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", marginLeft: "118px", lineHeight: 1.4 }}>{circuitChar.poleToWinNote}</p>
                  </div>
                </div>

                <p style={{ fontSize: "12px", fontStyle: "italic", color: "rgba(255,255,255,0.45)", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.08)", lineHeight: 1.5 }}>
                  {circuitChar.insight}
                </p>
              </Card>
            ) : null}

            {/* Historical result cards */}
            {loadingCircuit ? (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: "32px", fontSize: "13px" }}>
                Loading historical results…
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ResultCard result={result2024} raceName="2024" newCircuit={circuitChar?.hasHistory === false} />
                <ResultCard result={result2025} raceName="2025" newCircuit={circuitChar?.hasHistory === false} />
              </div>
            )}
          </div>
        )}

        {/* ── Drivers tab ── */}
        {tab === "drivers" && (
          <div>
            {loadingDrivers ? (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: "48px", fontSize: "13px" }}>
                Loading 2025 driver form…
              </div>
            ) : !sortedDriverForm ? (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: "48px", fontSize: "13px" }}>
                Fetching data…
              </div>
            ) : sortedDriverForm.length === 0 ? (
              <div style={{ color: "var(--muted)", textAlign: "center", padding: "48px", fontSize: "13px" }}>
                No driver data available.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "8px" }}>
                  Last 5 races of 2025 — ordered by 2025 championship position
                </p>
                {sortedDriverForm.map((row) => {
                  const teamColor = teamColorById(row.team);
                  return (
                    <div key={row.driverId} style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(10,10,18,0.8)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "8px 12px", borderLeft: `4px solid ${teamColor}` }}>
                      <div style={{ flex: "0 0 140px", minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.driverName}</div>
                        <div style={{ fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.team}</div>
                      </div>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {row.positions.map((p, i) => (
                          <PosPill key={i} position={p.position} raceName={p.raceName} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tips tab ── */}
        {tab === "tips" && (
          <TipsTab
            result2024={result2024}
            result2025={result2025}
            circuitChar={circuitChar}
            isSprint={race.sprint}
          />
        )}
      </div>
    </div>
  );
}
