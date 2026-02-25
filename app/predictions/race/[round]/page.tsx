"use client";

import { use, useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { RACES, formatRaceDate, flagToCC } from "@/lib/data";
import { RACE_FACTS } from "@/lib/raceFacts";
import type { RaceFact, RaceSession } from "@/lib/raceFacts";
import { useRacePick } from "@/hooks/useRacePick";
import DriverSelect from "@/components/DriverSelect";
import type { RacePick } from "@/lib/types";

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

  if (!race) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <p style={{ color: "var(--muted)" }}>Race not found.</p>
      </div>
    );
  }

  const isLocked = new Date(race.startUtc).getTime() < Date.now();
  const raceData = RACE_FACTS[round];
  const heroImage = raceData?.heroImage;
  const trackImage = raceData?.trackImage;

  function pick(field: keyof RacePick, value: string | boolean | null) {
    if (!isLocked) setPick(field, value);
  }

  return (
    <div className="max-w-lg mx-auto pb-8">

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
              {isLocked && (
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
            {isLocked && (
              <span
                className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--muted)", border: "1px solid var(--border)" }}
              >
                🔒 Locked
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

        {isLocked && (
          <div
            className="mb-6 rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            Predictions for this race are locked — the race weekend has passed.
          </div>
        )}

        {loading ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
        ) : (
          <div className="flex flex-col gap-6">

            {/* ── Qualifying ── */}
            <div className="rounded-xl p-4" style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: "var(--team-accent)" }} />
                <h2 className="text-sm font-bold uppercase tracking-widest shrink-0" style={{ color: "var(--foreground)" }}>
                  Qualifying
                </h2>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
              </div>
              <div className="flex flex-col gap-2">
                <DriverSelect
                  label="Pole Position"
                  value={picks?.qualPole ?? null}
                  isSaved={savedField === "qualPole"}
                  disabled={isLocked}
                  onPick={(v) => pick("qualPole", v)}
                />
                <DriverSelect
                  label="P2"
                  value={picks?.qualP2 ?? null}
                  isSaved={savedField === "qualP2"}
                  disabled={isLocked}
                  onPick={(v) => pick("qualP2", v)}
                />
                <DriverSelect
                  label="P3"
                  value={picks?.qualP3 ?? null}
                  isSaved={savedField === "qualP3"}
                  disabled={isLocked}
                  onPick={(v) => pick("qualP3", v)}
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
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
              </div>
              <div className="flex flex-col gap-2">
                <DriverSelect
                  label="Race Winner"
                  value={picks?.raceWinner ?? null}
                  isSaved={savedField === "raceWinner"}
                  disabled={isLocked}
                  onPick={(v) => pick("raceWinner", v)}
                />
                <DriverSelect
                  label="P2"
                  value={picks?.raceP2 ?? null}
                  isSaved={savedField === "raceP2"}
                  disabled={isLocked}
                  onPick={(v) => pick("raceP2", v)}
                />
                <DriverSelect
                  label="P3"
                  value={picks?.raceP3 ?? null}
                  isSaved={savedField === "raceP3"}
                  disabled={isLocked}
                  onPick={(v) => pick("raceP3", v)}
                />
                <DriverSelect
                  label="Fastest Lap"
                  value={picks?.fastestLap ?? null}
                  isSaved={savedField === "fastestLap"}
                  disabled={isLocked}
                  onPick={(v) => pick("fastestLap", v)}
                />
              </div>
            </div>

            {/* ── Safety Car ── */}
            <div className="rounded-xl p-4" style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-block w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: "var(--team-accent)" }} />
                <h2 className="text-sm font-bold uppercase tracking-widest shrink-0" style={{ color: "var(--foreground)" }}>
                  Safety Car
                </h2>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
              </div>
              <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
                Will there be a safety car deployment?
              </p>
              <div className="flex gap-3">
                {([true, false] as const).map((option) => {
                  const isSelected = picks?.safetyCar === option;
                  const isSaved = savedField === "safetyCar" && isSelected;
                  const isYes = option === true;
                  return (
                    <button
                      key={String(option)}
                      onClick={() => pick("safetyCar", isSelected ? null : option)}
                      disabled={isLocked}
                      className="flex-1 rounded-xl py-3 text-sm font-bold transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? isYes ? "rgba(34,197,94,0.15)" : "rgba(225,6,0,0.15)"
                          : "rgb(12, 8, 10)",
                        backgroundImage: isSelected
                          ? "none"
                          : "repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 10px)",
                        border: isSelected
                          ? `1px solid ${isYes ? "rgba(34,197,94,0.6)" : "var(--f1-red)"}`
                          : "1px solid rgba(225,6,0,0.35)",
                        color: isSelected
                          ? isYes ? "#22c55e" : "var(--f1-red)"
                          : "var(--muted)",
                        opacity: isLocked ? 0.5 : 1,
                        cursor: isLocked ? "default" : "pointer",
                      }}
                    >
                      {option ? "Yes" : "No"}
                      {isSaved ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
