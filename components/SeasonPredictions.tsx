"use client";

import { useAuth } from "@/components/AuthProvider";
import { useSeasonPicks } from "@/hooks/useSeasonPicks";
import CategoryCard from "./CategoryCard";
import { CATEGORIES } from "@/lib/data";

export default function SeasonPredictions() {
  const { user } = useAuth();
  const { picks, setPick, savedKey, loading } = useSeasonPicks(user?.id);

  const pickedCount = picks
    ? Object.values(picks).filter((v) => v !== null).length
    : 0;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block h-1 w-8 rounded-full"
            style={{ backgroundColor: "var(--f1-red)" }}
          />
          <span className="text-xs font-bold uppercase tracking-widest text-muted">
            2026 Season
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Predictions</h1>
        <p className="mt-1 text-sm text-muted">
          {loading || picks === null
            ? "Loading…"
            : `${pickedCount} of ${CATEGORIES.length} picked`}
        </p>
      </div>

      {/* Progress bar */}
      {!loading && picks !== null && (
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(pickedCount / CATEGORIES.length) * 100}%`,
              backgroundColor: "var(--f1-red)",
            }}
          />
        </div>
      )}

      {/* Category cards */}
      {loading || picks === null ? (
        <p className="text-center text-muted py-12">Loading predictions…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.key}
              category={cat}
              value={picks[cat.key]}
              isSaved={savedKey === cat.key}
              onPick={setPick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
