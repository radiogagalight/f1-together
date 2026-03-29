"use client";

import { use, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { RACES, DRIVERS, CONSTRUCTORS, formatRaceDate, flagToCC } from "@/lib/data";
import { RACE_FACTS } from "@/lib/raceFacts";
import type { RaceFact, RaceSession } from "@/lib/raceFacts";
import { useRacePick } from "@/hooks/useRacePick";
import DriverSelect from "@/components/DriverSelect";
import type { RacePick, RaceResult, ScoreBreakdown, RaceWildcard, WildcardPick } from "@/lib/types";
import { PICK_POINTS, scoreRound, scoreWildcards } from "@/lib/scoring";
import { loadRaceResult } from "@/lib/resultsStorage";
import { loadWildcards as loadWildcardsFromStorage, saveWildcardPick, deleteWildcardPick } from "@/lib/wildcardStorage";
import { createClient } from "@/lib/supabase/client";

function driverLastName(id: string | null): string {
  if (!id) return "—";
  return DRIVERS.find((d) => d.id === id)?.name.split(" ").pop() ?? id;
}

const MIAMI_SPEED_LINES = [
  { top:  8, width: 68, dur: 4.2, delay: 0.0, opacity: 0.45, color: "#00D4BE", height: 3 },
  { top: 19, width: 48, dur: 5.2, delay: 1.4, opacity: 0.35, color: "#FF0090", height: 2 },
  { top: 31, width: 74, dur: 3.5, delay: 3.1, opacity: 0.42, color: "#00B4D8", height: 3 },
  { top: 44, width: 55, dur: 6.0, delay: 0.8, opacity: 0.32, color: "#FF0090", height: 2 },
  { top: 57, width: 72, dur: 4.0, delay: 2.5, opacity: 0.46, color: "#00D4BE", height: 3 },
  { top: 69, width: 42, dur: 4.8, delay: 1.9, opacity: 0.30, color: "#00B4D8", height: 2 },
  { top: 81, width: 62, dur: 4.4, delay: 4.3, opacity: 0.40, color: "#FF0090", height: 2 },
  { top: 91, width: 52, dur: 5.5, delay: 0.6, opacity: 0.34, color: "#00D4BE", height: 3 },
];

function CountdownCard({ targetUtc, label, target, raceUtc, miami }: { targetUtc: string; label: string; target: string; raceUtc?: string; miami?: boolean }) {
  const [timeLeft, setTimeLeft] = useState(() =>
    Math.max(0, new Date(targetUtc).getTime() - Date.now())
  );

  useEffect(() => {
    const id = setInterval(
      () => setTimeLeft(Math.max(0, new Date(targetUtc).getTime() - Date.now())),
      1000
    );
    return () => clearInterval(id);
  }, [targetUtc]);

  const expired = timeLeft === 0;
  const raceOver = raceUtc ? new Date(raceUtc).getTime() < Date.now() : false;
  const days    = Math.floor(timeLeft / 86_400_000);
  const hours   = Math.floor((timeLeft % 86_400_000) / 3_600_000);
  const minutes = Math.floor((timeLeft % 3_600_000) / 60_000);
  const seconds = Math.floor((timeLeft % 60_000) / 1_000);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="rounded-xl overflow-hidden mb-6"
      style={miami ? {
        border: "1px solid rgba(0,212,190,0.35)",
        background: "linear-gradient(135deg, rgba(0,212,190,0.10) 0%, rgba(6,20,28,0.7) 100%)",
        boxShadow: "0 0 24px rgba(0,212,190,0.12)",
      } : {
        border: "1px solid rgba(225,6,0,0.35)",
        background: "linear-gradient(135deg, rgba(225,6,0,0.10) 0%, rgba(30,6,6,0.7) 100%)",
        boxShadow: "0 0 24px rgba(225,6,0,0.10)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: miami ? "1px solid rgba(0,212,190,0.2)" : "1px solid rgba(225,6,0,0.2)" }}>
        <span className="inline-block h-px w-4 rounded-full" style={{ backgroundColor: miami ? "#00D4BE" : "var(--f1-red)" }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
          {label}
        </span>
      </div>

      <div className="px-4 py-4">
        {expired ? (
          <p className="text-center font-bold text-lg" style={{ color: miami ? "#00D4BE" : "var(--f1-red)" }}>
            {raceOver ? "This race has already taken place. 🏁" : "Race weekend is underway! 🏁"}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { value: days,    unit: "DAYS" },
                { value: hours,   unit: "HRS"  },
                { value: minutes, unit: "MINS" },
                { value: seconds, unit: "SECS" },
              ].map(({ value, unit }) => (
                <div key={unit} className="flex flex-col items-center">
                  <span
                    className="font-black tabular-nums leading-none"
                    style={{ fontSize: "clamp(28px, 7vw, 42px)", color: "var(--foreground)" }}
                  >
                    {unit === "DAYS" ? value : pad(value)}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest mt-1"
                    style={{ color: miami ? "#00D4BE" : "var(--f1-red)" }}
                  >
                    {unit}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs font-semibold mt-3" style={{ color: miami ? "#FF0090" : "var(--f1-red)" }}>
              Until {target}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SessionCard({ sessions, timezoneName }: { sessions: RaceSession[]; timezoneName: string }) {
  const now = Date.now();
  const nextIdx = sessions.findIndex((s) => new Date(s.utc).getTime() > now);

  return (
    <div
      className="rounded-xl overflow-hidden mb-6"
      style={{
        border: "1px solid rgba(34,197,94,0.3)",
        background: "linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(6,16,8,0.7) 100%)",
        boxShadow: "0 0 24px rgba(34,197,94,0.08)",
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(34,197,94,0.15)" }}>
        <span className="inline-block h-px w-4 rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.8)" }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
          Weekend Schedule
        </span>
      </div>

      <div>
        {sessions.map((session, i) => {
          const isPast = new Date(session.utc).getTime() < now;
          const isNext = i === nextIdx;
          const tz = timezoneName;
          const day  = new Date(session.utc).toLocaleDateString("en-US", { weekday: "short", timeZone: tz });
          const date = new Date(session.utc).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: tz });
          const time = new Date(session.utc).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: tz });

          return (
            <div
              key={session.name}
              className="flex items-center gap-3 px-4 py-3"
              style={{
                borderTop: i > 0 ? "1px solid rgba(34,197,94,0.1)" : "none",
                opacity: isPast ? 0.38 : 1,
              }}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: isNext ? "#22c55e" : isPast ? "rgba(255,255,255,0.2)" : "rgba(34,197,94,0.4)",
                  boxShadow: isNext ? "0 0 8px rgba(34,197,94,0.9)" : "none",
                }}
              />
              <span
                className="text-sm font-semibold flex-1"
                style={{ color: isNext ? "#22c55e" : isPast ? "var(--muted)" : "var(--foreground)" }}
              >
                {session.name}
              </span>
              <span
                className="text-xs font-mono shrink-0"
                style={{ color: isNext ? "#22c55e" : "var(--muted)" }}
              >
                {day} · {date} · {time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FactCard({ facts }: { facts: RaceFact[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div
      className="rounded-xl overflow-hidden mb-6"
      style={{
        border: "1px solid rgba(80,160,255,0.35)",
        background: "linear-gradient(135deg, rgba(80,160,255,0.10) 0%, rgba(6,16,30,0.7) 100%)",
        boxShadow: "0 0 24px rgba(80,160,255,0.10)",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ borderBottom: open ? "1px solid rgba(80,160,255,0.2)" : "none" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-px w-4 rounded-full"
            style={{ backgroundColor: "rgba(80,160,255,0.8)" }}
          />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Track Facts
          </span>
        </div>
        <span style={{ color: "rgba(80,160,255,0.9)", fontSize: "11px", fontWeight: 700 }}>
          {open ? "▲ Hide" : "▼ Show"}
        </span>
      </button>

      {open && (
        <div>
          {facts.map((fact, i) => (
            <div
              key={fact.label}
              className="px-4 py-3"
              style={{ borderTop: i > 0 ? "1px solid rgba(80,160,255,0.12)" : "none" }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                style={{ color: "rgba(80,160,255,0.9)" }}
              >
                {fact.label}
              </div>
              <div className="text-sm" style={{ color: "var(--foreground)" }}>
                {fact.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const SECTION_INFO: Record<string, {
  title: string;
  rows: Array<{ label: string; pts?: string; note?: boolean }>;
}> = {
  qual: {
    title: "Qualifying Scoring",
    rows: [
      { label: "Pole Position — exact position", pts: "8 pts" },
      { label: "P2 — exact position", pts: "5 pts" },
      { label: "P3 — exact position", pts: "3 pts" },
      { label: "Right driver, wrong slot", pts: "2 pts" },
    ],
  },
  race: {
    title: "Race Scoring",
    rows: [
      { label: "Race Winner", pts: "25 pts" },
      { label: "P2", pts: "18 pts" },
      { label: "P3", pts: "15 pts" },
      { label: "P4", pts: "12 pts" },
      { label: "P5", pts: "10 pts" },
      { label: "P6", pts: "8 pts" },
      { label: "Fastest Lap", pts: "5 pts" },
      { label: "Safety Car deployed", pts: "5 pts" },
      { label: "Booster: apply ⚡ to any one race pick for 2× points (1 per race)", note: true },
      { label: "P1/P2/P3: right driver, wrong podium position", pts: "5 pts" },
      { label: "P4–P6, Fastest Lap, Safety Car: exact match only", note: true },
    ],
  },
  sprintQual: {
    title: "Sprint Qualifying Scoring",
    rows: [
      { label: "Pole Position — exact position", pts: "8 pts" },
      { label: "P2 — exact position", pts: "5 pts" },
      { label: "P3 — exact position", pts: "3 pts" },
      { label: "Right driver, wrong slot", pts: "2 pts" },
    ],
  },
  sprintRace: {
    title: "Sprint Race Scoring",
    rows: [
      { label: "Sprint Winner", pts: "8 pts" },
      { label: "P2", pts: "7 pts" },
      { label: "P3", pts: "6 pts" },
      { label: "Right driver, wrong sprint podium position", pts: "2 pts" },
    ],
  },
};

export default function RaceDetailPage({
  params,
}: {
  params: Promise<{ round: string }>;
}) {
  const { round: roundStr } = use(params);
  const round = parseInt(roundStr);
  const isMiami = round === 4;
  const race = RACES.find((r) => r.r === round);
  const { user, timezoneName } = useAuth();
  const { picks, setPick, toggleBoost, savedField, loading } = useRacePick(user?.id, round);

  const [now, setNow] = useState(Date.now());
  const [openInfo, setOpenInfo] = useState<string | null>(null);
  const [result, setResult] = useState<RaceResult | null>(null);
  const [wildcards, setWildcards] = useState<RaceWildcard[]>([]);
  const [wildcardPicks, setWildcardPicks] = useState<WildcardPick[]>([]);
  const [wcSavedId, setWcSavedId] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    loadRaceResult(round, supabase).then(setResult);
  }, [round]);

  const loadWildcards = useCallback(async () => {
    const supabase = createClient();
    setWildcards(await loadWildcardsFromStorage(round, supabase));
  }, [round]);

  useEffect(() => { loadWildcards(); }, [loadWildcards]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("wildcard_picks")
      .select("wildcard_id, pick_value, boosted, race_wildcards!inner(round)")
      .eq("user_id", user.id)
      .eq("race_wildcards.round", round)
      .then(({ data }) => {
        setWildcardPicks((data ?? []).map((r) => ({
          wildcardId: r.wildcard_id as string,
          pickValue:  r.pick_value as string,
          boosted:    r.boosted as boolean,
        })));
      });
  }, [user, round]);

  const breakdown: ScoreBreakdown | null =
    picks && result && user ? scoreRound(user.id, picks, result).breakdown : null;

  function pickResult(field: keyof ScoreBreakdown): { status: "correct" | "partial" | "wrong"; pts: number } | undefined {
    if (!result || !picks || !breakdown) return undefined;
    const resultVal = result[field as keyof RaceResult] as string | boolean | null | undefined;
    const pickVal = picks[field as keyof RacePick] as string | boolean | null | undefined;
    if (resultVal === null || resultVal === undefined) return undefined;
    if (pickVal === null || pickVal === undefined) return undefined;
    const pts = breakdown[field];
    if (pickVal === resultVal) return { status: "correct", pts };
    if (pts > 0) return { status: "partial", pts };
    return { status: "wrong", pts: 0 };
  }

  if (!race) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <p style={{ color: "var(--muted)" }}>Race not found.</p>
      </div>
    );
  }

  const isQualLocked    = new Date(race.qualifyingUtc).getTime() < now;
  const isRaceLocked    = new Date(race.startUtc).getTime() < now;
  const isSprintQualLocked = race.sprintQualifyingUtc
    ? new Date(race.sprintQualifyingUtc).getTime() < now
    : false;
  const isSprintLocked = race.sprintStartUtc
    ? new Date(race.sprintStartUtc).getTime() < now
    : false;
  const raceData = RACE_FACTS[round];
  const heroImage = raceData?.heroImage;
  const trackImage = raceData?.trackImage;

  const QUAL_FIELDS:         (keyof RacePick)[] = ["qualPole", "qualP2", "qualP3"];
  const SPRINT_QUAL_FIELDS:  (keyof RacePick)[] = ["sprintQualPole", "sprintQualP2", "sprintQualP3"];
  const SPRINT_FIELDS:       (keyof RacePick)[] = ["sprintWinner", "sprintP2", "sprintP3"];
  const BOOSTABLE_RACE_FIELDS = ["raceWinner", "raceP2", "raceP3", "raceP4", "raceP5", "raceP6", "fastestLap", "safetyCar"];

  function pick(field: keyof RacePick, value: string | boolean | null) {
    const locked = QUAL_FIELDS.includes(field)        ? isQualLocked
                 : SPRINT_QUAL_FIELDS.includes(field)  ? isSprintQualLocked
                 : SPRINT_FIELDS.includes(field)        ? isSprintLocked
                 : isRaceLocked;
    if (!locked) setPick(field, value);
  }

  const boostedPicks = picks?.boostedPicks ?? [];
  const boostedWildcardCount = wildcardPicks.filter((p) => p.boosted).length;
  const totalBoostersUsed = boostedPicks.length + boostedWildcardCount;
  const boostersRemaining = 1 - totalBoostersUsed;

  function handleBoostRacePick(field: string) {
    if (isRaceLocked) return;
    toggleBoost(field, boostedWildcardCount);
  }

  async function handleWildcardPick(wildcardId: string, pickValue: string | null) {
    if (!user || isRaceLocked) return;
    const supabase = createClient();
    if (pickValue === null) {
      await deleteWildcardPick(user.id, wildcardId, supabase);
      setWildcardPicks((prev) => prev.filter((p) => p.wildcardId !== wildcardId));
    } else {
      const existing = wildcardPicks.find((p) => p.wildcardId === wildcardId);
      const boosted = existing?.boosted ?? false;
      await saveWildcardPick(user.id, wildcardId, pickValue, boosted, supabase);
      setWildcardPicks((prev) => {
        const filtered = prev.filter((p) => p.wildcardId !== wildcardId);
        return [...filtered, { wildcardId, pickValue, boosted }];
      });
      setWcSavedId(wildcardId);
      setTimeout(() => setWcSavedId(null), 1500);
    }
  }

  async function handleWildcardBoost(wildcardId: string) {
    if (!user || isRaceLocked) return;
    const existing = wildcardPicks.find((p) => p.wildcardId === wildcardId);
    if (!existing) return; // must pick before boosting
    const alreadyBoosted = existing.boosted;
    if (!alreadyBoosted && boostersRemaining <= 0) return;
    const supabase = createClient();
    const newBoosted = !alreadyBoosted;
    await saveWildcardPick(user.id, wildcardId, existing.pickValue, newBoosted, supabase);
    setWildcardPicks((prev) =>
      prev.map((p) => p.wildcardId === wildcardId ? { ...p, boosted: newBoosted } : p)
    );
  }

  function wcDisplayName(wc: RaceWildcard, val: string): string {
    if (wc.questionType === "boolean") return val === "yes" ? "Yes" : "No";
    if (wc.questionType === "driver") return DRIVERS.find((d) => d.id === val)?.name ?? val;
    if (wc.questionType === "constructor") return CONSTRUCTORS.find((c) => c.id === val)?.name ?? val;
    return wc.options?.find((o) => o.id === val)?.name ?? val;
  }

  return (
    <div style={isMiami ? { backgroundColor: "#1c1c2c", minHeight: "100vh" } : undefined}>
    {isMiami && (
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {MIAMI_SPEED_LINES.map((line, i) => (
          <div
            key={i}
            className="absolute left-0"
            style={{
              top: `${line.top}%`,
              width: `${line.width}%`,
              height: `${line.height}px`,
              background: `linear-gradient(to right, transparent, ${line.color}, transparent)`,
              opacity: line.opacity,
              animation: `speed-rush ${line.dur}s linear ${line.delay}s infinite`,
            }}
          />
        ))}
      </div>
    )}
    <div className="relative pb-28 md:pb-6" style={{ zIndex: 1 }}>

      {/* ── Hero banner (when flag image exists) ── */}
      {heroImage ? (
        <div className="relative overflow-hidden mb-6" style={{ height: "210px" }}>
          <Image
            src={heroImage}
            alt={`${race.name} flag`}
            fill
            style={{ objectFit: "cover", objectPosition: "center", opacity: 0.55 }}
            priority
          />
          {/* Gradient: subtle at top, fades fully to page bg at bottom */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: isMiami
                ? "linear-gradient(to bottom, rgba(28,28,44,0.25) 0%, rgba(28,28,44,0.0) 30%, rgba(28,28,44,0.75) 68%, rgba(28,28,44,1.0) 100%)"
                : "linear-gradient(to bottom, rgba(8,8,16,0.25) 0%, rgba(8,8,16,0.0) 30%, rgba(8,8,16,0.75) 68%, rgba(8,8,16,1.0) 100%)",
            }}
          />
          {/* Race info pinned to bottom-left */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                Round {race.r} · {formatRaceDate(race, timezoneName)}
              </span>
              {race.sprint && (
                <span
                  className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: "rgba(255,200,0,0.15)",
                    color: "#ffc800",
                    border: "1px solid rgba(255,200,0,0.4)",
                  }}
                >
                  Sprint
                </span>
              )}
              {isRaceLocked && (
                <span
                  className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  🔒 Locked
                </span>
              )}
              {isQualLocked && !isRaceLocked && (
                <span
                  className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  🔒 Qual Locked
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#ffffff", textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
              {race.name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
              {race.circuit}
            </p>
          </div>
        </div>
      ) : (
        /* ── Plain header fallback for races without a hero image ── */
        <div className="px-4 pt-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
              Round {race.r} · {formatRaceDate(race, timezoneName)}
            </span>
            {race.sprint && (
              <span
                className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
                style={{ backgroundColor: "rgba(255,200,0,0.1)", color: "#ffc800", border: "1px solid rgba(255,200,0,0.3)" }}
              >
                Sprint
              </span>
            )}
            {isRaceLocked && (
              <span
                className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--muted)", border: "1px solid var(--border)" }}
              >
                🔒 Locked
              </span>
            )}
            {isQualLocked && !isRaceLocked && (
              <span
                className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--muted)", border: "1px solid var(--border)" }}
              >
                🔒 Qual Locked
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://flagcdn.com/w40/${flagToCC(race.flag)}.png`}
              width={28}
              height={21}
              alt=""
              className="rounded-sm shrink-0"
              style={{ objectFit: "cover" }}
            />
            <span>{race.name}</span>
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{race.circuit}</p>
        </div>
      )}

      {/* ── Content: two-column on desktop ── */}
      <div className="px-4 md:px-6 md:flex md:gap-8 md:items-start">

        {/* ── Right rail — first in DOM (top on mobile, right sticky on desktop) ── */}
        <div className="md:w-72 md:shrink-0 md:order-last md:sticky md:top-4">

          {/* Race weekend countdown */}
          {race.weekendStartUtc && (
            <CountdownCard
              targetUtc={race.weekendStartUtc}
              label="Race Weekend Countdown"
              target="Practice 1"
              raceUtc={race.startUtc}
              miami={isMiami}
            />
          )}

          {/* Race intel link card */}
          <Link
            href={`/intel?round=${race.r}`}
            className="block rounded-xl overflow-hidden mb-6"
            style={{
              border: "1px solid rgba(255,140,0,0.35)",
              background: "linear-gradient(135deg, rgba(255,140,0,0.10) 0%, rgba(30,18,6,0.7) 100%)",
              boxShadow: "0 0 24px rgba(255,140,0,0.10)",
              textDecoration: "none",
            }}
          >
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,140,0,0.2)" }}>
              <span className="inline-block h-px w-4 rounded-full" style={{ backgroundColor: "rgba(255,140,0,0.9)" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
                Race Intel
              </span>
            </div>
            <div className="px-4 py-4 flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
                Help me with my predictions
              </span>
              <span className="text-xs font-semibold" style={{ color: "rgba(255,140,0,0.9)" }}>
                View →
              </span>
            </div>
          </Link>

          {/* Weekend schedule card */}
          {raceData?.sessions && <SessionCard sessions={raceData.sessions} timezoneName={timezoneName} />}

        </div>

        {/* ── Main column — picks ── */}
        <div className="md:flex-1 min-w-0 md:order-first">

        {/* Circuit image */}
        {trackImage && (
          <div className="relative rounded-xl overflow-hidden mb-6" style={{ height: "180px" }}>
            <Image
              src={trackImage}
              alt={`${race.name} circuit`}
              fill
              style={{ objectFit: "cover", objectPosition: "center" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to bottom, transparent 50%, rgba(8,8,16,0.85) 100%)",
              }}
            />
            <div className="absolute bottom-0 left-0 px-4 pb-3">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
                {race.circuit}
              </p>
            </div>
          </div>
        )}

        {/* Track fact card */}
        {raceData?.facts && <FactCard facts={raceData.facts} />}

        {race.sprint && isSprintQualLocked && !isSprintLocked && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(255,200,0,0.04)", border: "1px solid rgba(255,200,0,0.25)", color: "var(--muted)" }}
          >
            🔒 Sprint Qualifying predictions are locked. Sprint Race predictions lock at the sprint lights out.
          </div>
        )}
        {race.sprint && isSprintLocked && !isQualLocked && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(255,200,0,0.04)", border: "1px solid rgba(255,200,0,0.25)", color: "var(--muted)" }}
          >
            🔒 Sprint predictions are locked. Qualifying and race predictions are still open.
          </div>
        )}
        {isQualLocked && !isRaceLocked && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            🔒 Qualifying predictions are locked. Race predictions lock at lights out.
          </div>
        )}
        {isRaceLocked && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            🔒 All predictions for this race are locked.
          </div>
        )}

        {loading ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <div className="flex flex-col gap-6">

            {/* ── Actual Results ── */}
            {isQualLocked && result && (result.qualPole !== null || result.sprintQualPole !== null) && (
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(34,197,94,0.3)", backgroundColor: "rgba(34,197,94,0.04)" }}>
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(34,197,94,0.15)" }}>
                  <span className="inline-block h-px w-4 rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.8)" }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>Actual Results</span>
                </div>
                <div className="px-4 py-3 flex flex-col gap-4">
                  {race.sprint && result.sprintQualPole && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(34,197,94,0.7)" }}>Sprint Qualifying</p>
                      <div className="flex gap-5">
                        {[{ pos: "P1", id: result.sprintQualPole }, { pos: "P2", id: result.sprintQualP2 }, { pos: "P3", id: result.sprintQualP3 }].map(({ pos, id }) => (
                          <div key={pos} className="flex flex-col gap-0.5">
                            <span className="text-[10px]" style={{ color: "var(--muted)" }}>{pos}</span>
                            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{driverLastName(id)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {race.sprint && result.sprintWinner && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(34,197,94,0.7)" }}>Sprint Race</p>
                      <div className="flex gap-5">
                        {[{ pos: "P1", id: result.sprintWinner }, { pos: "P2", id: result.sprintP2 }, { pos: "P3", id: result.sprintP3 }].map(({ pos, id }) => (
                          <div key={pos} className="flex flex-col gap-0.5">
                            <span className="text-[10px]" style={{ color: "var(--muted)" }}>{pos}</span>
                            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{driverLastName(id)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.qualPole && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(34,197,94,0.7)" }}>Qualifying</p>
                      <div className="flex gap-5">
                        {[{ pos: "P1", id: result.qualPole }, { pos: "P2", id: result.qualP2 }, { pos: "P3", id: result.qualP3 }].map(({ pos, id }) => (
                          <div key={pos} className="flex flex-col gap-0.5">
                            <span className="text-[10px]" style={{ color: "var(--muted)" }}>{pos}</span>
                            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{driverLastName(id)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.raceWinner && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(34,197,94,0.7)" }}>Race</p>
                      <div className="flex gap-5 flex-wrap">
                        {[
                          { pos: "P1", id: result.raceWinner },
                          { pos: "P2", id: result.raceP2 },
                          { pos: "P3", id: result.raceP3 },
                          { pos: "P4", id: result.raceP4 },
                          { pos: "P5", id: result.raceP5 },
                          { pos: "P6", id: result.raceP6 },
                        ].filter(({ id }) => id !== null).map(({ pos, id }) => (
                          <div key={pos} className="flex flex-col gap-0.5">
                            <span className="text-[10px]" style={{ color: "var(--muted)" }}>{pos}</span>
                            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{driverLastName(id)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-5 mt-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]" style={{ color: "var(--muted)" }}>Fastest Lap</span>
                          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{driverLastName(result.fastestLap)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px]" style={{ color: "var(--muted)" }}>Safety Car</span>
                          <span className="text-sm font-semibold" style={{ color: result.safetyCar === true ? "#22c55e" : result.safetyCar === false ? "#ef4444" : "var(--muted)" }}>
                            {result.safetyCar === null ? "—" : result.safetyCar ? "Yes" : "No"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Sprint Qualifying (sprint weekends only) ── */}
            {race.sprint && (
              <div
                className="rounded-xl p-4"
                style={{
                  border: "1px solid rgba(255,200,0,0.25)",
                  backgroundColor: "rgba(255,200,0,0.04)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="inline-block w-1 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: "#ffc800" }}
                  />
                  <h2
                    className="text-sm font-bold uppercase tracking-widest shrink-0"
                    style={{ color: "var(--foreground)" }}
                  >
                    Sprint Qualifying
                  </h2>
                  <span className="text-[10px] font-semibold shrink-0" style={{ color: "rgba(255,200,0,0.65)" }}>8 / 5 / 3 pts · +2 partial</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,200,0,0.2)" }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenInfo(openInfo === "sprintQual" ? null : "sprintQual"); }}
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: openInfo === "sprintQual" ? (isMiami ? "rgba(255,0,144,0.15)" : "rgba(225,6,0,0.15)") : "rgba(255,255,255,0.08)",
                      border: openInfo === "sprintQual" ? (isMiami ? "1px solid rgba(255,0,144,0.4)" : "1px solid rgba(225,6,0,0.4)") : "1px solid rgba(255,255,255,0.14)",
                      color: openInfo === "sprintQual" ? (isMiami ? "#FF0090" : "var(--f1-red)") : "var(--muted)",
                      fontSize: "10px", fontWeight: 700, cursor: "pointer",
                    }}
                    aria-label="Sprint qualifying scoring info"
                  >?</button>
                  {isSprintQualLocked && (
                    <span
                      className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: "rgba(255,200,0,0.08)",
                        color: "#ffc800",
                        border: "1px solid rgba(255,200,0,0.3)",
                      }}
                    >
                      🔒 Locked
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <DriverSelect
                    label="Pole Position"
                    value={picks?.sprintQualPole ?? null}
                    isSaved={savedField === "sprintQualPole"}
                    disabled={isSprintQualLocked}
                    onPick={(v) => pick("sprintQualPole", v)}
                    points={PICK_POINTS.sprintQualPole}
                    resultStatus={pickResult("sprintQualPole")?.status}
                    pointsEarned={pickResult("sprintQualPole")?.pts}
                  />
                  <DriverSelect
                    label="P2"
                    value={picks?.sprintQualP2 ?? null}
                    isSaved={savedField === "sprintQualP2"}
                    disabled={isSprintQualLocked}
                    onPick={(v) => pick("sprintQualP2", v)}
                    points={PICK_POINTS.sprintQualP2}
                    resultStatus={pickResult("sprintQualP2")?.status}
                    pointsEarned={pickResult("sprintQualP2")?.pts}
                  />
                  <DriverSelect
                    label="P3"
                    value={picks?.sprintQualP3 ?? null}
                    isSaved={savedField === "sprintQualP3"}
                    disabled={isSprintQualLocked}
                    onPick={(v) => pick("sprintQualP3", v)}
                    points={PICK_POINTS.sprintQualP3}
                    resultStatus={pickResult("sprintQualP3")?.status}
                    pointsEarned={pickResult("sprintQualP3")?.pts}
                  />
                </div>
              </div>
            )}

            {/* ── Sprint Race (sprint weekends only) ── */}
            {race.sprint && (
              <div
                className="rounded-xl p-4"
                style={{
                  border: "1px solid rgba(255,200,0,0.25)",
                  backgroundColor: "rgba(255,200,0,0.04)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="inline-block w-1 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: "#ffc800" }}
                  />
                  <h2
                    className="text-sm font-bold uppercase tracking-widest shrink-0"
                    style={{ color: "var(--foreground)" }}
                  >
                    Sprint Race
                  </h2>
                  <span className="text-[10px] font-semibold shrink-0" style={{ color: "rgba(255,200,0,0.65)" }}>8 / 7 / 6 pts</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,200,0,0.2)" }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenInfo(openInfo === "sprintRace" ? null : "sprintRace"); }}
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: openInfo === "sprintRace" ? "rgba(225,6,0,0.15)" : "rgba(255,255,255,0.08)",
                      border: openInfo === "sprintRace" ? "1px solid rgba(225,6,0,0.4)" : "1px solid rgba(255,255,255,0.14)",
                      color: openInfo === "sprintRace" ? "var(--f1-red)" : "var(--muted)",
                      fontSize: "10px", fontWeight: 700, cursor: "pointer",
                    }}
                    aria-label="Sprint race scoring info"
                  >?</button>
                  {isSprintLocked && (
                    <span
                      className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: "rgba(255,200,0,0.08)",
                        color: "#ffc800",
                        border: "1px solid rgba(255,200,0,0.3)",
                      }}
                    >
                      🔒 Locked
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <DriverSelect
                    label="Sprint Winner"
                    value={picks?.sprintWinner ?? null}
                    isSaved={savedField === "sprintWinner"}
                    disabled={isSprintLocked}
                    onPick={(v) => pick("sprintWinner", v)}
                    points={PICK_POINTS.sprintWinner}
                    resultStatus={pickResult("sprintWinner")?.status}
                    pointsEarned={pickResult("sprintWinner")?.pts}
                  />
                  <DriverSelect
                    label="P2"
                    value={picks?.sprintP2 ?? null}
                    isSaved={savedField === "sprintP2"}
                    disabled={isSprintLocked}
                    onPick={(v) => pick("sprintP2", v)}
                    points={PICK_POINTS.sprintP2}
                    resultStatus={pickResult("sprintP2")?.status}
                    pointsEarned={pickResult("sprintP2")?.pts}
                  />
                  <DriverSelect
                    label="P3"
                    value={picks?.sprintP3 ?? null}
                    isSaved={savedField === "sprintP3"}
                    disabled={isSprintLocked}
                    onPick={(v) => pick("sprintP3", v)}
                    points={PICK_POINTS.sprintP3}
                    resultStatus={pickResult("sprintP3")?.status}
                    pointsEarned={pickResult("sprintP3")?.pts}
                  />
                </div>
              </div>
            )}

            {/* ── Qualifying ── */}
            <div className="rounded-xl p-4" style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: "var(--team-accent)" }} />
                <h2 className="text-sm font-bold uppercase tracking-widest shrink-0" style={{ color: "var(--foreground)" }}>
                  Qualifying
                </h2>
                <span className="text-[10px] font-semibold shrink-0" style={{ color: "var(--muted)" }}>8 / 5 / 3 pts · +2 partial</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenInfo(openInfo === "qual" ? null : "qual"); }}
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: openInfo === "qual" ? (isMiami ? "rgba(255,0,144,0.15)" : "rgba(225,6,0,0.15)") : "rgba(255,255,255,0.08)",
                    border: openInfo === "qual" ? (isMiami ? "1px solid rgba(255,0,144,0.4)" : "1px solid rgba(225,6,0,0.4)") : "1px solid rgba(255,255,255,0.14)",
                    color: openInfo === "qual" ? (isMiami ? "#FF0090" : "var(--f1-red)") : "var(--muted)",
                    fontSize: "10px", fontWeight: 700, cursor: "pointer",
                  }}
                  aria-label="Qualifying scoring info"
                >?</button>
              </div>
              <div className="flex flex-col gap-2">
                <DriverSelect
                  label="Pole Position"
                  value={picks?.qualPole ?? null}
                  isSaved={savedField === "qualPole"}
                  disabled={isQualLocked}
                  onPick={(v) => pick("qualPole", v)}
                  points={PICK_POINTS.qualPole}
                  resultStatus={pickResult("qualPole")?.status}
                  pointsEarned={pickResult("qualPole")?.pts}
                />
                <DriverSelect
                  label="P2"
                  value={picks?.qualP2 ?? null}
                  isSaved={savedField === "qualP2"}
                  disabled={isQualLocked}
                  onPick={(v) => pick("qualP2", v)}
                  points={PICK_POINTS.qualP2}
                  resultStatus={pickResult("qualP2")?.status}
                  pointsEarned={pickResult("qualP2")?.pts}
                />
                <DriverSelect
                  label="P3"
                  value={picks?.qualP3 ?? null}
                  isSaved={savedField === "qualP3"}
                  disabled={isQualLocked}
                  onPick={(v) => pick("qualP3", v)}
                  points={PICK_POINTS.qualP3}
                  resultStatus={pickResult("qualP3")?.status}
                  pointsEarned={pickResult("qualP3")?.pts}
                />
              </div>
            </div>

            {/* ── Race ── */}
            <div className="rounded-xl p-4" style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-block w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: "var(--team-accent)" }} />
                <h2 className="text-sm font-bold uppercase tracking-widest shrink-0" style={{ color: "var(--foreground)" }}>
                  Race
                </h2>
                <span className="text-[10px] font-semibold shrink-0" style={{ color: "var(--muted)" }}>25/18/15/12/10/8 pts · +5 partial</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenInfo(openInfo === "race" ? null : "race"); }}
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: openInfo === "race" ? (isMiami ? "rgba(255,0,144,0.15)" : "rgba(225,6,0,0.15)") : "rgba(255,255,255,0.08)",
                    border: openInfo === "race" ? (isMiami ? "1px solid rgba(255,0,144,0.4)" : "1px solid rgba(225,6,0,0.4)") : "1px solid rgba(255,255,255,0.14)",
                    color: openInfo === "race" ? (isMiami ? "#FF0090" : "var(--f1-red)") : "var(--muted)",
                    fontSize: "10px", fontWeight: 700, cursor: "pointer",
                  }}
                  aria-label="Race scoring info"
                >?</button>
              </div>

              {/* Booster counter */}
              <div className="flex items-center gap-1.5 mb-4">
                {[0].map((i) => (
                  <span
                    key={i}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: i < totalBoostersUsed ? "rgba(255,200,0,0.18)" : "rgba(255,255,255,0.06)",
                      color: i < totalBoostersUsed ? "#ffc800" : "rgba(255,255,255,0.25)",
                      border: i < totalBoostersUsed ? "1px solid rgba(255,200,0,0.4)" : "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    ⚡
                  </span>
                ))}
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {boostersRemaining} booster{boostersRemaining !== 1 ? "s" : ""} left
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <DriverSelect
                  label="Race Winner"
                  value={picks?.raceWinner ?? null}
                  isSaved={savedField === "raceWinner"}
                  disabled={isRaceLocked}
                  onPick={(v) => pick("raceWinner", v)}
                  points={PICK_POINTS.raceWinner}
                  resultStatus={pickResult("raceWinner")?.status}
                  pointsEarned={pickResult("raceWinner")?.pts}
                  boosted={boostedPicks.includes("raceWinner")}
                  boostAvailable={boostersRemaining > 0}
                  onBoost={() => handleBoostRacePick("raceWinner")}
                />
                <DriverSelect
                  label="P2"
                  value={picks?.raceP2 ?? null}
                  isSaved={savedField === "raceP2"}
                  disabled={isRaceLocked}
                  onPick={(v) => pick("raceP2", v)}
                  points={PICK_POINTS.raceP2}
                  resultStatus={pickResult("raceP2")?.status}
                  pointsEarned={pickResult("raceP2")?.pts}
                  boosted={boostedPicks.includes("raceP2")}
                  boostAvailable={boostersRemaining > 0}
                  onBoost={() => handleBoostRacePick("raceP2")}
                />
                <DriverSelect
                  label="P3"
                  value={picks?.raceP3 ?? null}
                  isSaved={savedField === "raceP3"}
                  disabled={isRaceLocked}
                  onPick={(v) => pick("raceP3", v)}
                  points={PICK_POINTS.raceP3}
                  resultStatus={pickResult("raceP3")?.status}
                  pointsEarned={pickResult("raceP3")?.pts}
                  boosted={boostedPicks.includes("raceP3")}
                  boostAvailable={boostersRemaining > 0}
                  onBoost={() => handleBoostRacePick("raceP3")}
                />
                <DriverSelect
                  label="P4"
                  value={picks?.raceP4 ?? null}
                  isSaved={savedField === "raceP4"}
                  disabled={isRaceLocked}
                  onPick={(v) => pick("raceP4", v)}
                  points={PICK_POINTS.raceP4}
                  resultStatus={pickResult("raceP4")?.status}
                  pointsEarned={pickResult("raceP4")?.pts}
                  boosted={boostedPicks.includes("raceP4")}
                  boostAvailable={boostersRemaining > 0}
                  onBoost={() => handleBoostRacePick("raceP4")}
                />
                <DriverSelect
                  label="P5"
                  value={picks?.raceP5 ?? null}
                  isSaved={savedField === "raceP5"}
                  disabled={isRaceLocked}
                  onPick={(v) => pick("raceP5", v)}
                  points={PICK_POINTS.raceP5}
                  resultStatus={pickResult("raceP5")?.status}
                  pointsEarned={pickResult("raceP5")?.pts}
                  boosted={boostedPicks.includes("raceP5")}
                  boostAvailable={boostersRemaining > 0}
                  onBoost={() => handleBoostRacePick("raceP5")}
                />
                <DriverSelect
                  label="P6"
                  value={picks?.raceP6 ?? null}
                  isSaved={savedField === "raceP6"}
                  disabled={isRaceLocked}
                  onPick={(v) => pick("raceP6", v)}
                  points={PICK_POINTS.raceP6}
                  resultStatus={pickResult("raceP6")?.status}
                  pointsEarned={pickResult("raceP6")?.pts}
                  boosted={boostedPicks.includes("raceP6")}
                  boostAvailable={boostersRemaining > 0}
                  onBoost={() => handleBoostRacePick("raceP6")}
                />
                <DriverSelect
                  label="Fastest Lap"
                  value={picks?.fastestLap ?? null}
                  isSaved={savedField === "fastestLap"}
                  disabled={isRaceLocked}
                  onPick={(v) => pick("fastestLap", v)}
                  points={PICK_POINTS.fastestLap}
                  resultStatus={pickResult("fastestLap")?.status}
                  pointsEarned={pickResult("fastestLap")?.pts}
                  boosted={boostedPicks.includes("fastestLap")}
                  boostAvailable={boostersRemaining > 0}
                  onBoost={() => handleBoostRacePick("fastestLap")}
                />

                {/* Safety Car — inline row matching DriverSelect style */}
                {(() => {
                  const scResult = pickResult("safetyCar");
                  const scBoosted = boostedPicks.includes("safetyCar");
                  const scBorderLeft = scResult?.status === "correct"
                    ? "3px solid rgba(34,197,94,0.8)"
                    : scResult?.status === "wrong"
                    ? "3px solid rgba(239,68,68,0.6)"
                    : picks?.safetyCar === true ? "3px solid rgba(34,197,94,0.7)" : "2px solid rgba(225,6,0,0.45)";
                  return (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: "rgb(12, 8, 10)",
                    backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 10px)",
                    border: "1px solid rgba(225,6,0,0.2)",
                    borderLeft: scBorderLeft,
                  }}
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-4" style={{ minHeight: "56px" }}>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Safety Car
                        </span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-px rounded-full"
                          style={{
                            backgroundColor: scBoosted ? "rgba(255,200,0,0.22)" : "rgba(255,200,0,0.12)",
                            color: "#ffc800",
                            border: `1px solid ${scBoosted ? "rgba(255,200,0,0.7)" : "rgba(255,200,0,0.3)"}`,
                            lineHeight: 1.4,
                          }}
                        >
                          {scBoosted ? `${PICK_POINTS.safetyCar * 2} pts ⚡` : `${PICK_POINTS.safetyCar} pts`}
                        </span>
                        {!isRaceLocked && (
                          <button
                            onClick={() => handleBoostRacePick("safetyCar")}
                            className="text-[10px] font-bold px-1.5 py-px rounded-full transition-colors"
                            style={{
                              backgroundColor: scBoosted ? "rgba(255,200,0,0.18)" : boostersRemaining > 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                              color: scBoosted ? "#ffc800" : boostersRemaining > 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
                              border: scBoosted ? "1px solid rgba(255,200,0,0.5)" : "1px solid rgba(255,255,255,0.12)",
                              cursor: scBoosted || boostersRemaining > 0 ? "pointer" : "default",
                              lineHeight: 1.4,
                            }}
                          >
                            {scBoosted ? "⚡ Boosted" : "⚡ Boost"}
                          </button>
                        )}
                      </div>
                      <span className="text-sm leading-tight" style={{
                        color: savedField === "safetyCar"
                          ? "var(--f1-red)"
                          : picks?.safetyCar === true
                          ? "#22c55e"
                          : "var(--muted)",
                      }}>
                        {savedField === "safetyCar" ? "Saved ✓" : picks?.safetyCar === true ? "Yes" : picks?.safetyCar === false ? "No" : "Make your prediction"}
                      </span>
                    </div>
                    {isRaceLocked ? (
                      scResult ? (
                        <span
                          className="shrink-0 text-xs font-black"
                          style={{
                            color: scResult.status === "correct" ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {scResult.status === "correct" ? `✓ +${scResult.pts}` : "✗"}
                        </span>
                      ) : (
                        <span className="shrink-0 text-sm" style={{ color: "var(--muted)" }}>🔒</span>
                      )
                    ) : (
                      <div className="flex gap-2 shrink-0">
                        {([true, false] as const).map((option) => {
                          const isSelected = picks?.safetyCar === option;
                          const isYes = option === true;
                          return (
                            <button
                              key={String(option)}
                              onClick={() => pick("safetyCar", isSelected ? null : option)}
                              className="rounded-lg text-xs font-bold transition-colors"
                              style={{
                                backgroundColor: isSelected
                                  ? isYes ? "rgba(34,197,94,0.2)" : "rgba(225,6,0,0.2)"
                                  : "rgba(255,255,255,0.06)",
                                border: isSelected
                                  ? `1px solid ${isYes ? "rgba(34,197,94,0.6)" : "var(--f1-red)"}`
                                  : "1px solid rgba(255,255,255,0.12)",
                                color: isSelected
                                  ? isYes ? "#22c55e" : "var(--f1-red)"
                                  : "var(--muted)",
                                minWidth: "44px",
                                minHeight: "34px",
                                padding: "0 12px",
                              }}
                            >
                              {option ? "Yes" : "No"}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                  );
                })()}
              </div>
            </div>

            {/* ── Wild Cards ── */}
            {wildcards.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ border: "1px solid rgba(150,100,255,0.25)", backgroundColor: "rgba(150,100,255,0.04)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-block w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: "#9664ff" }} />
                  <h2 className="text-sm font-bold uppercase tracking-widest shrink-0" style={{ color: "var(--foreground)" }}>
                    Wild Cards
                  </h2>
                  <span className="text-[10px] font-semibold shrink-0" style={{ color: "rgba(150,100,255,0.65)" }}>
                    pts vary · ⚡ boostable
                  </span>
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(150,100,255,0.2)" }} />
                  {isRaceLocked && (
                    <span
                      className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--muted)", border: "1px solid var(--border)" }}
                    >
                      🔒 Locked
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {wildcards.map((wc) => {
                    const myPick = wildcardPicks.find((p) => p.wildcardId === wc.id);
                    const isSaved = wcSavedId === wc.id;
                    const isBattle = wc.questionType === "battle";
                    const hasResult = wc.correctAnswer !== null && myPick !== undefined;
                    const isCorrect = hasResult && myPick!.pickValue === wc.correctAnswer;
                    const isWrong = hasResult && myPick!.pickValue !== wc.correctAnswer;
                    const ptsEarned = isCorrect ? wc.points * (myPick!.boosted ? 2 : 1) : 0;
                    const resultBorderLeft = isCorrect
                      ? "3px solid rgba(34,197,94,0.8)"
                      : isWrong
                      ? "3px solid rgba(239,68,68,0.6)"
                      : null;

                    if (wc.questionType === "driver") {
                      return (
                        <div key={wc.id}>
                          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(150,100,255,0.7)" }}>
                            {wc.question}
                          </p>
                          <DriverSelect
                            label={`Wild Card · ${wc.points} pts`}
                            value={myPick?.pickValue ?? null}
                            isSaved={isSaved}
                            disabled={isRaceLocked}
                            onPick={(val) => handleWildcardPick(wc.id, val)}
                            points={wc.points}
                            resultStatus={isCorrect ? "correct" : isWrong ? "wrong" : undefined}
                            pointsEarned={ptsEarned}
                            boosted={myPick?.boosted}
                            boostAvailable={boostersRemaining > 0}
                            onBoost={() => handleWildcardBoost(wc.id)}
                          />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={wc.id}
                        className="rounded-xl overflow-hidden"
                        style={{
                          backgroundColor: "rgb(12, 8, 10)",
                          border: "1px solid rgba(150,100,255,0.2)",
                          borderLeft: resultBorderLeft ?? (myPick ? "3px solid rgba(150,100,255,0.5)" : "2px solid rgba(150,100,255,0.2)"),
                        }}
                      >
                        <div className="px-4 py-4">
                          {/* pts badge + boost + result */}
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                                Wild Card
                              </span>
                              <span
                                className="text-[10px] font-bold px-1.5 py-px rounded-full"
                                style={{
                                  backgroundColor: myPick?.boosted ? "rgba(255,200,0,0.22)" : "rgba(255,200,0,0.12)",
                                  color: "#ffc800",
                                  border: `1px solid ${myPick?.boosted ? "rgba(255,200,0,0.7)" : "rgba(255,200,0,0.3)"}`,
                                  lineHeight: 1.4,
                                }}
                              >
                                {myPick?.boosted ? `${wc.points * 2} pts ⚡` : `${wc.points} pts`}
                              </span>
                              {!isBattle && !isRaceLocked && myPick && (
                                <button
                                  onClick={() => handleWildcardBoost(wc.id)}
                                  className="text-[10px] font-bold px-1.5 py-px rounded-full transition-colors"
                                  style={{
                                    backgroundColor: myPick.boosted ? "rgba(255,200,0,0.18)" : boostersRemaining > 0 ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                                    color: myPick.boosted ? "#ffc800" : boostersRemaining > 0 ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
                                    border: myPick.boosted ? "1px solid rgba(255,200,0,0.5)" : "1px solid rgba(255,255,255,0.12)",
                                    cursor: myPick.boosted || boostersRemaining > 0 ? "pointer" : "default",
                                    lineHeight: 1.4,
                                  }}
                                  title={myPick.boosted ? "Remove booster" : boostersRemaining > 0 ? "Apply booster (2×)" : "No boosters left"}
                                >
                                  {myPick.boosted ? "⚡ Boosted" : "⚡ Boost"}
                                </button>
                              )}
                            </div>
                            {isRaceLocked && (isCorrect || isWrong) ? (
                              <span
                                className="shrink-0 text-xs font-black"
                                style={{ color: isCorrect ? "#22c55e" : "#ef4444" }}
                              >
                                {isCorrect ? `✓ +${ptsEarned}` : "✗"}
                              </span>
                            ) : isRaceLocked ? (
                              <span className="shrink-0 text-sm" style={{ color: "var(--muted)" }}>🔒</span>
                            ) : null}
                          </div>

                          {/* Question */}
                          <p className="text-sm font-medium leading-snug mb-1.5" style={{ color: "var(--foreground)" }}>
                            {wc.question}
                          </p>

                          {/* Current pick display */}
                          <span
                            className="text-sm leading-tight"
                            style={{
                              color: isSaved
                                ? "var(--f1-red)"
                                : myPick
                                ? "rgba(150,100,255,0.9)"
                                : "var(--muted)",
                            }}
                          >
                            {isSaved ? "Saved ✓" : myPick ? wcDisplayName(wc, myPick.pickValue) : "Make your pick"}
                          </span>

                          {/* Pick input — only when unlocked */}
                          {!isRaceLocked && (
                            <div className="mt-3">
                              {wc.questionType === "boolean" && (
                                <div className="flex gap-2">
                                  {(["yes", "no"] as const).map((val) => {
                                    const isSelected = myPick?.pickValue === val;
                                    return (
                                      <button
                                        key={val}
                                        onClick={() => handleWildcardPick(wc.id, isSelected ? null : val)}
                                        className="rounded-lg text-xs font-bold transition-colors"
                                        style={{
                                          backgroundColor: isSelected
                                            ? val === "yes" ? "rgba(34,197,94,0.2)" : "rgba(225,6,0,0.2)"
                                            : "rgba(255,255,255,0.06)",
                                          border: isSelected
                                            ? `1px solid ${val === "yes" ? "rgba(34,197,94,0.6)" : "var(--f1-red)"}`
                                            : "1px solid rgba(255,255,255,0.12)",
                                          color: isSelected
                                            ? val === "yes" ? "#22c55e" : "var(--f1-red)"
                                            : "var(--muted)",
                                          minWidth: "60px",
                                          minHeight: "36px",
                                          padding: "0 16px",
                                        }}
                                      >
                                        {val === "yes" ? "Yes" : "No"}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                              {(wc.questionType === "battle" || wc.questionType === "constructor") && wc.options && (
                                <div className="flex gap-2 flex-wrap">
                                  {wc.options.map((opt) => {
                                    const isSelected = myPick?.pickValue === opt.id;
                                    return (
                                      <button
                                        key={opt.id}
                                        onClick={() => handleWildcardPick(wc.id, isSelected ? null : opt.id)}
                                        className="rounded-lg text-sm font-semibold transition-colors"
                                        style={{
                                          backgroundColor: isSelected ? "rgba(150,100,255,0.2)" : "rgba(255,255,255,0.06)",
                                          border: isSelected ? "1px solid rgba(150,100,255,0.6)" : "1px solid rgba(255,255,255,0.12)",
                                          color: isSelected ? "#9664ff" : "var(--muted)",
                                          minHeight: "40px",
                                          padding: "0 16px",
                                        }}
                                      >
                                        {opt.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
        </div>{/* end main column */}
      </div>{/* end two-column flex */}

      {/* ── Scoring info bottom sheet ── */}
      {openInfo && (
        <>
          <div
            className="fixed inset-0 z-[99]"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }}
            onClick={() => setOpenInfo(null)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-[100] rounded-t-2xl md:bottom-auto md:top-1/2 md:left-1/2 md:right-auto md:w-96 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
            style={{
              backgroundColor: "#13131f",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex justify-center pt-3 pb-2 md:hidden">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.18)" }} />
            </div>
            <div className="px-6 pt-2 pb-14 md:py-6">
              <div className="flex items-center justify-between mb-5">
                <h3
                  className="text-sm font-bold uppercase tracking-widest"
                  style={{ color: "var(--foreground)", fontFamily: "var(--font-orbitron)" }}
                >
                  {SECTION_INFO[openInfo].title}
                </h3>
                <button
                  onClick={() => setOpenInfo(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "var(--muted)", border: "1px solid rgba(255,255,255,0.1)" }}
                >✕</button>
              </div>
              <div className="flex flex-col">
                {SECTION_INFO[openInfo].rows.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 py-3"
                    style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                  >
                    <span className="text-sm" style={{ color: row.note ? "var(--muted)" : "var(--foreground)" }}>
                      {row.label}
                    </span>
                    {row.pts && (
                      <span className="text-sm font-bold shrink-0" style={{ color: "var(--f1-red)" }}>
                        {row.pts}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </div>
  );
}
