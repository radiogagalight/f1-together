"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getDb } from "@/lib/firebase/db";
import { loadRacePick } from "@/lib/raceStorage";
import { useSeasonResults } from "@/hooks/useSeasonResults";
import {
  ResultsSkeleton,
  SectionHeader,
} from "@/components/results/ChampionshipTable";
import { DRIVERS, RACES } from "@/lib/data";
import { TEAM_COLORS } from "@/lib/teamColors";
import { getPickResultStatus, PICK_POINTS, scoreRound } from "@/lib/scoring";
import { constructorIdForDriver } from "@/lib/f1Points";
import type {
  ClassificationEntry,
  RaceClassification,
  RacePrediction,
  RaceResult,
  ScoreBreakdown,
} from "@/lib/types";

function driverName(id: string): string {
  return DRIVERS.find((d) => d.id === id)?.name ?? id;
}

function shortName(id: string | null): string {
  if (!id) return "—";
  return DRIVERS.find((d) => d.id === id)?.name.split(" ").pop() ?? id;
}

function statusColor(status: ReturnType<typeof getPickResultStatus>): string {
  if (status === "correct") return "#22c55e";
  if (status === "partial") return "#f59e0b";
  if (status === "wrong") return "#ef4444";
  return "var(--muted)";
}

const PICK_ROWS: { key: keyof ScoreBreakdown; label: string; resultKey: keyof RaceResult }[] = [
  { key: "qualPole", label: "Pole", resultKey: "qualPole" },
  { key: "qualP2", label: "Qual P2", resultKey: "qualP2" },
  { key: "qualP3", label: "Qual P3", resultKey: "qualP3" },
  { key: "raceWinner", label: "Race Win", resultKey: "raceWinner" },
  { key: "raceP2", label: "Race P2", resultKey: "raceP2" },
  { key: "raceP3", label: "Race P3", resultKey: "raceP3" },
  { key: "raceP4", label: "Race P4", resultKey: "raceP4" },
  { key: "raceP5", label: "Race P5", resultKey: "raceP5" },
  { key: "raceP6", label: "Race P6", resultKey: "raceP6" },
  { key: "fastestLap", label: "Fastest Lap", resultKey: "fastestLap" },
  { key: "safetyCar", label: "Safety Car", resultKey: "safetyCar" },
];

const SPRINT_PICK_ROWS: { key: keyof ScoreBreakdown; label: string; resultKey: keyof RaceResult }[] = [
  { key: "sprintQualPole", label: "Sprint Pole", resultKey: "sprintQualPole" },
  { key: "sprintQualP2", label: "Sprint Q P2", resultKey: "sprintQualP2" },
  { key: "sprintQualP3", label: "Sprint Q P3", resultKey: "sprintQualP3" },
  { key: "sprintWinner", label: "Sprint Win", resultKey: "sprintWinner" },
  { key: "sprintP2", label: "Sprint P2", resultKey: "sprintP2" },
  { key: "sprintP3", label: "Sprint P3", resultKey: "sprintP3" },
];

function ClassificationList({
  title,
  clas,
}: {
  title: string;
  clas: RaceClassification | undefined;
}) {
  if (!clas || clas.entries.length === 0) {
    return (
      <section className="mb-6">
        <SectionHeader label={title} />
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          No classification stored for this session.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <SectionHeader label={title} />
        {clas.incomplete && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0"
            style={{ backgroundColor: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
          >
            Partial
          </span>
        )}
      </div>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
              <th
                className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Pos
              </th>
              <th
                className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Driver
              </th>
              <th
                className="py-2 px-3 text-right text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Pts
              </th>
            </tr>
          </thead>
          <tbody>
            {clas.entries.map((entry: ClassificationEntry) => {
              const ctor = constructorIdForDriver(entry.driverId);
              const accent = ctor ? TEAM_COLORS[ctor] : "var(--muted)";
              return (
                <tr key={`${entry.position}-${entry.driverId}`} style={{ borderTop: "1px solid var(--border)" }}>
                  <td
                    className="py-2 px-3 font-bold tabular-nums"
                    style={{ color: entry.position <= 3 ? accent : "var(--muted)" }}
                  >
                    {entry.position}
                  </td>
                  <td className="py-2 px-3">
                    <Link
                      href={`/results/drivers/${entry.driverId}`}
                      className="font-semibold hover:underline"
                      style={{ color: "var(--foreground)" }}
                    >
                      {driverName(entry.driverId)}
                    </Link>
                  </td>
                  <td
                    className="py-2 px-3 text-right tabular-nums font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {entry.pointsAwarded}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ResultsRaceDetailPage() {
  const params = useParams();
  const round = parseInt(String(params.round), 10);
  const { user } = useAuth();
  const { data, loading, error, reload } = useSeasonResults();
  const [pick, setPick] = useState<RacePrediction | null>(null);

  const race = RACES.find((r) => r.r === round);

  useEffect(() => {
    if (!user || !Number.isFinite(round)) {
      setPick(null);
      return;
    }
    loadRacePick(user.uid, round, getDb()).then(setPick);
  }, [user, round]);

  const raceClas = data?.classifications.find(
    (c) => c.round === round && c.session === "race"
  );
  const sprintClas = data?.classifications.find(
    (c) => c.round === round && c.session === "sprint"
  );
  const result = data?.raceResults.find((r) => r.round === round) ?? null;

  const score = useMemo(() => {
    if (!user || !pick || !result) return null;
    return scoreRound(user.uid, pick, result);
  }, [user, pick, result]);

  if (!race) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-10 text-center" style={{ color: "var(--muted)" }}>
        Unknown round.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6">
      <div className="mb-6">
        <SectionHeader label={`Round ${round}`} />
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          {race.flag} {race.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          {race.circuit}
          {race.sprint ? " · Sprint weekend" : ""}
        </p>
      </div>

      {loading && <ResultsSkeleton />}

      {!loading && error && (
        <div className="text-center py-8">
          <p className="text-sm mb-3" style={{ color: "#ef4444" }}>Could not load result.</p>
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
        <div className="md:grid md:grid-cols-2 md:gap-8">
          <div>
            <ClassificationList title="Race classification" clas={raceClas} />
            {race.sprint && (
              <ClassificationList title="Sprint classification" clas={sprintClas} />
            )}
          </div>

          <div>
            <SectionHeader label="Your picks" />
            {!result ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Prediction-shaped results are not logged for this round yet.
              </p>
            ) : !pick || !user ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Sign in to compare your picks.
              </p>
            ) : (
              <>
                {score && (
                  <p className="text-sm font-bold mb-3 tabular-nums" style={{ color: "var(--team-accent)" }}>
                    +{score.totalPoints} league pts this weekend
                  </p>
                )}
                <div
                  className="rounded-xl overflow-hidden mb-6"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                        <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Slot
                        </th>
                        <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          You
                        </th>
                        <th className="py-2 px-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Actual
                        </th>
                        <th className="py-2 px-3 text-right text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Pts
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...PICK_ROWS, ...(race.sprint ? SPRINT_PICK_ROWS : [])].map(
                        ({ key, label, resultKey }) => {
                          const pickVal = pick[key as keyof RacePrediction];
                          const resultVal = result[resultKey];
                          if (
                            (pickVal === null || pickVal === undefined) &&
                            (resultVal === null || resultVal === undefined)
                          ) {
                            return null;
                          }
                          const status = getPickResultStatus(
                            key as keyof RacePrediction,
                            pickVal as string | boolean | null,
                            result
                          );
                          const pts = score?.breakdown[key] ?? 0;
                          const max = PICK_POINTS[key];
                          return (
                            <tr key={key} style={{ borderTop: "1px solid var(--border)" }}>
                              <td className="py-2 px-3 text-xs" style={{ color: "var(--muted)" }}>
                                {label}
                              </td>
                              <td
                                className="py-2 px-3 font-semibold"
                                style={{ color: statusColor(status) }}
                              >
                                {typeof pickVal === "boolean"
                                  ? pickVal
                                    ? "Yes"
                                    : "No"
                                  : shortName(pickVal as string | null)}
                              </td>
                              <td className="py-2 px-3" style={{ color: "var(--foreground)" }}>
                                {typeof resultVal === "boolean"
                                  ? resultVal
                                    ? "Yes"
                                    : "No"
                                  : shortName(resultVal as string | null)}
                              </td>
                              <td
                                className="py-2 px-3 text-right tabular-nums text-xs font-bold"
                                style={{ color: pts > 0 ? "var(--team-accent)" : "var(--muted)" }}
                              >
                                {pts > 0 ? `+${pts}` : `0/${max}`}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
