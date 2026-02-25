"use client";

import { useAuth } from "@/components/AuthProvider";
import { useSeasonPicks } from "@/hooks/useSeasonPicks";
import CategoryCard from "./CategoryCard";
import { CATEGORIES, RACES } from "@/lib/data";
import type { SeasonPicks } from "@/lib/types";

const SEASON_LOCK_UTC = RACES[0].startUtc; // locks at Race 1 lights out

const GROUPS: { label: string; keys: (keyof SeasonPicks)[] }[] = [
  { label: "Championship", keys: ["wdcWinner", "wccWinner"] },
  { label: "Dominance",    keys: ["mostWins", "mostPoles", "mostPodiums"] },
  { label: "Black Sheep",  keys: ["firstDnfDriver", "firstDnfConstructor"] },
];

export default function SeasonPredictions() {
  const { user } = useAuth();
  const { picks, setPick, savedKey, loading } = useSeasonPicks(user?.id);
  const isLocked = new Date(SEASON_LOCK_UTC).getTime() < Date.now();

  const pickedCount = picks
    ? Object.values(picks).filter((v) => v !== null).length
    : 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          <span style={{ color: "var(--f1-red)" }}>F1</span> Season Predictions
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {loading || picks === null
            ? "Loading…"
            : `${pickedCount} of ${CATEGORIES.length} picked`}
        </p>
      </div>

      {/* Progress bar */}
      {!loading && picks !== null && (
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--border)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(pickedCount / CATEGORIES.length) * 100}%`,
              backgroundColor: "var(--team-accent)",
            }}
          />
        </div>
      )}

      {/* Locked banner */}
      {isLocked && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--muted)" }}
        >
          🔒 Season predictions are locked — Race 1 has started.
        </div>
      )}

      {/* Category groups */}
      {loading || picks === null ? (
        <p className="text-center py-12" style={{ color: "var(--muted)" }}>Loading predictions…</p>
      ) : (
        <div className="flex flex-col gap-8">
          {GROUPS.map((group) => {
            const groupCats = group.keys
              .map((key) => CATEGORIES.find((c) => c.key === key))
              .filter(Boolean) as typeof CATEGORIES;

            return (
              <div key={group.label}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="inline-block w-1 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: "var(--team-accent)" }}
                  />
                  <h2
                    className="text-sm font-bold uppercase tracking-widest shrink-0"
                    style={{ color: "var(--foreground)" }}
                  >
                    {group.label}
                  </h2>
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                </div>

                <div className="flex flex-col gap-3">
                  {groupCats.map((cat) => (
                    <CategoryCard
                      key={cat.key}
                      category={cat}
                      value={picks[cat.key]}
                      isSaved={savedKey === cat.key}
                      disabled={isLocked}
                      onPick={setPick}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
