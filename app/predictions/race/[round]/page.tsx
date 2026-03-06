"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { RACES, formatRaceDate, flagToCC } from "@/lib/data";
import { RACE_FACTS } from "@/lib/raceFacts";
import type { RaceFact, RaceSession } from "@/lib/raceFacts";
import { useRacePick } from "@/hooks/useRacePick";
import DriverSelect from "@/components/DriverSelect";
import type { RacePick, RaceResult, ScoreBreakdown } from "@/lib/types";
import { PICK_POINTS, scoreRound } from "@/lib/scoring";
import { loadRaceResult } from "@/lib/resultsStorage";
import { createClient } from "@/lib/supabase/client";

function CountdownCard({ targetUtc, label, target }: { targetUtc: string; label: string; target: string }) {
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
  const days    = Math.floor(timeLeft / 86_400_000);
  const hours   = Math.floor((timeLeft % 86_400_000) / 3_600_000);
  const minutes = Math.floor((timeLeft % 3_600_000) / 60_000);
  const seconds = Math.floor((timeLeft % 60_000) / 1_000);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="rounded-xl overflow-hidden mb-6"
      style={{
        border: "1px solid rgba(225,6,0,0.35)",
        background: "linear-gradient(135deg, rgba(225,6,0,0.10) 0%, rgba(30,6,6,0.7) 100%)",
        boxShadow: "0 0 24px rgba(225,6,0,0.10)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(225,6,0,0.2)" }}>
        <span className="inline-block h-px w-4 rounded-full" style={{ backgroundColor: "var(--f1-red)" }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
          {label}
        </span>
      </div>

      <div className="px-4 py-4">
        {expired ? (
          <p className="text-center font-bold text-lg" style={{ color: "var(--f1-red)" }}>
            Race weekend is underway! 🏁
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
                    style={{ color: "var(--f1-red)" }}
                  >
                    {unit}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center text-xs font-semibold mt-3" style={{ color: "var(--f1-red)" }}>
              Until {target}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SessionCard({ sessions, timezoneOffset }: { sessions: RaceSession[]; timezoneOffset: number }) {
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
          const local = new Date(new Date(session.utc).getTime() + timezoneOffset * 3_600_000);
          const isPast = new Date(session.utc).getTime() < now;
          const isNext = i === nextIdx;
          const day  = local.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
          const date = local.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
          const time = local.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });

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
  const [open, setOpen] = useState(false);

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
      { label: "Fastest Lap", pts: "5 pts" },
      { label: "Safety Car deployed", pts: "5 pts" },
      { label: "Exact match only — no partial credit", note: true },
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
      { label: "Exact match only — no partial credit", note: true },
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
  const race = RACES.find((r) => r.r === round);
  const { user, timezoneOffset } = useAuth();
  const { picks, setPick, savedField, loading } = useRacePick(user?.id, round);

  const [now, setNow] = useState(Date.now());
  const [openInfo, setOpenInfo] = useState<string | null>(null);
  const [result, setResult] = useState<RaceResult | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    loadRaceResult(round, supabase).then(setResult);
  }, [round]);

  const breakdown: ScoreBreakdown | null =
    picks && result && user ? scoreRound(user.id, picks, result).breakdown : null;

  function pickResult(field: keyof ScoreBreakdown): { status: "correct" | "partial" | "wrong"; pts: number } | undefined {
    if (!result || !picks || !breakdown) return undefined;
    const resultVal = result[field as keyof RaceResult] as string | boolean | null | undefined;
    const pickVal = picks[field as keyof RacePick] as string | boolean | null | undefined;
    if (resultVal === null || resultVal === undefined) return undefined;
    if (pickVal === null || pickVal === undefined) return undefined;
    const pts = breakdown[field];
    if (pts === PICK_POINTS[field]) return { status: "correct", pts };
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

  function pick(field: keyof RacePick, value: string | boolean | null) {
    const locked = QUAL_FIELDS.includes(field)        ? isQualLocked
                 : SPRINT_QUAL_FIELDS.includes(field)  ? isSprintQualLocked
                 : SPRINT_FIELDS.includes(field)        ? isSprintLocked
                 : isRaceLocked;
    if (!locked) setPick(field, value);
  }

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto pb-28 md:pb-6">

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
              background:
                "linear-gradient(to bottom, rgba(8,8,16,0.25) 0%, rgba(8,8,16,0.0) 30%, rgba(8,8,16,0.75) 68%, rgba(8,8,16,1.0) 100%)",
            }}
          />
          {/* Race info pinned to bottom-left */}
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                Round {race.r} · {formatRaceDate(race, timezoneOffset)}
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
              Round {race.r} · {formatRaceDate(race, timezoneOffset)}
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

      {/* ── Content ── */}
      <div className="px-4">

        {/* Race weekend countdown */}
        {race.weekendStartUtc && (
          <CountdownCard
            targetUtc={race.weekendStartUtc}
            label="Race Weekend Countdown"
            target="Practice 1"
          />
        )}

        {/* Weekend schedule card */}
        {raceData?.sessions && <SessionCard sessions={raceData.sessions} timezoneOffset={timezoneOffset} />}

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
                      backgroundColor: openInfo === "sprintQual" ? "rgba(225,6,0,0.15)" : "rgba(255,255,255,0.08)",
                      border: openInfo === "sprintQual" ? "1px solid rgba(225,6,0,0.4)" : "1px solid rgba(255,255,255,0.14)",
                      color: openInfo === "sprintQual" ? "var(--f1-red)" : "var(--muted)",
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
                    backgroundColor: openInfo === "qual" ? "rgba(225,6,0,0.15)" : "rgba(255,255,255,0.08)",
                    border: openInfo === "qual" ? "1px solid rgba(225,6,0,0.4)" : "1px solid rgba(255,255,255,0.14)",
                    color: openInfo === "qual" ? "var(--f1-red)" : "var(--muted)",
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
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: "var(--team-accent)" }} />
                <h2 className="text-sm font-bold uppercase tracking-widest shrink-0" style={{ color: "var(--foreground)" }}>
                  Race
                </h2>
                <span className="text-[10px] font-semibold shrink-0" style={{ color: "var(--muted)" }}>25 / 18 / 15 pts</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenInfo(openInfo === "race" ? null : "race"); }}
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: openInfo === "race" ? "rgba(225,6,0,0.15)" : "rgba(255,255,255,0.08)",
                    border: openInfo === "race" ? "1px solid rgba(225,6,0,0.4)" : "1px solid rgba(255,255,255,0.14)",
                    color: openInfo === "race" ? "var(--f1-red)" : "var(--muted)",
                    fontSize: "10px", fontWeight: 700, cursor: "pointer",
                  }}
                  aria-label="Race scoring info"
                >?</button>
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
                />

                {/* Safety Car — inline row matching DriverSelect style */}
                {(() => {
                  const scResult = pickResult("safetyCar");
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Safety Car
                        </span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-px rounded-full"
                          style={{
                            backgroundColor: "rgba(255,200,0,0.12)",
                            color: "#ffc800",
                            border: "1px solid rgba(255,200,0,0.3)",
                            lineHeight: 1.4,
                          }}
                        >
                          {PICK_POINTS.safetyCar} pts
                        </span>
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

          </div>
        )}
      </div>

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
  );
}
