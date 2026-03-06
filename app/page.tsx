"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { RACES, CONSTRUCTORS, formatRaceDate, flagToCC } from "@/lib/data";
import { hexToRgb, TEAM_COLORS } from "@/lib/teamColors";
import PredictionsWidget from "@/components/PredictionsWidget";
import Companion from "@/components/Companion";
import { RACE_FACTS } from "@/lib/raceFacts";

function NextRaceHero({ race }: { race: (typeof RACES)[number] }) {
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
    ...(race.sprintQualifyingUtc ? [{ label: "Until Sprint Qualifying", utc: race.sprintQualifyingUtc }] : []),
    ...(race.sprintStartUtc      ? [{ label: "Until Sprint",             utc: race.sprintStartUtc      }] : []),
    { label: "Until Qualifying", utc: race.qualifyingUtc },
    { label: "Until Lights Out",  utc: race.startUtc },
  ] as { label: string; utc: string }[];

  const nextSession = sessions.find(s => new Date(s.utc).getTime() > now);
  const targetMs = nextSession ? Math.max(0, new Date(nextSession.utc).getTime() - now) : 0;

  const days    = Math.floor(targetMs / 86_400_000);
  const hours   = Math.floor((targetMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((targetMs % 3_600_000) / 60_000);
  const seconds = Math.floor((targetMs % 60_000) / 1_000);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="relative rounded-xl overflow-hidden md:flex-1" style={{ minHeight: "230px" }}>
      {heroImage ? (
        <Image src={heroImage} alt="" fill style={{ objectFit: "cover", objectPosition: "center", opacity: 0.45 }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(225,6,0,0.4) 0%, rgba(8,8,16,1) 70%)" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(8,8,16,0.15) 0%, rgba(8,8,16,0.85) 55%, rgba(8,8,16,0.98) 100%)" }} />

      <div className="relative z-10 flex flex-col justify-between p-4" style={{ minHeight: "230px", height: "100%" }}>
        {/* Top badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            Round {race.r}
          </span>
          {isLive && (
            <span
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(225,6,0,0.2)", color: "#e10600", border: "1px solid rgba(225,6,0,0.5)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ backgroundColor: "#e10600" }} />
              Race Weekend Live
            </span>
          )}
          {race.sprint && (
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(255,200,0,0.12)", color: "#ffc800", border: "1px solid rgba(255,200,0,0.35)" }}
            >
              Sprint
            </span>
          )}
        </div>

        {/* Race name + countdown + CTA */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            {race.circuit}
          </p>
          <h2 className="font-black leading-none mb-4" style={{ fontFamily: "var(--font-orbitron)", textShadow: "0 2px 16px rgba(0,0,0,0.9)" }}>
            <span className="block text-2xl" style={{ color: "#ffffff" }}>
              {race.name.replace(" Grand Prix", "")}
            </span>
            <span className="block text-base" style={{ color: "rgba(255,255,255,0.5)" }}>
              Grand Prix
            </span>
          </h2>

          {raceStarted ? (
            <p className="text-sm font-bold mb-4" style={{ color: "var(--f1-red)" }}>Lights out! 🏁</p>
          ) : nextSession ? (
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                {nextSession.label}
              </p>
              <div className="flex gap-4">
                {[
                  { v: days,    u: "Days" },
                  { v: hours,   u: "Hrs"  },
                  { v: minutes, u: "Mins" },
                  { v: seconds, u: "Secs" },
                ].map(({ v, u }) => (
                  <div key={u} className="flex flex-col">
                    <span className="text-2xl font-black tabular-nums leading-none" style={{ color: "#ffffff" }}>
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

          <Link
            href={`/predictions/race/${race.r}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold"
            style={{ backgroundColor: "rgba(225,6,0,0.9)", color: "#ffffff", boxShadow: "0 0 20px rgba(225,6,0,0.35)" }}
          >
            Make your picks →
          </Link>
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
      <header className="relative z-10 w-full px-6 pt-8 pb-4" style={{ maxWidth: "1100px", margin: "0 auto" }}>
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
        className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 px-4 pb-2 w-full mx-auto"
        style={{ maxWidth: "1100px" }}
      >
        {/* ── Next Race Hero ── */}
        <div className="md:flex-1 md:-mt-12 md:flex md:flex-col">
          <NextRaceHero race={RACES[nextRaceIdx]} />
        </div>

        {/* ── Race Schedule Panel ── */}
        <div className="md:w-72 lg:w-80 flex flex-col gap-2 md:-mt-12">

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
