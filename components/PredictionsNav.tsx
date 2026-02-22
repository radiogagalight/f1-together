"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RACES } from "@/lib/data";

interface Props {
  mobile?: boolean;
}

const NEXT_RACE_IDX = Math.max(
  0,
  RACES.findIndex((r) => new Date(r.date + "T14:00:00Z").getTime() > Date.now())
);

const TOP_TABS = [
  { href: "/predictions",        label: "All"    },
  { href: "/predictions/season", label: "Season" },
  { href: "/predictions/race",   label: "Race"   },
];

export default function PredictionsNav({ mobile = false }: Props) {
  const pathname = usePathname();
  const [seeAll, setSeeAll] = useState(false);

  // Detect if we're on a specific race detail page
  const roundMatch = pathname.match(/^\/predictions\/race\/(\d+)$/);
  const currentRound = roundMatch ? parseInt(roundMatch[1]) : null;
  const currentRace = currentRound ? RACES.find((r) => r.r === currentRound) ?? null : null;

  const isRaceSection = pathname.startsWith("/predictions/race");
  const isAllActive    = pathname === "/predictions";
  const isSeasonActive = pathname === "/predictions/season";

  // ── Mobile ──────────────────────────────────────────────────
  if (mobile) {
    // On a race detail page: back arrow + race name
    if (currentRace) {
      return (
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/predictions/race"
            className="text-sm font-semibold shrink-0"
            style={{ color: "var(--muted)" }}
          >
            ← Back
          </Link>
          <span
            className="flex-1 text-sm font-semibold truncate"
            style={{ color: "var(--foreground)" }}
          >
            {currentRace.flag} {currentRace.name.replace(" Grand Prix", " GP")}
          </span>
        </div>
      );
    }

    // Regular tab bar
    return (
      <div className="flex gap-1 px-3 py-2 overflow-x-auto">
        {TOP_TABS.map((tab) => {
          const isActive =
            tab.href === "/predictions/race"
              ? isRaceSection
              : tab.href === "/predictions"
              ? isAllActive
              : pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: isActive ? "var(--f1-red)" : "rgba(255,255,255,0.06)",
                color: isActive ? "#fff" : "var(--muted)",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    );
  }

  // ── Desktop sidebar ──────────────────────────────────────────
  const upcomingRaces = RACES.slice(NEXT_RACE_IDX);
  const visibleRaces = seeAll ? RACES : upcomingRaces.slice(0, 5);
  const hiddenCount = upcomingRaces.length - 5;

  return (
    <div className="flex flex-col h-full px-3 py-5">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-4 px-2">
        <span
          className="inline-block h-0.5 w-4 rounded-full"
          style={{ backgroundColor: "var(--f1-red)" }}
        />
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          2026 Predictions
        </span>
      </div>

      {/* Top-level nav items */}
      <nav className="flex flex-col gap-0.5">
        {/* All Predictions */}
        <Link
          href="/predictions"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: isAllActive ? "rgba(225,6,0,0.12)" : "transparent",
            color: isAllActive ? "var(--f1-red)" : "var(--muted)",
          }}
        >
          All Predictions
        </Link>

        {/* Season Predictions */}
        <Link
          href="/predictions/season"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: isSeasonActive ? "rgba(225,6,0,0.12)" : "transparent",
            color: isSeasonActive ? "var(--f1-red)" : "var(--muted)",
          }}
        >
          Season Predictions
        </Link>

        {/* Race Predictions + nested list */}
        <Link
          href="/predictions/race"
          className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          style={{
            backgroundColor: isRaceSection ? "rgba(225,6,0,0.12)" : "transparent",
            color: isRaceSection ? "var(--f1-red)" : "var(--muted)",
          }}
        >
          Race Predictions
        </Link>

        {/* Nested race list — shown when in race section */}
        {isRaceSection && (
          <div className="ml-3 mt-1 flex flex-col gap-px border-l pl-3" style={{ borderColor: "var(--border)" }}>
            {visibleRaces.map((race) => {
              const isPast = new Date(race.date + "T14:00:00Z").getTime() < Date.now();
              const isActive = currentRound === race.r;
              return (
                <Link
                  key={race.r}
                  href={`/predictions/race/${race.r}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: isActive ? "rgba(225,6,0,0.1)" : "transparent",
                    color: isActive ? "var(--f1-red)" : isPast ? "#444" : "var(--muted)",
                    opacity: isPast && !isActive ? 0.5 : 1,
                  }}
                >
                  <span className="shrink-0">{race.flag}</span>
                  <span className="truncate">{race.name.replace(" Grand Prix", " GP")}</span>
                  {isPast && <span className="shrink-0 text-[10px]">🔒</span>}
                </Link>
              );
            })}

            {/* See all / collapse toggle */}
            {!seeAll && hiddenCount > 0 && (
              <button
                onClick={() => setSeeAll(true)}
                className="text-left px-2 py-1.5 text-xs font-semibold transition-colors"
                style={{ color: "var(--muted)" }}
              >
                +{hiddenCount} more →
              </button>
            )}
            {seeAll && (
              <button
                onClick={() => setSeeAll(false)}
                className="text-left px-2 py-1.5 text-xs font-semibold transition-colors"
                style={{ color: "var(--muted)" }}
              >
                ← Show less
              </button>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
