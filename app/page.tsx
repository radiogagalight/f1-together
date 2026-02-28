"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { RACES, CONSTRUCTORS, formatRaceDate, flagToCC } from "@/lib/data";
import { hexToRgb, TEAM_COLORS } from "@/lib/teamColors";

const PAGE_SIZE = 6;
const TOTAL_PAGES = Math.ceil(RACES.length / PAGE_SIZE);

function getNextRaceIndex() {
  const idx = RACES.findIndex(r => new Date(r.date + "T14:00:00Z").getTime() > Date.now());
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

// ── Turn buttons on the track image ────────────────────────────
const ICON_FLAG = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#cf)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);
const ICON_USER = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#cf)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const ICON_GROUP = (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="url(#cf)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ICON_LOCK = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="url(#cf)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

interface TurnItem {
  label: string;
  href: string;
  left: string;
  top: string;
  active: boolean;
  icon: React.ReactNode;
}

const TURNS: TurnItem[] = [
  { label: "Predictions", href: "/predictions", left: "72%", top: "24%", active: true,  icon: ICON_FLAG  },
  { label: "Profile",     href: "/profile",     left: "22%", top: "24%", active: true,  icon: ICON_USER  },
  { label: "Coming soon", href: "#",            left: "11%", top: "55%", active: false, icon: ICON_LOCK  },
  { label: "Community",   href: "/members",     left: "73%", top: "80%", active: true,  icon: ICON_GROUP },
];

export default function HomePage() {
  const router = useRouter();
  const { user, authReady, displayName, teamAccent, timezoneOffset, favTeams, unreadCount } = useAuth();

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

  function navigate(href: string) {
    if (href !== "#") router.push(href);
  }

  const pageRaces = RACES.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ backgroundColor: "#13131f" }}>
      {/* ── Carbon fibre pattern definition (referenced by track menu icons) ── */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute", pointerEvents: "none" }}>
        <defs>
          <pattern id="cf" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="#4a4a4a"/>
            <rect x="0" y="0" width="2" height="2" fill="#5e5e5e"/>
            <rect x="2" y="2" width="2" height="2" fill="#5e5e5e"/>
            <rect x="0" y="0" width="2" height="0.8" fill="#7a7a7a"/>
            <rect x="2" y="2" width="2" height="0.8" fill="#7a7a7a"/>
            <rect x="0" y="0.1" width="2" height="0.35" fill="#999" opacity="0.8"/>
            <rect x="2" y="2.1" width="2" height="0.35" fill="#999" opacity="0.8"/>
          </pattern>
        </defs>
      </svg>
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
            Tap a turn to navigate
          </p>
        )}
      </header>

      {/* ── Main content: track + schedule ── */}
      <div
        className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 px-4 pb-2 w-full mx-auto"
        style={{ maxWidth: "1100px" }}
      >
        {/* ── Track image with overlaid buttons ── */}
        <div className="flex items-center justify-center md:flex-1 md:-ml-[88px]" style={{ marginTop: "-48px" }}>
          <div className="relative w-full" style={{ maxWidth: "714px" }}>
            <Image
              src="/images/lv-circuit.webp"
              alt="Las Vegas Grand Prix track layout"
              width={1040}
              height={830}
              className="w-full h-auto"
              style={{ filter: "invert(1)", opacity: 0.5 }}
              priority
            />

            {TURNS.map((turn) => (
              <div
                key={turn.href + turn.left}
                className="absolute"
                style={{ left: turn.left, top: turn.top, transform: "translate(-50%, -50%)" }}
              >
                {turn.active ? (
                  <button
                    onClick={() => navigate(turn.href)}
                    className="flex flex-col items-center active:scale-95 transition-transform duration-150"
                    style={{ gap: "8px" }}
                    aria-label={turn.label}
                  >
                    {/* Single-ring circle with frosted glass fill */}
                    <div style={{
                      position: "relative",
                      width: "68px",
                      height: "68px",
                      borderRadius: "50%",
                      backgroundColor: `rgba(${hexToRgb(teamAccent)}, 0.12)`,
                      border: `1.5px solid rgba(${hexToRgb(teamAccent)}, 0.5)`,
                      boxShadow: `0 0 18px rgba(${hexToRgb(teamAccent)}, 0.28), inset 0 0 10px rgba(${hexToRgb(teamAccent)}, 0.08)`,
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {turn.icon}
                      {turn.href === "/members" && unreadCount > 0 && (
                        <div style={{ position: "absolute", top: "-3px", right: "-3px", minWidth: "18px", height: "18px", borderRadius: "9px", backgroundColor: "#e10600", color: "#fff", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: "2px solid #13131f" }}>
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Frosted glass pill label */}
                    <div style={{
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      backgroundColor: "rgba(8,8,16,0.78)",
                      border: `1px solid rgba(${hexToRgb(teamAccent)}, 0.45)`,
                      borderRadius: "999px",
                      padding: "4px 12px",
                    }}>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "rgba(255,255,255,0.95)", lineHeight: 1.2, whiteSpace: "nowrap", letterSpacing: "0.01em", fontFamily: "var(--font-orbitron)" }}>
                        {turn.label}
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="flex flex-col items-center" style={{ gap: "8px" }}>
                    {/* Inactive circle */}
                    <div style={{
                      width: "68px",
                      height: "68px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1.5px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.2)",
                    }}>
                      {turn.icon}
                    </div>
                    {/* Inactive pill */}
                    <div style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "999px",
                      padding: "4px 12px",
                    }}>
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
                        {turn.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Race Schedule Panel ── */}
        <div className="md:w-72 lg:w-80 flex flex-col gap-2" style={{ marginTop: "-48px" }}>


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
              const isPast = new Date(race.date + "T14:00:00Z").getTime() < Date.now();
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
  );
}
