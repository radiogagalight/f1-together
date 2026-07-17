"use client";

import Link from "next/link";
import { RACES } from "@/lib/data";
import { useSeasonResults } from "@/hooks/useSeasonResults";
import {
  ResultsEmptyState,
  ResultsSkeleton,
  SectionHeader,
} from "@/components/results/ChampionshipTable";

export default function ResultsRacesPage() {
  const { data, loading, error, reload } = useSeasonResults();

  const classByRound = new Map<number, { race?: boolean; sprint?: boolean; incomplete: boolean }>();
  if (data) {
    for (const c of data.classifications) {
      const prev = classByRound.get(c.round) ?? { incomplete: false };
      if (c.session === "race") prev.race = true;
      if (c.session === "sprint") prev.sprint = true;
      prev.incomplete = prev.incomplete || c.incomplete;
      classByRound.set(c.round, prev);
    }
    for (const r of data.raceResults) {
      if (!classByRound.has(r.round) && r.raceWinner) {
        classByRound.set(r.round, { race: true, incomplete: true });
      }
    }
  }

  const hasAny = classByRound.size > 0;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <div className="mb-6">
        <SectionHeader label="By race" />
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Race results
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Classifications and how your picks compared
        </p>
      </div>

      {loading && <ResultsSkeleton />}

      {!loading && error && (
        <div className="text-center py-8">
          <p className="text-sm mb-3" style={{ color: "#ef4444" }}>Could not load races.</p>
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

      {!loading && !error && !hasAny && <ResultsEmptyState />}

      {!loading && !error && (
        <ul className="flex flex-col gap-1">
          {RACES.map((race) => {
            const meta = classByRound.get(race.r);
            const hasResult = Boolean(meta);
            const isPast = new Date(race.startUtc).getTime() < Date.now();

            const content = (
              <div
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                style={{
                  backgroundColor: hasResult ? "rgba(255,255,255,0.04)" : "transparent",
                  opacity: !hasResult && !isPast ? 0.55 : 1,
                  border: "1px solid var(--border)",
                }}
              >
                <span className="text-lg shrink-0">{race.flag}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--foreground)" }}
                  >
                    R{race.r} · {race.name.replace(" Grand Prix", " GP")}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                    {race.circuit}
                    {race.sprint ? " · Sprint" : ""}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {meta?.incomplete && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: "rgba(245,158,11,0.15)",
                        color: "#f59e0b",
                      }}
                    >
                      Partial
                    </span>
                  )}
                  {hasResult ? (
                    <span className="text-xs font-semibold" style={{ color: "var(--f1-red)" }}>
                      View →
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>
                      {isPast ? "Pending" : "Upcoming"}
                    </span>
                  )}
                </div>
              </div>
            );

            return (
              <li key={race.r}>
                {hasResult ? (
                  <Link href={`/results/races/${race.r}`}>{content}</Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
