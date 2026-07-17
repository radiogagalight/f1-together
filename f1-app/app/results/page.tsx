"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDb } from "@/lib/firebase/db";
import { loadPredictions } from "@/lib/storage";
import { useSeasonResults } from "@/hooks/useSeasonResults";
import {
  ChampionshipTable,
  ResultsEmptyState,
  ResultsSkeleton,
  SectionHeader,
} from "@/components/results/ChampionshipTable";
import { CONSTRUCTORS, DRIVERS } from "@/lib/data";
import type { SeasonPredictions } from "@/lib/types";

function nameForPick(id: string | null, type: "driver" | "constructor"): string {
  if (!id) return "—";
  if (type === "driver") return DRIVERS.find((d) => d.id === id)?.name ?? id;
  return CONSTRUCTORS.find((c) => c.id === id)?.name ?? id;
}

export default function ResultsSeasonPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useSeasonResults();
  const [seasonPicks, setSeasonPicks] = useState<SeasonPredictions | null>(null);

  useEffect(() => {
    if (!user) {
      setSeasonPicks(null);
      return;
    }
    loadPredictions(user.uid, getDb()).then(setSeasonPicks);
  }, [user]);

  const hasResults =
    (data?.completedRounds.length ?? 0) > 0 ||
    (data?.raceResults.length ?? 0) > 0;

  const leaderDriver = data?.driverStandings[0]?.id ?? null;
  const leaderCtor = data?.constructorStandings[0]?.id ?? null;
  const mostWins = data
    ? [...data.driverStandings].sort((a, b) => b.wins - a.wins)[0]
    : undefined;
  const mostPoles = data
    ? [...data.driverStandings].sort((a, b) => b.poles - a.poles)[0]
    : undefined;
  const mostPodiums = data
    ? [...data.driverStandings].sort((a, b) => b.podiums - a.podiums)[0]
    : undefined;

  const pickRows: {
    label: string;
    yours: string;
    current: string;
    alive: boolean | null;
  }[] = seasonPicks
    ? [
        {
          label: "WDC Winner",
          yours: nameForPick(seasonPicks.wdcWinner, "driver"),
          current: nameForPick(leaderDriver, "driver"),
          alive: seasonPicks.wdcWinner
            ? seasonPicks.wdcWinner === leaderDriver
            : null,
        },
        {
          label: "WCC Winner",
          yours: nameForPick(seasonPicks.wccWinner, "constructor"),
          current: nameForPick(leaderCtor, "constructor"),
          alive: seasonPicks.wccWinner
            ? seasonPicks.wccWinner === leaderCtor
            : null,
        },
        {
          label: "Most Wins",
          yours: nameForPick(seasonPicks.mostWins, "driver"),
          current: mostWins?.name ?? "—",
          alive: seasonPicks.mostWins
            ? seasonPicks.mostWins === mostWins?.id
            : null,
        },
        {
          label: "Most Poles",
          yours: nameForPick(seasonPicks.mostPoles, "driver"),
          current: mostPoles?.name ?? "—",
          alive: seasonPicks.mostPoles
            ? seasonPicks.mostPoles === mostPoles?.id
            : null,
        },
        {
          label: "Most Podiums",
          yours: nameForPick(seasonPicks.mostPodiums, "driver"),
          current: mostPodiums?.name ?? "—",
          alive: seasonPicks.mostPodiums
            ? seasonPicks.mostPodiums === mostPodiums?.id
            : null,
        },
      ]
    : [];

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-28">
      <div className="mb-6">
        <SectionHeader label="2026 Championship" />
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Season results
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Official points so far
          {hasResults && data
            ? ` · ${data.completedRounds.length} round${data.completedRounds.length === 1 ? "" : "s"}`
            : ""}
        </p>
      </div>

      {loading && <ResultsSkeleton />}

      {!loading && error && (
        <div className="text-center py-8">
          <p className="text-sm mb-3" style={{ color: "#ef4444" }}>
            Could not load season results.
          </p>
          <button
            type="button"
            onClick={() => void reload()}
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{
              backgroundColor: "rgba(225,6,0,0.15)",
              color: "var(--f1-red)",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && !hasResults && <ResultsEmptyState />}

      {!loading && !error && hasResults && data && (
        <>
          <ChampionshipTable
            title="Drivers' Championship"
            standings={data.driverStandings}
            hrefForRow={(s) => `/results/drivers/${s.id}`}
            highlightId={seasonPicks?.wdcWinner}
          />
          <ChampionshipTable
            title="Constructors' Championship"
            standings={data.constructorStandings}
            highlightId={seasonPicks?.wccWinner}
          />

          {pickRows.length > 0 && (
            <section className="mb-8">
              <SectionHeader label="Your season picks" />
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                      <th
                        className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--muted)" }}
                      >
                        Category
                      </th>
                      <th
                        className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--muted)" }}
                      >
                        Your pick
                      </th>
                      <th
                        className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--muted)" }}
                      >
                        Current lead
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickRows.map((row) => (
                      <tr key={row.label} style={{ borderTop: "1px solid var(--border)" }}>
                        <td
                          className="py-2.5 px-3 text-xs font-semibold"
                          style={{ color: "var(--muted)" }}
                        >
                          {row.label}
                        </td>
                        <td
                          className="py-2.5 px-3 font-semibold"
                          style={{
                            color:
                              row.alive === true
                                ? "#22c55e"
                                : row.alive === false
                                ? "#f59e0b"
                                : "var(--foreground)",
                          }}
                        >
                          {row.yours}
                        </td>
                        <td
                          className="py-2.5 px-3"
                          style={{ color: "var(--foreground)" }}
                        >
                          {row.current}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] mt-2" style={{ color: "var(--muted)" }}>
                Green means your pick currently leads that category. Amber means someone else leads.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
