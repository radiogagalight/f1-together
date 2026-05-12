"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { RACES, CONSTRUCTORS, DRIVERS, formatRaceDate, flagToCC } from "@/lib/data";
import { RACE_FACTS } from "@/lib/raceFacts";
import { hexToRgb, TEAM_COLORS } from "@/lib/teamColors";
import { DRIVER_IMAGES } from "@/lib/driverImages";
import PredictionsWidget from "@/components/PredictionsWidget";
import Companion from "@/components/Companion";
import { getDb } from "@/lib/firebase/db";
import { loadRaceResult } from "@/lib/resultsStorage";
import { loadRacePick } from "@/lib/raceStorage";
import { scoreRound } from "@/lib/scoring";
import type { RacePrediction, RaceResult, ScoreBreakdown } from "@/lib/types";

function WeekendResultsCard({
  result,
  pick,
  userId,
}: {
  result: RaceResult;
  pick: RacePrediction | null;
  userId: string;
}) {
  const round = result.round;
  const seenKey = `wrc-seen-r${round}`;

  const [open, setOpen] = useState(false);
  const [isFirstOpen, setIsFirstOpen] = useState(false);
  const [rowsVisible, setRowsVisible] = useState(false);
  const [displayedPoints, setDisplayedPoints] = useState(0);

  const hasRace = result.raceWinner !== null;
  const hasSprint = result.sprintWinner !== null || result.sprintQualPole !== null;

  const score = pick && userId ? scoreRound(userId, pick, result) : null;
  const totalPoints = score?.totalPoints ?? 0;
  const breakdown = score?.breakdown ?? null;

  // Perfect round: no pick that was made and had a result scored 0
  const isPerfect =
    totalPoints > 0 &&
    pick !== null &&
    breakdown !== null &&
    !(Object.keys(breakdown) as Array<keyof ScoreBreakdown>).some((key) => {
      const predictionVal = (pick as unknown as Record<string, unknown>)[key];
      const resultVal = (result as unknown as Record<string, unknown>)[key];
      return (
        predictionVal !== null && predictionVal !== undefined &&
        resultVal !== null && resultVal !== undefined &&
        breakdown[key] === 0
      );
    });

  // Auto-expand on first view (client only)
  useEffect(() => {
    if (!localStorage.getItem(seenKey)) {
      setIsFirstOpen(true);
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate on open
  useEffect(() => {
    if (!open) {
      setRowsVisible(false);
      setDisplayedPoints(0);
      return;
    }
    if (isFirstOpen) localStorage.setItem(seenKey, "1");
    const t = setTimeout(() => setRowsVisible(true), 80);
    if (totalPoints > 0) {
      const duration = 900;
      const fps = 50;
      const totalFrames = Math.round((duration / 1000) * fps);
      let frame = 0;
      const timer = setInterval(() => {
        frame++;
        const eased = 1 - Math.pow(1 - Math.min(frame / totalFrames, 1), 3);
        setDisplayedPoints(Math.round(eased * totalPoints));
        if (frame >= totalFrames) clearInterval(timer);
      }, 1000 / fps);
      return () => { clearInterval(timer); clearTimeout(t); };
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dn(id: string | null): string {
    if (!id) return "—";
    return DRIVERS.find((d) => d.id === id)?.name.split(" ").pop() ?? id;
  }

  const accent = isPerfect ? "rgba(255,215,0,1)" : "rgba(34,197,94,1)";
  const accentMuted = isPerfect ? "rgba(255,215,0,0.6)" : "rgba(34,197,94,0.6)";

  function driverRow(
    pos: string,
    id: string | null,
    pickId: string | null,
    bdKey: keyof ScoreBreakdown,
    rowIndex: number
  ) {
    const pts = breakdown?.[bdKey] ?? 0;
    const isCorrect = pts > 0;
    const hasPick = pickId !== null;
    return (
      <div
        key={bdKey}
        className="flex items-center gap-3 py-1"
        style={{
          opacity: rowsVisible ? 1 : 0,
          transform: rowsVisible ? "translateY(0)" : "translateY(6px)",
          transition: `opacity 0.3s ease ${rowIndex * 55}ms, transform 0.3s ease ${rowIndex * 55}ms`,
        }}
      >
        <span className="text-[10px] w-5 shrink-0 font-mono text-right" style={{ color: "var(--muted)" }}>{pos}</span>
        {id && DRIVER_IMAGES[id] && (
          <div className="relative w-12 h-12 shrink-0 overflow-hidden">
            <Image src={DRIVER_IMAGES[id]} alt={dn(id)} fill style={{ objectFit: "contain", objectPosition: "top" }} sizes="48px" />
          </div>
        )}
        <span
          className="text-sm font-bold flex-1"
          style={{
            color: isCorrect ? "rgba(34,197,94,1)" : id ? "rgba(255,255,255,0.85)" : "var(--muted)",
            textShadow: isCorrect
              ? isFirstOpen ? "0 0 14px rgba(34,197,94,0.9)" : "0 0 8px rgba(34,197,94,0.4)"
              : "none",
          }}
        >
          {dn(id)}
        </span>
        {hasPick ? (
          isCorrect ? (
            <>
              <span className="text-xs font-bold" style={{ color: "rgba(34,197,94,0.85)" }}>✓</span>
              <span className="text-xs font-bold w-9 text-right tabular-nums" style={{ color: "rgba(34,197,94,0.7)" }}>+{pts}</span>
            </>
          ) : (
            <>
              <span className="text-xs" style={{ color: "rgba(255,80,80,0.7)" }}>✗ {dn(pickId)}</span>
              <span className="text-xs w-9 text-right" style={{ color: "rgba(255,255,255,0.2)" }}>0</span>
            </>
          )
        ) : (
          <span className="text-xs w-9 text-right" style={{ color: "rgba(255,255,255,0.15)" }}>—</span>
        )}
      </div>
    );
  }

  function boolRow(
    label: string,
    resultVal: boolean | null,
    predictionVal: boolean | null,
    bdKey: keyof ScoreBreakdown,
    rowIndex: number
  ) {
    if (resultVal === null) return null;
    const pts = breakdown?.[bdKey] ?? 0;
    const isCorrect = pts > 0;
    const hasPick = predictionVal !== null;
    return (
      <div
        key={bdKey}
        className="flex items-center gap-3 py-1"
        style={{
          opacity: rowsVisible ? 1 : 0,
          transform: rowsVisible ? "translateY(0)" : "translateY(6px)",
          transition: `opacity 0.3s ease ${rowIndex * 55}ms, transform 0.3s ease ${rowIndex * 55}ms`,
        }}
      >
        <span className="text-[10px] w-5 shrink-0 font-mono text-right" style={{ color: "var(--muted)" }}>—</span>
        <span className="text-sm font-bold flex-1" style={{ color: isCorrect ? "rgba(34,197,94,1)" : "rgba(255,255,255,0.7)" }}>
          {label}: {resultVal ? "Yes" : "No"}
        </span>
        {hasPick ? (
          isCorrect ? (
            <>
              <span className="text-xs font-bold" style={{ color: "rgba(34,197,94,0.85)" }}>✓</span>
              <span className="text-xs font-bold w-9 text-right tabular-nums" style={{ color: "rgba(34,197,94,0.7)" }}>+{pts}</span>
            </>
          ) : (
            <>
              <span className="text-xs" style={{ color: "rgba(255,80,80,0.7)" }}>✗</span>
              <span className="text-xs w-9 text-right" style={{ color: "rgba(255,255,255,0.2)" }}>0</span>
            </>
          )
        ) : (
          <span className="text-xs w-9 text-right" style={{ color: "rgba(255,255,255,0.15)" }}>—</span>
        )}
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes wrc-bounce-in {
          0%   { transform: scale(0.97); opacity: 0.7; }
          60%  { transform: scale(1.015); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes wrc-gold-pulse {
          0%, 100% { box-shadow: 0 0 16px rgba(255,215,0,0.12); }
          50%       { box-shadow: 0 0 36px rgba(255,215,0,0.32); }
        }
      `}</style>
      <div
        className="rounded-xl overflow-hidden mt-3"
        style={{
          border: `1px solid ${isPerfect ? "rgba(255,215,0,0.4)" : "rgba(34,197,94,0.3)"}`,
          backgroundColor: isPerfect ? "rgba(255,215,0,0.04)" : "rgba(34,197,94,0.04)",
          animation: isPerfect && open ? "wrc-gold-pulse 2.5s ease-in-out infinite" : "none",
        }}
      >
        {/* Header */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3"
          style={{ borderBottom: open ? `1px solid ${isPerfect ? "rgba(255,215,0,0.15)" : "rgba(34,197,94,0.15)"}` : "none" }}
        >
          <div className="flex items-center gap-2">
            <span className="inline-block h-px w-4 rounded-full" style={{ backgroundColor: accent }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
              {hasRace ? "Race Results" : "Qualifying Results"}
            </span>
            {isPerfect && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,215,0,0.15)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)" }}
              >
                ⚡ Perfect
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {totalPoints > 0 && !open && (
              <span className="text-xs font-bold" style={{ color: accentMuted }}>+{totalPoints} pts</span>
            )}
            <span style={{ color: accentMuted, fontSize: "11px", fontWeight: 700 }}>
              {open ? "▲ Hide" : "▼ Show"}
            </span>
          </div>
        </button>

        {open && (
          <div
            className="px-4 py-3 flex flex-col gap-4"
            style={{ animation: isFirstOpen ? "wrc-bounce-in 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none" }}
          >
            {/* Points summary */}
            {pick && (
              <div
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{
                  backgroundColor: isPerfect ? "rgba(255,215,0,0.07)" : "rgba(34,197,94,0.07)",
                  border: `1px solid ${isPerfect ? "rgba(255,215,0,0.2)" : "rgba(34,197,94,0.15)"}`,
                }}
              >
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Your score this weekend
                  </p>
                  <p
                    className="font-black leading-none"
                    style={{
                      fontSize: "28px",
                      color: totalPoints > 0 ? accent : "rgba(255,255,255,0.3)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {displayedPoints}
                    <span className="text-sm font-bold ml-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>pts</span>
                  </p>
                </div>
                {isPerfect && <span style={{ fontSize: "28px", lineHeight: 1 }}>⚡</span>}
              </div>
            )}

            {/* Qualifying */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentMuted }}>Qualifying</p>
              {driverRow("P1", result.qualPole, pick?.qualPole ?? null, "qualPole", 0)}
              {driverRow("P2", result.qualP2,   pick?.qualP2   ?? null, "qualP2",   1)}
              {driverRow("P3", result.qualP3,   pick?.qualP3   ?? null, "qualP3",   2)}
            </div>

            {/* Race */}
            {hasRace && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentMuted }}>Race</p>
                {driverRow("P1", result.raceWinner, pick?.raceWinner ?? null, "raceWinner", 3)}
                {driverRow("P2", result.raceP2,     pick?.raceP2     ?? null, "raceP2",     4)}
                {driverRow("P3", result.raceP3,     pick?.raceP3     ?? null, "raceP3",     5)}
                {driverRow("FL", result.fastestLap, pick?.fastestLap ?? null, "fastestLap", 6)}
                {boolRow("Safety Car", result.safetyCar, pick?.safetyCar ?? null, "safetyCar", 7)}
              </div>
            )}

            {/* Sprint Qualifying */}
            {hasSprint && result.sprintQualPole !== null && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentMuted }}>Sprint Qualifying</p>
                {driverRow("P1", result.sprintQualPole, pick?.sprintQualPole ?? null, "sprintQualPole", 8)}
                {driverRow("P2", result.sprintQualP2,   pick?.sprintQualP2   ?? null, "sprintQualP2",   9)}
                {driverRow("P3", result.sprintQualP3,   pick?.sprintQualP3   ?? null, "sprintQualP3",   10)}
              </div>
            )}

            {/* Sprint Race */}
            {hasSprint && result.sprintWinner !== null && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accentMuted }}>Sprint Race</p>
                {driverRow("P1", result.sprintWinner, pick?.sprintWinner ?? null, "sprintWinner", 11)}
                {driverRow("P2", result.sprintP2,     pick?.sprintP2     ?? null, "sprintP2",     12)}
                {driverRow("P3", result.sprintP3,     pick?.sprintP3     ?? null, "sprintP3",     13)}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function NextRaceHero({
  race,
  predictions,
  lastRaceScore,
}: {
  race: (typeof RACES)[number];
  predictions: { pole: string | null; winner: string | null };
  lastRaceScore?: { raceName: string; totalPoints: number; flag: string } | null;
}) {
  const heroImage = RACE_FACTS[race.r]?.heroImage;

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Market favorite from Polymarket (undefined = loading, null = unavailable)
  const [marketFav, setMarketFav] = useState<{
    name: string; probability: number;
    runnerUp?: { name: string; probability: number };
    marketUrl: string;
  } | null | undefined>(undefined);
  useEffect(() => {
    const raceName = race.name.replace(" Grand Prix", "");
    fetch(`/api/market-favorite?race=${encodeURIComponent(raceName)}`)
      .then((r) => r.json())
      .then((d) => setMarketFav(d ?? null))
      .catch(() => setMarketFav(null));
  }, [race.r, race.name]);

  const weekendStarted = race.weekendStartUtc
    ? new Date(race.weekendStartUtc).getTime() <= now
    : false;
  const raceStarted = new Date(race.startUtc).getTime() <= now;
  const isLive = weekendStarted && !raceStarted;

  const sessions = [
    ...(race.sprintQualifyingUtc ? [{ short: "Sprint Q", label: "Sprint Qualifying", utc: race.sprintQualifyingUtc }] : []),
    ...(race.sprintStartUtc      ? [{ short: "Sprint",   label: "Sprint Race",       utc: race.sprintStartUtc      }] : []),
    { short: "Quali",              label: "Qualifying",                                utc: race.qualifyingUtc },
    { short: "Race",               label: "Race",                                      utc: race.startUtc },
  ] as { short: string; label: string; utc: string }[];

  const nextSession = sessions.find(s => new Date(s.utc).getTime() > now);
  const targetMs = nextSession ? Math.max(0, new Date(nextSession.utc).getTime() - now) : 0;

  const days    = Math.floor(targetMs / 86_400_000);
  const hours   = Math.floor((targetMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((targetMs % 3_600_000) / 60_000);
  const seconds = Math.floor((targetMs % 60_000) / 1_000);
  const pad = (n: number) => String(n).padStart(2, "0");

  const under1h  = isLive && targetMs > 0 && targetMs <= 3_600_000;
  const under24h = isLive && targetMs > 0 && targetMs <= 86_400_000;
  const countdownColor = under1h ? "#e10600" : under24h ? "#f59e0b" : "#ffffff";

  const dayLabel = !nextSession ? null
    : nextSession.label === "Race"             ? "It's Race Day!"
    : nextSession.label === "Qualifying"       ? "It's Qualifying Day!"
    : nextSession.label === "Sprint Race"      ? "It's Sprint Day!"
    : "It's Sprint Qualifying!";

  const qualPassed = new Date(race.qualifyingUtc).getTime() <= now;
  const poleName   = !qualPassed && predictions.pole   ? (DRIVERS.find(d => d.id === predictions.pole)?.name   ?? null) : null;
  const winnerName = !raceStarted && predictions.winner ? (DRIVERS.find(d => d.id === predictions.winner)?.name ?? null) : null;
  const hasPredictions   = !!(poleName || winnerName);

  return (
    <div
      className="relative rounded-xl overflow-hidden min-h-[360px] md:min-h-[520px]"
      style={{
        border: isLive ? "1px solid rgba(225,6,0,0.55)" : "1px solid transparent",
        boxShadow: isLive ? "0 0 0 1px rgba(225,6,0,0.2), 0 0 40px rgba(225,6,0,0.3)" : "none",
      }}
    >
      {heroImage ? (
        <Image
          src={heroImage} alt="" fill
          style={{ objectFit: "cover", objectPosition: "center", opacity: isLive ? 0.65 : 0.45 }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(225,6,0,0.4) 0%, rgba(8,8,16,1) 70%)" }} />
      )}

      <div style={{
        position: "absolute", inset: 0,
        background: isLive
          ? "linear-gradient(to bottom, rgba(8,8,16,0.05) 0%, rgba(8,8,16,0.50) 45%, rgba(8,8,16,0.85) 100%)"
          : "linear-gradient(to bottom, rgba(8,8,16,0.15) 0%, rgba(8,8,16,0.85) 55%, rgba(8,8,16,0.98) 100%)",
      }} />

      {under1h && (
        <div className="absolute inset-0 animate-pulse" style={{ background: "rgba(225,6,0,0.07)", pointerEvents: "none", zIndex: 1 }} />
      )}

      <div className="relative z-10 flex flex-col min-h-[360px] md:min-h-[520px]" style={{ height: "100%" }}>
        {/* Scrolling live ticker banner */}
        {isLive && (
          <div style={{
            background: "rgba(0,0,0,0.35)",
            overflow: "hidden",
            padding: "13px 0",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
          }}>
            <div style={{
              display: "inline-flex",
              whiteSpace: "nowrap",
              animation: "ticker-scroll 18s linear infinite",
            }}>
              {[0, 1].map((i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "14px", fontWeight: 800,
                    letterSpacing: "0.14em", textTransform: "uppercase",
                    color: "#ffffff", fontFamily: "var(--font-orbitron)",
                    paddingRight: "80px",
                  }}
                >
                  {race.name} Race Weekend --{" "}
                  <span style={{ color: "#00e05a" }}>Live Now</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Padded content */}
        <div className="flex flex-col justify-between flex-1 p-4">
        {/* Top badges + chat button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
            >
              Round {race.r}
            </span>
            {race.sprint && (
              <span
                className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(255,200,0,0.12)", color: "#ffc800", border: "1px solid rgba(255,200,0,0.35)" }}
              >
                Sprint
              </span>
            )}
          </div>
        </div>

        {/* Bottom content */}
        <div>
          {/* RACE DAY headline — live only */}
          {isLive && dayLabel && (
            <p
              className="font-black leading-none mb-2"
              style={{
                fontFamily: "var(--font-orbitron)",
                fontSize: "clamp(20px, 5.5vw, 30px)",
                color: "#e10600",
                letterSpacing: "0.06em",
                textShadow: "0 0 24px rgba(225,6,0,0.7), 0 2px 12px rgba(0,0,0,0.9), 0 1px 3px #000, 0 0 6px #000",
              }}
            >
              {dayLabel}
            </p>
          )}

          <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {race.circuit}
          </p>
          <h2 className="font-black leading-none mb-3" style={{ fontFamily: "var(--font-orbitron)", textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}>
            <span className="block text-3xl" style={{ color: "#ffffff" }}>
              {race.name.replace(" Grand Prix", "")}
            </span>
            <span className="block text-lg" style={{ color: "rgba(255,255,255,0.5)" }}>
              Grand Prix
            </span>
          </h2>

          {/* Session timeline strip — live only */}
          {isLive && (
            <div className="flex items-start mb-3">
              {sessions.map((s, i) => {
                const sPast = new Date(s.utc).getTime() <= now;
                const sNext = s === nextSession;
                return (
                  <div key={s.label} className="flex items-start">
                    <div className="flex flex-col items-center gap-1">
                      <div style={{
                        width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
                        backgroundColor: sNext ? "#e10600" : sPast ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.35)",
                        boxShadow: sNext ? "0 0 8px 2px rgba(225,6,0,0.7)" : "none",
                      }} />
                      <span style={{
                        fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em",
                        textTransform: "uppercase", whiteSpace: "nowrap",
                        color: sNext ? "#e10600" : sPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)",
                        textShadow: sNext ? "0 1px 3px #000, 0 0 6px #000" : "none",
                      }}>
                        {s.short}
                      </span>
                    </div>
                    {i < sessions.length - 1 && (
                      <div style={{
                        width: "18px", height: "1px", flexShrink: 0, marginTop: "3px",
                        backgroundColor: sPast ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.2)",
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Countdown */}
          {raceStarted ? (
            <p className="text-sm font-bold mb-3" style={{ color: "var(--f1-red)" }}>Lights out! 🏁</p>
          ) : nextSession ? (
            <div className="mb-3">
              <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                {isLive ? `${nextSession.label} starts in` : `Until ${nextSession.label}`}
              </p>
              <div className="flex gap-4">
                {[
                  { v: days,    u: "Days" },
                  { v: hours,   u: "Hrs"  },
                  { v: minutes, u: "Mins" },
                  { v: seconds, u: "Secs" },
                ].map(({ v, u }) => (
                  <div key={u} className="flex flex-col">
                    <span
                      className={under1h ? "animate-pulse" : ""}
                      style={{
                        fontSize: "2rem", fontWeight: 900,
                        fontVariantNumeric: "tabular-nums", lineHeight: 1,
                        color: countdownColor,
                        textShadow: under24h ? `0 0 16px ${countdownColor}55` : "none",
                      }}
                    >
                      {u === "Days" ? v : pad(v)}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {u}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}


          {/* Market favorite */}
          {marketFav && (
            <a
              href={marketFav.marketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 flex flex-col gap-0.5 group"
              style={{ textDecoration: "none" }}
            >
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                Market Fav
              </p>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>
                {marketFav.name}{" "}
                <span style={{ color: "#22c55e", fontWeight: 700 }}>{marketFav.probability}%</span>
                {marketFav.runnerUp && (
                  <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>
                    {" "}· {marketFav.runnerUp.name} {marketFav.runnerUp.probability}%
                  </span>
                )}
              </p>
              <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>
                via Polymarket ↗
              </p>
            </a>
          )}

          {/* Pick preview */}
          {hasPredictions ? (
            <div className="mb-3 flex flex-col gap-0.5">
              <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                Your predictions
              </p>
              {poleName && (
                <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
                  Pole · {poleName}
                </p>
              )}
              {winnerName && (
                <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
                  Race · {winnerName}
                </p>
              )}
            </div>
          ) : (
            <p className="mb-3" style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>
              No predictions yet
            </p>
          )}

          <Link
            href={`/predictions/race/${race.r}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-lg font-bold"
            style={{ backgroundColor: "#00D4BE", color: "#0a0a12", boxShadow: "0 0 24px rgba(0,212,190,0.45)" }}
          >
            {hasPredictions ? "Edit predictions →" : "Make your predictions →"}
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 6;
const TOTAL_PAGES = Math.ceil(RACES.length / PAGE_SIZE);

function getNextRaceIndex() {
  const idx = RACES.findIndex(r => new Date(r.startUtc).getTime() > Date.now());
  return idx === -1 ? RACES.length - 1 : idx;
}

// ── Speed lines background ──────────────────────────────────────
const SPEED_LINES = [
  { top:  8, width: 68, dur: 4.2, delay: 0.0, opacity: 0.55, color: "#00D4BE", height: 3 },
  { top: 19, width: 48, dur: 5.2, delay: 1.4, opacity: 0.45, color: "#FF0090", height: 2 },
  { top: 31, width: 74, dur: 3.5, delay: 3.1, opacity: 0.52, color: "#00B4D8", height: 3 },
  { top: 44, width: 55, dur: 6.0, delay: 0.8, opacity: 0.42, color: "#FF0090", height: 2 },
  { top: 57, width: 72, dur: 4.0, delay: 2.5, opacity: 0.56, color: "#00D4BE", height: 3 },
  { top: 69, width: 42, dur: 4.8, delay: 1.9, opacity: 0.40, color: "#00B4D8", height: 2 },
  { top: 81, width: 62, dur: 4.4, delay: 4.3, opacity: 0.50, color: "#FF0090", height: 2 },
  { top: 91, width: 52, dur: 5.5, delay: 0.6, opacity: 0.44, color: "#00D4BE", height: 3 },
];


export default function HomePage() {
  const { user, authReady, displayName, teamAccent, timezoneName, favTeams } = useAuth();

  const nextRaceIdx = getNextRaceIndex();
  const [page, setPage] = useState(Math.floor(nextRaceIdx / PAGE_SIZE));

  // Fetch user's pole + winner predictions for the next race
  const [heroPredictions, setHeroPredictions] = useState<{ pole: string | null; winner: string | null }>({ pole: null, winner: null });
  useEffect(() => {
    if (!user) return;
    const db = getDb();
    loadRacePick(user.uid, RACES[nextRaceIdx].r, db).then((p) => {
      setHeroPredictions({ pole: p.qualPole, winner: p.raceWinner });
    });
  }, [user, nextRaceIdx]);

  // Fetch last race score
  const lastRaceIdx = nextRaceIdx > 0 ? nextRaceIdx - 1 : -1;
  const lastRace = lastRaceIdx >= 0 ? RACES[lastRaceIdx] : null;
  const [lastRaceScore, setLastRaceScore] = useState<{ raceName: string; totalPoints: number; flag: string } | null>(null);

  // Most recently qualified race (qualifying start time has passed)
  const qualifiedRaceIdx = (() => {
    const now = Date.now();
    let idx = -1;
    for (let i = 0; i < RACES.length; i++) {
      if (new Date(RACES[i].qualifyingUtc).getTime() <= now) idx = i;
      else break;
    }
    return idx;
  })();
  const [currentRaceResult, setCurrentRaceResult] = useState<RaceResult | null>(null);
  const [currentRacePick, setCurrentRacePick] = useState<RacePrediction | null>(null);
  useEffect(() => {
    if (qualifiedRaceIdx < 0) return;
    const db = getDb();
    const r = RACES[qualifiedRaceIdx].r;
    loadRaceResult(r, db).then(setCurrentRaceResult);
    if (user) {
      loadRacePick(user.uid, r, db).then(setCurrentRacePick);
    } else {
      setCurrentRacePick(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, qualifiedRaceIdx]);

  useEffect(() => {
    if (!user || !lastRace) return;
    const db = getDb();
    Promise.all([loadRacePick(user.uid, lastRace.r, db), loadRaceResult(lastRace.r, db)]).then(
      ([pick, result]) => {
        if (!result) return;
        const { totalPoints } = scoreRound(user.uid, pick, result);
        setLastRaceScore({ raceName: lastRace.name, totalPoints, flag: lastRace.flag });
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, lastRace?.r]);

  // ── Rotating favourite team greeting ──
  const activeTeams = favTeams.filter((t): t is string => t !== null);
  const [teamIdx, setTeamIdx] = useState(0);
  const [teamPhase, setTeamPhase] = useState<"visible" | "exiting" | "entering">("visible");

  useEffect(() => {
    if (activeTeams.length <= 1) return;
    const id = setInterval(() => {
      // 1. Fade out to the right
      setTeamPhase("exiting");
      setTimeout(() => {
        // 2. Swap name + instantly reposition to the left (no transition)
        setTeamIdx((i) => (i + 1) % activeTeams.length);
        setTeamPhase("entering");
        // 3. One frame later: slide in from the left
        setTimeout(() => setTeamPhase("visible"), 50);
      }, 600);
    }, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeams.length]);

  const currentTeamId   = activeTeams[teamIdx % Math.max(1, activeTeams.length)] ?? null;
  const currentTeamName = currentTeamId ? (CONSTRUCTORS.find((c) => c.id === currentTeamId)?.name ?? null) : null;
  const currentTeamColor = currentTeamId ? (TEAM_COLORS[currentTeamId] ?? null) : null;

  const pageRaces = RACES.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
    <div className="flex flex-col min-h-screen pb-28 md:pb-6" style={{ backgroundColor: "#1c1c2c" }}>
      {/* ── Speed lines background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {SPEED_LINES.map((line, i) => (
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

      {/* ── Header ── */}
      <header className="relative z-10 w-full px-6 md:pl-40 md:pr-10 pt-8 pb-4 md:pb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)", opacity: authReady ? 1 : 0, transition: "opacity 0.15s ease", fontFamily: "var(--font-orbitron)" }}>
          Hi, {displayName ?? "driver"}
        </h1>
        {currentTeamName && currentTeamColor ? (
          <div className="flex flex-col mt-5" style={{ gap: "1px" }}>
            <span className="inline-block h-px w-8 rounded-full mb-2" style={{ backgroundColor: "#FF0090" }} />
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)" }}>
              Let&apos;s go
            </span>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: currentTeamColor,
                display: "block",
                lineHeight: 1.1,
                opacity:   teamPhase === "visible" ? 1 : 0,
                transform: teamPhase === "visible"  ? "translateX(0px)"
                         : teamPhase === "exiting"  ? "translateX(10px)"
                         : "translateX(-10px)",
                transition: teamPhase === "entering"
                  ? "none"
                  : "opacity 0.6s ease, transform 0.6s ease",
              }}
            >
              {currentTeamName}
            </span>
          </div>
        ) : (
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Pick your races. Back the grid.
          </p>
        )}
      </header>

      {/* ── Main content: hero + schedule ── */}
      <div
        className="relative z-10 flex-1 flex flex-col md:flex-row md:items-start gap-4 md:gap-10 px-4 md:pl-40 md:pr-10 pb-2 w-full"
      >
        {/* ── Next Race Hero ── */}
        <div className="md:w-[620px] md:shrink-0">
          <NextRaceHero race={RACES[nextRaceIdx]} predictions={heroPredictions} lastRaceScore={lastRaceScore} />
          {currentRaceResult?.qualPole && qualifiedRaceIdx === nextRaceIdx && (
            <WeekendResultsCard result={currentRaceResult} pick={currentRacePick} userId={user?.uid ?? ""} />
          )}
        </div>

        {/* ── Race Schedule Panel ── */}
        <div className="md:w-72 lg:w-80 flex flex-col gap-2">

        <PredictionsWidget />

        <div
          className="flex flex-col rounded-xl overflow-hidden"
          style={{
            border: "1px solid rgba(255,255,255,0.14)",
            backgroundColor: "rgba(10,10,18,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center px-4 shrink-0"
            style={{
              minHeight: "64px",
              borderBottom: "1px solid rgba(255,255,255,0.10)",
              backgroundImage: `
                url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%231a1a1a'/%3E%3Crect width='2' height='2' fill='%23242424'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23242424'/%3E%3Crect width='2' height='.8' fill='%23333'/%3E%3Crect x='2' y='2' width='2' height='.8' fill='%23333'/%3E%3Crect width='2' height='.35' y='.1' fill='%23444' opacity='.8'/%3E%3Crect x='2' y='2.1' width='2' height='.35' fill='%23444' opacity='.8'/%3E%3C/svg%3E")
              `,
              backgroundRepeat: "repeat",
            }}
          >
            <h2 style={{ fontFamily: "var(--font-orbitron)", fontSize: "22px", fontWeight: 600, letterSpacing: "0.02em", lineHeight: 1 }}>
              <span style={{ color: "#FF0090" }}>F1</span>
              <span style={{ color: "rgba(255,255,255,0.90)" }}> 2026 Season</span>
            </h2>
          </div>

          {/* Race rows */}
          <div className="flex flex-col">
            {pageRaces.map((race) => {
              const isPast = new Date(race.startUtc).getTime() < Date.now();
              const isNext = race.r === RACES[nextRaceIdx].r;
              return (
                <Link
                  key={race.r}
                  href={`/predictions/race/${race.r}`}
                  className="flex items-center gap-3 px-3"
                  style={{
                    minHeight: isNext ? "96px" : "44px",
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    borderLeft: isNext ? "5px solid #FF0090" : "3px solid transparent",
                    background: isNext
                      ? "linear-gradient(to right, rgba(255,0,144,0.28) 0%, rgba(255,0,144,0.09) 60%, transparent 100%)"
                      : "transparent",
                    boxShadow: isNext ? "0 0 0 1px rgba(255,0,144,0.22), inset 0 0 60px rgba(255,0,144,0.09)" : "none",
                  }}
                >
                  {/* Round */}
                  <span
                    className="font-mono shrink-0"
                    style={{
                      fontSize: isNext ? "13px" : "11px",
                      minWidth: "28px",
                      color: isPast ? "rgba(255,255,255,0.2)" : isNext ? "rgba(255,255,255,0.7)" : "var(--muted)",
                    }}
                  >
                    R{String(race.r).padStart(2, "0")}
                  </span>

                  {/* Flag */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${flagToCC(race.flag)}.png`}
                    width={isNext ? 48 : 24}
                    height={isNext ? 36 : 18}
                    alt=""
                    className="shrink-0 rounded"
                    style={{
                      objectFit: "cover",
                      opacity: isPast ? 0.35 : 1,
                      boxShadow: isNext ? "0 4px 12px rgba(0,0,0,0.6)" : "none",
                    }}
                  />

                  {/* Name + tags */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={isNext ? "" : "truncate"}
                      style={{
                        fontSize: isNext ? "20px" : "15px",
                        fontWeight: isNext ? 800 : 400,
                        lineHeight: isNext ? 1.2 : undefined,
                        color: isPast ? "rgba(255,255,255,0.28)" : isNext ? "#ffffff" : "var(--foreground)",
                      }}
                    >
                      {race.name.replace(" Grand Prix", " GP")}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {isNext && (
                        <span
                          className="text-[11px] px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                          style={{ backgroundColor: "rgba(255,0,144,0.55)", color: "#ffffff", border: "1px solid rgba(255,0,144,0.9)", boxShadow: "0 0 8px rgba(255,0,144,0.4)" }}
                        >
                          Next Race
                        </span>
                      )}
                      {race.sprint && (
                        <span
                          className="text-[10px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
                          style={{ backgroundColor: "rgba(255,200,0,0.1)", color: "#ffc800", border: "1px solid rgba(255,200,0,0.3)" }}
                        >
                          Sprint
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <span
                    className="font-mono shrink-0"
                    style={{
                      fontSize: isNext ? "14px" : "11px",
                      color: isPast ? "rgba(255,255,255,0.2)" : isNext ? "#ffffff" : "var(--muted)",
                      fontWeight: isNext ? 700 : 400,
                    }}
                  >
                    {formatRaceDate(race, timezoneName)}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.10)" }}
          >
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-sm font-semibold px-2 py-1 rounded transition-opacity disabled:opacity-25"
              style={{ color: "var(--muted)" }}
            >
              ← Prev
            </button>
            <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
              {page + 1} / {TOTAL_PAGES}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(TOTAL_PAGES - 1, p + 1))}
              disabled={page === TOTAL_PAGES - 1}
              className="text-sm font-semibold px-2 py-1 rounded transition-opacity disabled:opacity-25"
              style={{ color: "var(--muted)" }}
            >
              Next →
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
    <Companion />
    </>
  );
}
