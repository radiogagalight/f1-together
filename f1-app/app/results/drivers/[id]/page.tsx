"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getDb } from "@/lib/firebase/db";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useSeasonResults } from "@/hooks/useSeasonResults";
import {
  ResultsSkeleton,
  SectionHeader,
} from "@/components/results/ChampionshipTable";
import { DRIVERS, RACES } from "@/lib/data";
import { TEAM_COLORS, hexToRgb } from "@/lib/teamColors";
import { constructorIdForDriver } from "@/lib/f1Points";

const SCORING_KEYS = [
  "qual_pole",
  "qual_p2",
  "qual_p3",
  "race_winner",
  "race_p2",
  "race_p3",
  "race_p4",
  "race_p5",
  "race_p6",
  "fastest_lap",
  "sprint_qual_pole",
  "sprint_qual_p2",
  "sprint_qual_p3",
  "sprint_winner",
  "sprint_p2",
  "sprint_p3",
] as const;

export default function ResultsDriverDetailPage() {
  const params = useParams();
  const driverId = String(params.id ?? "");
  const { user } = useAuth();
  const { data, loading, error, reload } = useSeasonResults();
  const [pickedRounds, setPickedRounds] = useState<Set<number>>(new Set());

  const driver = DRIVERS.find((d) => d.id === driverId);
  const standing = data?.driverStandings.find((s) => s.id === driverId);
  const ctorId = constructorIdForDriver(driverId);
  const accent = ctorId ? TEAM_COLORS[ctorId] ?? "#e10600" : "#e10600";

  useEffect(() => {
    if (!user || !driverId) {
      setPickedRounds(new Set());
      return;
    }
    async function load() {
      const db = getDb();
      const q = query(collection(db, "race_picks"), where("user_id", "==", user!.uid));
      const snap = await getDocs(q);
      const rounds = new Set<number>();
      for (const docSnap of snap.docs) {
        const row = docSnap.data() as Record<string, unknown>;
        const round = typeof row.round === "number" ? row.round : null;
        if (round == null) continue;
        const hit = SCORING_KEYS.some((k) => row[k] === driverId);
        if (hit) rounds.add(round);
      }
      setPickedRounds(rounds);
    }
    void load();
  }, [user, driverId]);

  const finishSeries = useMemo(() => {
    if (!standing?.finishesByRound) return [];
    return RACES.map((r) => ({
      round: r.r,
      race: r,
      finish: standing.finishesByRound?.[r.r] ?? null,
      points: standing.pointsByRound?.[r.r] ?? 0,
      hasResult: data?.completedRounds.includes(r.r) ?? false,
      youPicked: pickedRounds.has(r.r),
    }));
  }, [standing, data, pickedRounds]);

  const rank =
    data?.driverStandings.findIndex((s) => s.id === driverId) ?? -1;

  if (!driver) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-10 text-center" style={{ color: "var(--muted)" }}>
        Unknown driver.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <div className="mb-6">
        <SectionHeader label={driver.team} />
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          {driver.name}
        </h1>
        {!loading && standing && (
          <p className="text-sm mt-1 tabular-nums" style={{ color: "var(--muted)" }}>
            P{rank + 1} · {standing.points} pts · {standing.wins} wins · {standing.podiums}{" "}
            podiums · {standing.poles} poles
          </p>
        )}
      </div>

      {loading && <ResultsSkeleton />}

      {!loading && error && (
        <div className="text-center py-8">
          <p className="text-sm mb-3" style={{ color: "#ef4444" }}>Could not load driver.</p>
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

      {!loading && !error && (
        <>
          {/* Simple finish chart */}
          <section className="mb-8">
            <SectionHeader label="Finish by round" />
            <div
              className="rounded-xl px-3 py-4"
              style={{
                border: "1px solid var(--border)",
                backgroundColor: `rgba(${hexToRgb(accent)},0.06)`,
              }}
            >
              <div className="flex items-end gap-1 h-28">
                {finishSeries.map((row) => {
                  const finish = row.finish;
                  const height =
                    finish != null && finish >= 1
                      ? Math.max(8, ((21 - Math.min(finish, 20)) / 20) * 100)
                      : row.hasResult
                      ? 6
                      : 2;
                  return (
                    <div
                      key={row.round}
                      className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
                      title={
                        finish != null
                          ? `R${row.round}: P${finish}`
                          : row.hasResult
                          ? `R${row.round}: DNF / no data`
                          : `R${row.round}: —`
                      }
                    >
                      <div
                        className="w-full rounded-t transition-all duration-200"
                        style={{
                          height: `${height}%`,
                          backgroundColor: row.youPicked
                            ? accent
                            : finish != null
                            ? `rgba(${hexToRgb(accent)},0.55)`
                            : "rgba(255,255,255,0.08)",
                          outline: row.youPicked
                            ? `1px solid ${accent}`
                            : undefined,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] mt-3" style={{ color: "var(--muted)" }}>
                Taller bars are better finishes. Solid team-color bars mark rounds where you
                predicted this driver in a scoring slot.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <SectionHeader label="Round log" />
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                    <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Race
                    </th>
                    <th className="py-2 px-3 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Pos
                    </th>
                    <th className="py-2 px-3 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      Pts
                    </th>
                    <th className="py-2 px-3 text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                      You
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {finishSeries
                    .filter((r) => r.hasResult || r.finish != null || r.points > 0)
                    .map((row) => (
                      <tr key={row.round} style={{ borderTop: "1px solid var(--border)" }}>
                        <td className="py-2 px-3">
                          <Link
                            href={`/results/races/${row.round}`}
                            className="font-semibold hover:underline"
                            style={{ color: "var(--foreground)" }}
                          >
                            {row.race.flag}{" "}
                            {row.race.name.replace(" Grand Prix", " GP")}
                          </Link>
                        </td>
                        <td
                          className="py-2 px-3 text-right tabular-nums font-bold"
                          style={{ color: "var(--foreground)" }}
                        >
                          {row.finish != null ? `P${row.finish}` : "—"}
                        </td>
                        <td
                          className="py-2 px-3 text-right tabular-nums"
                          style={{ color: "var(--muted)" }}
                        >
                          {row.points}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.youPicked ? (
                            <span className="text-xs font-bold" style={{ color: accent }}>
                              ✓
                            </span>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>·</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {finishSeries.every((r) => !r.hasResult && r.finish == null) && (
                <p className="px-3 py-4 text-sm" style={{ color: "var(--muted)" }}>
                  No completed rounds for this driver yet.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
