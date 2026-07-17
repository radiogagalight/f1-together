"use client";

import { useSeasonResults } from "@/hooks/useSeasonResults";
import {
  ChampionshipTable,
  ResultsEmptyState,
  ResultsSkeleton,
  SectionHeader,
} from "@/components/results/ChampionshipTable";

export default function ResultsDriversPage() {
  const { data, loading, error, reload } = useSeasonResults();
  const hasResults =
    (data?.completedRounds.length ?? 0) > 0 ||
    (data?.raceResults.length ?? 0) > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <div className="mb-6">
        <SectionHeader label="By driver" />
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Drivers
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Championship order · tap for season arc
        </p>
      </div>

      {loading && <ResultsSkeleton />}

      {!loading && error && (
        <div className="text-center py-8">
          <p className="text-sm mb-3" style={{ color: "#ef4444" }}>Could not load drivers.</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ backgroundColor: "rgba(225,6,0,0.15)", color: "var(--f1-red)" }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && !hasResults && <ResultsEmptyState />}

      {!loading && !error && hasResults && data && (
        <ChampionshipTable
          title="Drivers' Championship"
          standings={data.driverStandings}
          hrefForRow={(s) => `/results/drivers/${s.id}`}
        />
      )}
    </div>
  );
}
