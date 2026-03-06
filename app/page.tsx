"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { RACES, CONSTRUCTORS, DRIVERS, formatRaceDate, flagToCC } from "@/lib/data";
import { RACE_FACTS } from "@/lib/raceFacts";
import { hexToRgb, TEAM_COLORS } from "@/lib/teamColors";
import PredictionsWidget from "@/components/PredictionsWidget";
import Companion from "@/components/Companion";
import { createClient } from "@/lib/supabase/client";

function NextRaceHero({
  race,
  picks,
}: {
  race: (typeof RACES)[number];
  picks: { pole: string | null; winner: string | null };
}) {
  const heroImage = RACE_FACTS[race.r]?.heroImage;

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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

  const poleName   = picks.pole   ? (DRIVERS.find(d => d.id === picks.pole)?.name   ?? null) : null;
  const winnerName = picks.winner ? (DRIVERS.find(d => d.id === picks.winner)?.name ?? null) : null;
  const hasPicks   = !!(poleName || winnerName);

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
        {/* Top badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            Round {race.r}
          </span>
          {race.sprint && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(255,200,0,0.12)", color: "#ffc800", border: "1px solid rgba(255,200,0,0.35)" }}
            >
              Sprint
            </span>
          )}
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
                textShadow: "0 0 24px rgba(225,6,0,0.7), 0 2px 12px rgba(0,0,0,0.9)",
              }}
            >
              {dayLabel}
            </p>
          )}

          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {race.circuit}
          </p>
          <h2 className="font-black leading-none mb-3" style={{ fontFamily: "var(--font-orbitron)", textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}>
            <span className="block text-2xl" style={{ color: "#ffffff" }}>
              {race.name.replace(" Grand Prix", "")}
            </span>
            <span className="block text-base" style={{ color: "rgba(255,255,255,0.5)" }}>
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
                        fontSize: "8px", fontWeight: 700, letterSpacing: "0.05em",
                        textTransform: "uppercase", whiteSpace: "nowrap",
                        color: sNext ? "#e10600" : sPast ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)",
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
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
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
                        fontSize: "1.5rem", fontWeight: 900,
                        fontVariantNumeric: "tabular-nums", lineHeight: 1,
                        color: countdownColor,
                        textShadow: under24h ? `0 0 16px ${countdownColor}55` : "none",
                      }}
                    >
                      {u === "Days" ? v : pad(v)}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {u}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Pick preview */}
          {hasPicks ? (
            <div className="mb-3 flex flex-col gap-0.5">
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                Your picks
              </p>
              {poleName && (
                <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
                  Pole · {poleName}
                </p>
              )}
              {winnerName && (
                <p style={{ fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>
                  Race · {winnerName}
                </p>
              )}
            </div>
          ) : (
            <p className="mb-3" style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>
              No picks yet
            </p>
          )}

          <Link
            href={`/predictions/race/${race.r}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold"
            style={{ backgroundColor: "rgba(225,6,0,0.9)", color: "#ffffff", boxShadow: "0 0 20px rgba(225,6,0,0.35)" }}
          >
            {hasPicks ? "Edit picks →" : "Make your picks →"}
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
  { top:  7, width: 38, dur: 2.1, delay: 0.3,  opacity: 0.28 },
  { top: 14, width: 52, dur: 3.4, delay: 1.8,  opacity: 0.18 },
  { top: 21, width: 25, dur: 1.8, delay: 4.2,  opacity: 0.42 },
  { top: 28, width: 44, dur: 4.1, delay: 0.8,  opacity: 0.31 },
  { top: 35, width: 31, dur: 2.7, delay: 2.5,  opacity: 0.22 },
  { top: 42, width: 58, dur: 1.6, delay: 5.1,  opacity: 0.47 },
  { top: 48, width: 19, dur: 3.8, delay: 3.3,  opacity: 0.15 },
  { top: 55, width: 46, dur: 2.3, delay: 0.6,  opacity: 0.38 },
  { top: 62, width: 33, dur: 4.4, delay: 2.1,  opacity: 0.25 },
  { top: 68, width: 57, dur: 1.9, delay: 4.7,  opacity: 0.52 },
  { top: 74, width: 22, dur: 3.1, delay: 1.2,  opacity: 0.19 },
  { top: 81, width: 41, dur: 2.6, delay: 3.8,  opacity: 0.34 },
  { top: 87, width: 16, dur: 4.0, delay: 0.9,  opacity: 0.13 },
  { top: 93, width: 49, dur: 2.9, delay: 5.5,  opacity: 0.44 },
  { top: 11, width: 35, dur: 1.7, delay: 2.9,  opacity: 0.30 },
  { top: 24, width: 60, dur: 3.6, delay: 1.4,  opacity: 0.21 },
  { top: 39, width: 27, dur: 2.4, delay: 4.5,  opacity: 0.56 },
  { top: 52, width: 43, dur: 4.2, delay: 0.2,  opacity: 0.17 },
  { top: 66, width: 18, dur: 3.0, delay: 3.6,  opacity: 0.40 },
  { top: 79, width: 55, dur: 2.2, delay: 5.8,  opacity: 0.26 },
  { top: 89, width: 30, dur: 1.5, delay: 1.7,  opacity: 0.49 },
  { top: 97, width: 47, dur: 3.9, delay: 4.0,  opacity: 0.33 },
];


export default function HomePage() {
  const { user, authReady, displayName, teamAccent, timezoneOffset, favTeams } = useAuth();

  const nextRaceIdx = getNextRaceIndex();
  const [page, setPage] = useState(Math.floor(nextRaceIdx / PAGE_SIZE));

  // Fetch user's pole + winner picks for the next race
  const [heroPicks, setHeroPicks] = useState<{ pole: string | null; winner: string | null }>({ pole: null, winner: null });
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("race_picks")
      .select("qual_pole,race_winner")
      .eq("user_id", user.id)
      .eq("round", RACES[nextRaceIdx].r)
      .maybeSingle()
      .then(({ data }) => {
        setHeroPicks({ pole: data?.qual_pole ?? null, winner: data?.race_winner ?? null });
      });
  }, [user, nextRaceIdx]);

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
    <div className="flex flex-col min-h-screen pb-28 md:pb-6" style={{ backgroundColor: "#13131f" }}>
      {/* ── Speed lines background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {SPEED_LINES.map((line, i) => (
          <div
            key={i}
            className="absolute left-0"
            style={{
              top: `${line.top}%`,
              width: `${line.width}%`,
              height: "1px",
              background: `linear-gradient(to right, transparent, rgba(${hexToRgb(teamAccent)},0.4), transparent)`,
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
            <span className="inline-block h-px w-8 rounded-full mb-2" style={{ backgroundColor: "var(--f1-red)" }} />
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
          <NextRaceHero race={RACES[nextRaceIdx]} picks={heroPicks} />
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
              <span style={{ color: "var(--f1-red)" }}>F1</span>
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
                    borderLeft: isNext ? "5px solid #e10600" : "3px solid transparent",
                    background: isNext
                      ? "linear-gradient(to right, rgba(225,6,0,0.30) 0%, rgba(225,6,0,0.10) 60%, transparent 100%)"
                      : "transparent",
                    boxShadow: isNext ? "0 0 0 1px rgba(225,6,0,0.25), inset 0 0 60px rgba(225,6,0,0.10)" : "none",
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
                          style={{ backgroundColor: "rgba(225,6,0,0.55)", color: "#ffffff", border: "1px solid rgba(225,6,0,0.9)", boxShadow: "0 0 8px rgba(225,6,0,0.4)" }}
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
                    {formatRaceDate(race, timezoneOffset)}
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
