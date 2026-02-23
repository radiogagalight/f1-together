"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { RACES, CONSTRUCTORS, formatRaceDate, flagToCC } from "@/lib/data";
import { hexToRgb, TEAM_COLORS } from "@/lib/teamColors";

const PAGE_SIZE = 8;
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
interface TurnItem {
  label: string;
  sublabel: string;
  href: string;
  left: string;
  top: string;
  active: boolean;
  icon: string;
}

const TURNS: TurnItem[] = [
  { label: "Predictions", sublabel: "2026 season", href: "/predictions", left: "72%", top: "24%", active: true,  icon: "🏁" },
  { label: "Profile",     sublabel: "Your details", href: "/profile",     left: "22%", top: "24%", active: true,  icon: "👤" },
  { label: "Coming soon", sublabel: "",             href: "#",            left: "11%", top: "55%", active: false, icon: "🔒" },
  { label: "Group",       sublabel: "Fan cards",     href: "/members",     left: "73%", top: "80%", active: true,  icon: "👥" },
];

export default function HomePage() {
  const router = useRouter();
  const { user, teamAccent, timezoneOffset, favTeams } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const supabase = createClient();

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

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  function navigate(href: string) {
    if (href !== "#") router.push(href);
  }

  const pageRaces = RACES.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="flex flex-col min-h-screen pb-24" style={{ backgroundColor: "#080810" }}>
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
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Hi, {displayName ?? "driver"}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
          Tap a turn to navigate
        </p>
      </header>

      {/* ── Main content: track + schedule ── */}
      <div
        className="relative z-10 flex-1 flex flex-col md:flex-row gap-4 px-4 pb-2 w-full mx-auto"
        style={{ maxWidth: "1100px" }}
      >
        {/* ── Track image with overlaid buttons ── */}
        <div className="flex items-center justify-center md:flex-1">
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
                    className="flex flex-col items-center"
                    style={{ gap: "7px" }}
                    aria-label={turn.label}
                  >
                    <div style={{ position: "relative", width: "92px", height: "92px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", backgroundColor: `rgba(${hexToRgb(teamAccent)},0.15)` }} />
                      <div style={{ position: "absolute", inset: "9px", borderRadius: "50%", border: `1.5px solid rgba(${hexToRgb(teamAccent)},0.40)` }} />
                      <div style={{ position: "relative", width: "65px", height: "65px", borderRadius: "50%", backgroundColor: teamAccent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "31px", boxShadow: `0 0 24px rgba(${hexToRgb(teamAccent)},0.65)` }}>
                        {turn.icon}
                      </div>
                    </div>
                    <span style={{ fontSize: "19px", fontWeight: 700, color: "white", textShadow: "0 0 8px rgba(0,0,0,1), 0 2px 12px rgba(0,0,0,1), 0 0 24px rgba(0,0,0,0.9)", lineHeight: 1.2, textAlign: "center", whiteSpace: "nowrap" }}>
                      {turn.label}
                    </span>
                    {turn.sublabel && (
                      <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.55)", textShadow: "0 0 8px rgba(0,0,0,1), 0 2px 12px rgba(0,0,0,1), 0 0 24px rgba(0,0,0,0.9)", lineHeight: 1.2, textAlign: "center", whiteSpace: "nowrap" }}>
                        {turn.sublabel}
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="flex flex-col items-center" style={{ gap: "7px" }}>
                    <div style={{ width: "65px", height: "65px", borderRadius: "50%", backgroundColor: "#252525", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "27px" }}>
                      {turn.icon}
                    </div>
                    <span style={{ fontSize: "15px", color: "#4a4a4a", lineHeight: 1.2, textAlign: "center", whiteSpace: "nowrap" }}>
                      {turn.label}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Race Schedule Panel ── */}
        <div className="md:w-72 lg:w-80 flex flex-col gap-2">

        {/* Let's go greeting */}
        {currentTeamName && currentTeamColor && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-4 rounded-full shrink-0" style={{ backgroundColor: "var(--f1-red)" }} />
            <p style={{ color: "var(--muted)", fontWeight: 300, fontSize: "19px", lineHeight: 1.3 }}>
              {"Let's go "}
              <span
                style={{
                  color: currentTeamColor,
                  fontWeight: 700,
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
            </p>
          </div>
        )}

        <div
          className="flex-1 flex flex-col rounded-xl overflow-hidden"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            backgroundColor: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-0.5 w-4 rounded-full"
                style={{ backgroundColor: "var(--f1-red)" }}
              />
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--muted)" }}
              >
                2026 Schedule
              </span>
            </div>
            <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
              24 Races
            </span>
          </div>

          {/* Race rows — flex-1 so they fill available height equally */}
          <div className="flex-1 flex flex-col">
            {pageRaces.map((race) => {
              const isPast = new Date(race.date + "T14:00:00Z").getTime() < Date.now();
              const isNext = race.r === RACES[nextRaceIdx].r;
              return (
                <Link
                  key={race.r}
                  href={`/predictions/race/${race.r}`}
                  className="flex-1 flex items-center gap-3 px-3"
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    borderLeft: isNext ? "2px solid var(--f1-red)" : "2px solid transparent",
                    backgroundColor: isNext ? "rgba(225,6,0,0.07)" : "transparent",
                    opacity: isPast && !isNext ? 0.4 : 1,
                  }}
                >
                  {/* Round */}
                  <span
                    className="font-mono text-xs shrink-0"
                    style={{ color: "var(--muted)", minWidth: "26px" }}
                  >
                    R{String(race.r).padStart(2, "0")}
                  </span>

                  {/* Flag */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://flagcdn.com/w40/${flagToCC(race.flag)}.png`}
                    width={24}
                    height={18}
                    alt=""
                    className="shrink-0 rounded-sm"
                    style={{ objectFit: "cover" }}
                  />

                  {/* Name + tags */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--foreground)" }}
                    >
                      {race.name.replace(" Grand Prix", " GP")}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isNext && (
                        <span
                          className="text-[9px] px-1 py-px rounded font-bold uppercase tracking-wider"
                          style={{ backgroundColor: "rgba(225,6,0,0.2)", color: "var(--f1-red)", border: "1px solid rgba(225,6,0,0.4)" }}
                        >
                          Next
                        </span>
                      )}
                      {race.sprint && (
                        <span
                          className="text-[9px] px-1 py-px rounded font-bold uppercase tracking-wider"
                          style={{ backgroundColor: "rgba(255,200,0,0.1)", color: "#ffc800", border: "1px solid rgba(255,200,0,0.3)" }}
                        >
                          Sprint
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <span
                    className="font-mono text-xs shrink-0"
                    style={{ color: "var(--muted)" }}
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
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
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
