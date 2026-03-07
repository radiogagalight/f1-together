"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRacePick } from "@/hooks/useRacePick";
import { useSeasonPicks } from "@/hooks/useSeasonPicks";
import { RACES } from "@/lib/data";
import type { RacePick, SeasonPicks } from "@/lib/types";

// Season picks lock at Chinese GP FP1 (R2 weekend start)
const SEASON_LOCK_UTC = RACES[1].weekendStartUtc!;

function getNextRace() {
  const idx = RACES.findIndex((r) => new Date(r.startUtc).getTime() > Date.now());
  return idx === -1 ? null : RACES[idx];
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "now";
  const totalMins = Math.floor(ms / 60_000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h >= 1)  return `${h}h ${m}m`;
  return `${m}m`;
}

function urgencyStyle(ms: number): { color: string; borderColor: string; bgColor: string } {
  if (ms < 6 * 3_600_000)  return { color: "#e10600",  borderColor: "rgba(225,6,0,0.35)",    bgColor: "rgba(225,6,0,0.06)"    };
  if (ms < 24 * 3_600_000) return { color: "#ffc800",  borderColor: "rgba(255,200,0,0.35)",  bgColor: "rgba(255,200,0,0.06)"  };
  return                           { color: "var(--muted)", borderColor: "rgba(255,255,255,0.08)", bgColor: "transparent" };
}

const RACE_FIELD_LABELS: Record<keyof RacePick, string> = {
  qualPole: "Pole Position", qualP2: "Qual P2",      qualP3: "Qual P3",
  raceWinner: "Race Winner", raceP2: "Race P2",      raceP3: "Race P3",
  fastestLap: "Fastest Lap", safetyCar: "Safety Car",
  sprintQualPole: "SQ Pole", sprintQualP2: "SQ P2",  sprintQualP3: "SQ P3",
  sprintWinner: "Sprint Win",sprintP2: "Sprint P2",  sprintP3: "Sprint P3",
};

const SEASON_FIELD_LABELS: Record<keyof SeasonPicks, string> = {
  wdcWinner:          "WDC Winner",
  wccWinner:          "WCC Winner",
  mostWins:           "Most Race Wins",
  mostPoles:          "Most Poles",
  mostPodiums:        "Most Podiums",
  mostDnfsDriver:     "Most DNFs — Driver",
  mostDnfsConstructor:"Most DNFs — Constructor",
};

function unpickedRaceFields(picks: RacePick | null, fields: (keyof RacePick)[]): (keyof RacePick)[] {
  return fields.filter((f) => {
    const v = picks?.[f];
    return v === null || v === undefined;
  });
}

export default function PredictionsWidget() {
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const nextRace = getNextRace();
  const { picks: racePicks, loading: raceLoading } = useRacePick(user?.id, nextRace?.r ?? 0);
  const { picks: seasonPicks, loading: seasonLoading } = useSeasonPicks(user?.id);

  if (!user || !nextRace) return null;
  // Don't flash a skeleton — just wait silently
  if (raceLoading || seasonLoading) return null;

  // ── Season section ──────────────────────────────────────────────
  const seasonLockMs  = new Date(SEASON_LOCK_UTC).getTime() - now;
  const seasonLocked  = seasonLockMs <= 0;
  const seasonMissing = (!seasonLocked && seasonPicks)
    ? (Object.keys(seasonPicks) as (keyof SeasonPicks)[]).filter((k) => seasonPicks[k] === null)
    : [];

  // ── Race session groups (ordered soonest-first) ─────────────────
  type SessionGroup = { label: string; lockMs: number; href: string; fields: (keyof RacePick)[] };
  const groups: SessionGroup[] = [];

  if (nextRace.sprint && nextRace.sprintQualifyingUtc) {
    const ms = new Date(nextRace.sprintQualifyingUtc).getTime() - now;
    if (ms > 0) groups.push({
      label: "Sprint Qualifying",
      lockMs: ms,
      href: `/predictions/race/${nextRace.r}`,
      fields: unpickedRaceFields(racePicks, ["sprintQualPole", "sprintQualP2", "sprintQualP3"]),
    });
  }

  if (nextRace.sprint && nextRace.sprintStartUtc) {
    const ms = new Date(nextRace.sprintStartUtc).getTime() - now;
    if (ms > 0) groups.push({
      label: "Sprint Race",
      lockMs: ms,
      href: `/predictions/race/${nextRace.r}`,
      fields: unpickedRaceFields(racePicks, ["sprintWinner", "sprintP2", "sprintP3"]),
    });
  }

  const qualMs = new Date(nextRace.qualifyingUtc).getTime() - now;
  if (qualMs > 0) groups.push({
    label: "Qualifying",
    lockMs: qualMs,
    href: `/predictions/race/${nextRace.r}`,
    fields: unpickedRaceFields(racePicks, ["qualPole", "qualP2", "qualP3"]),
  });

  const raceMs = new Date(nextRace.startUtc).getTime() - now;
  if (raceMs > 0) groups.push({
    label: "Race",
    lockMs: raceMs,
    href: `/predictions/race/${nextRace.r}`,
    fields: unpickedRaceFields(racePicks, ["raceWinner", "raceP2", "raceP3", "fastestLap", "safetyCar"]),
  });

  const pendingGroups = groups.filter((g) => g.fields.length > 0);
  const hasAnything   = pendingGroups.length > 0 || seasonMissing.length > 0;

  // ── Nothing to show ─────────────────────────────────────────────
  if (!hasAnything) {
    // Only show the "all done" state while the race weekend is still open
    if (raceMs <= 0) return null;
    return (
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-2"
        style={{ border: "1px solid rgba(34,197,94,0.3)", backgroundColor: "rgba(34,197,94,0.06)" }}
      >
        <span style={{ color: "#22c55e" }}>✓</span>
        <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>
          All picks locked in for {nextRace.name.replace(" Grand Prix", " GP")}!
        </span>
      </div>
    );
  }

  // ── Picks still needed ──────────────────────────────────────────
  const seasonSection = seasonMissing.length > 0 ? {
    key: "season",
    label: "Season Picks",
    lockMs: seasonLockMs,
    href: "/predictions/season",
    pills: seasonMissing.map((k) => ({ key: k, label: SEASON_FIELD_LABELS[k] })),
  } : null;

  const raceSections = pendingGroups
    .map((g) => ({
      key: g.label,
      label: g.label,
      lockMs: g.lockMs,
      href: g.href,
      pills: g.fields.map((f) => ({ key: f, label: RACE_FIELD_LABELS[f] })),
    }))
    .sort((a, b) => a.lockMs - b.lockMs);

  type AnySection = { key: string; label: string; lockMs: number; href: string; pills: { key: string; label: string }[] };
  function SectionRow({ section, isLast }: { section: AnySection; isLast: boolean }) {
    const style = urgencyStyle(section.lockMs);
    const { pills } = section;
    return (
      <Link
        href={section.href}
        className="block px-4 py-3 transition-colors hover:bg-white/[0.03] active:bg-white/[0.05]"
        style={{
          borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)",
          backgroundColor: style.bgColor,
        }}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: style.color }}>
            {section.label}
          </span>
          <span className="text-xs font-mono" style={{ color: style.color }}>
            {formatCountdown(section.lockMs)} left
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pills.length <= 2 ? (
            pills.map((pill) => (
              <span
                key={pill.key}
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: `1px solid ${style.borderColor}`,
                  color: style.color,
                  whiteSpace: "nowrap",
                }}
              >
                {pill.label}
              </span>
            ))
          ) : (
            <>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: `1px solid ${style.borderColor}`,
                  color: style.color,
                  whiteSpace: "nowrap",
                }}
              >
                {pills[0].label}
              </span>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: `1px solid ${style.borderColor}`,
                  color: style.color,
                  whiteSpace: "nowrap",
                }}
              >
                +{pills.length - 1} more
              </span>
            </>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        backgroundColor: "rgba(10,10,18,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center px-4 shrink-0"
        style={{
          minHeight: "64px",
          borderBottom: "1px solid rgba(255,255,255,0.10)",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%231a1a1a'/%3E%3Crect width='2' height='2' fill='%23242424'/%3E%3Crect x='2' y='2' width='2' height='2' fill='%23242424'/%3E%3Crect width='2' height='.8' fill='%23333'/%3E%3Crect x='2' y='2' width='2' height='.8' fill='%23333'/%3E%3Crect width='2' height='.35' y='.1' fill='%23444' opacity='.8'/%3E%3Crect x='2' y='2.1' width='2' height='.35' fill='%23444' opacity='.8'/%3E%3C%2Fsvg%3E")`,
          backgroundRepeat: "repeat",
        }}
      >
        <h2 style={{ fontFamily: "var(--font-orbitron)", fontSize: "22px", fontWeight: 600, letterSpacing: "0.02em", lineHeight: 1 }}>
          <span style={{ color: "var(--f1-red)" }}>Picks</span>
          <span style={{ color: "rgba(255,255,255,0.90)" }}> Due</span>
        </h2>
      </div>

      {/* Race header */}
      {raceSections.length > 0 && (
        <div
          className="flex items-center gap-2 px-4 pt-3 pb-2"
          style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
        >
          <span className="inline-block h-px w-4 rounded-full" style={{ backgroundColor: "var(--f1-red)" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
            {nextRace.flag} {nextRace.name.replace(" Grand Prix", " GP")}
          </span>
        </div>
      )}

      {/* Race sections — each row is tappable */}
      {raceSections.map((section, i) => (
        <SectionRow key={section.key} section={section} isLast={i === raceSections.length - 1 && !seasonSection} />
      ))}

      {/* Season picks — visually separated */}
      {seasonSection && (
        <>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", margin: "0 16px" }} />
          <div
            className="flex items-center gap-2 px-4 pt-3 pb-2"
            style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
          >
            <span className="inline-block h-px w-4 rounded-full" style={{ backgroundColor: "var(--f1-red)" }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.7)" }}>
              Season
            </span>
          </div>
          <SectionRow section={seasonSection} isLast />
        </>
      )}
    </div>
  );
}
