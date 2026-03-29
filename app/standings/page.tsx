"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildLeaderboard } from "@/lib/scoring";
import { RACES, DRIVERS } from "@/lib/data";
import { TEAM_COLORS, hexToRgb } from "@/lib/teamColors";
import { PICK_POINTS } from "@/lib/scoring";
import type { RaceResult, RacePrediction, LeaderboardEntry, ScoreBreakdown } from "@/lib/types";

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;

function Avatar({
  displayName,
  accent,
}: {
  displayName: string | null;
  accent: string;
}) {
  const rgb = hexToRgb(accent);
  return (
    <div
      className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
      style={{ backgroundColor: `rgba(${rgb},0.2)`, color: accent }}
    >
      {(displayName?.trim() || "?")[0].toUpperCase()}
    </div>
  );
}

function MedalBadge({ position }: { position: number }) {
  if (position > 3) {
    return (
      <span
        className="w-7 h-7 shrink-0 flex items-center justify-center text-sm font-bold rounded-full"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--muted)" }}
      >
        {position}
      </span>
    );
  }
  const color = MEDAL_COLORS[position - 1];
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <span
      className="w-7 h-7 shrink-0 flex items-center justify-center text-lg rounded-full"
      style={{ backgroundColor: `${color}22` }}
      title={`#${position}`}
    >
      {medals[position - 1]}
    </span>
  );
}

const QUAL_ROWS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "qualPole", label: "Pole" },
  { key: "qualP2",   label: "Qual P2" },
  { key: "qualP3",   label: "Qual P3" },
];
const RACE_ROWS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "raceWinner", label: "Race Win" },
  { key: "raceP2",     label: "Race P2" },
  { key: "raceP3",     label: "Race P3" },
  { key: "fastestLap", label: "Fastest Lap" },
  { key: "safetyCar",  label: "Safety Car" },
];
const SPRINT_QUAL_ROWS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "sprintQualPole", label: "Sprint Pole" },
  { key: "sprintQualP2",  label: "Sprint Q P2" },
  { key: "sprintQualP3",  label: "Sprint Q P3" },
];
const SPRINT_RACE_ROWS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "sprintWinner", label: "Sprint Win" },
  { key: "sprintP2",     label: "Sprint P2" },
  { key: "sprintP3",     label: "Sprint P3" },
];

function RoundBreakdown({ breakdown, accent }: { breakdown: ScoreBreakdown; accent: string }) {
  const sprintTotal = SPRINT_QUAL_ROWS.concat(SPRINT_RACE_ROWS).reduce((s, r) => s + breakdown[r.key], 0);
  const hasSprint = sprintTotal > 0;

  function Row({ rows, heading }: { rows: typeof QUAL_ROWS; heading: string }) {
    return (
      <>
        <p className="text-[10px] font-bold uppercase tracking-widest col-span-2 mt-2 first:mt-0" style={{ color: "rgba(255,255,255,0.35)" }}>
          {heading}
        </p>
        {rows.map(({ key, label }) => {
          const pts = breakdown[key];
          const max = PICK_POINTS[key];
          const scored = pts > 0;
          return (
            <div key={key} className="flex items-center justify-between col-span-2 py-0.5">
              <span className="text-xs" style={{ color: scored ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.3)" }}>
                {label}
              </span>
              <span className="text-xs font-bold tabular-nums" style={{ color: scored ? accent : "rgba(255,255,255,0.2)" }}>
                {scored ? `+${pts}` : `0 / ${max}`}
              </span>
            </div>
          );
        })}
      </>
    );
  }

  return (
    <div className="mt-2 px-3 py-2 rounded-xl grid grid-cols-2 gap-x-4"
      style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="col-span-2">
        <Row rows={QUAL_ROWS} heading="Qualifying" />
        <Row rows={RACE_ROWS} heading="Race" />
        {hasSprint && <Row rows={SPRINT_QUAL_ROWS} heading="Sprint Qualifying" />}
        {hasSprint && <Row rows={SPRINT_RACE_ROWS} heading="Sprint Race" />}
      </div>
    </div>
  );
}

type RawPick = { userId: string; round: number; pick: RacePrediction };
type ProfileRow = { id: string; display_name: string | null; fav_team_1: string | null };

function driverLastName(id: string | null): string {
  if (!id) return "—";
  return DRIVERS.find((d) => d.id === id)?.name.split(" ").pop() ?? id;
}
function driverTeamColor(id: string | null): string | null {
  if (!id) return null;
  const d = DRIVERS.find((d) => d.id === id);
  return d ? (TEAM_COLORS[d.team.toLowerCase().replace(/\s+/g, "-")] ?? null) : null;
}

export default function StandingsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rawPredictions, setRawPredictions] = useState<RawPick[]>([]);
  const [rawResults, setRawResults] = useState<RaceResult[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [expandedRound, setExpandedRound] = useState<Record<string, number | null>>({});
  const [predRound, setPredRound] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setError(false);
      const [
        { data: results },
        { data: predictions, error: e2 },
        { data: profiles, error: e3 },
        { data: wildcards },
        { data: wcPredictions },
      ] = await Promise.all([
        supabase.from("race_results").select("*"),
        supabase.from("race_picks").select("user_id,round,qual_pole,qual_p2,qual_p3,race_winner,race_p2,race_p3,race_p4,race_p5,race_p6,fastest_lap,safety_car,boosted_picks,sprint_qual_pole,sprint_qual_p2,sprint_qual_p3,sprint_winner,sprint_p2,sprint_p3"),
        supabase.from("profiles").select("id,display_name,fav_team_1"),
        supabase.from("race_wildcards").select("id,round,question,question_type,options,points,correct_answer,display_order"),
        supabase.from("wildcard_picks").select("user_id,wildcard_id,pick_value,boosted"),
      ]);

      // Only treat predictions/profiles failures as a real error; missing results table = empty state
      if (e2 || e3) { setError(true); setLoading(false); return; }

      const allResults: RaceResult[] = (results ?? []).map((row) => ({
        round:              row.round,
        qualPole:           row.qual_pole           ?? null,
        qualP2:             row.qual_p2             ?? null,
        qualP3:             row.qual_p3             ?? null,
        raceWinner:         row.race_winner         ?? null,
        raceP2:             row.race_p2             ?? null,
        raceP3:             row.race_p3             ?? null,
        raceP4:             row.race_p4             ?? null,
        raceP5:             row.race_p5             ?? null,
        raceP6:             row.race_p6             ?? null,
        fastestLap:         row.fastest_lap         ?? null,
        safetyCar:          row.safety_car          ?? null,
        sprintQualPole:     row.sprint_qual_pole    ?? null,
        sprintQualP2:       row.sprint_qual_p2      ?? null,
        sprintQualP3:       row.sprint_qual_p3      ?? null,
        sprintWinner:       row.sprint_winner       ?? null,
        sprintP2:           row.sprint_p2           ?? null,
        sprintP3:           row.sprint_p3           ?? null,
        fetchedAt:          row.fetched_at          ?? null,
        manuallyOverridden: row.manually_overridden ?? false,
        updatedAt:          row.updated_at,
      }));

      const allPredictions = (predictions ?? []).map((row) => ({
        userId: row.user_id,
        round: row.round,
        pick: {
          qualPole:     row.qual_pole       ?? null,
          qualP2:       row.qual_p2         ?? null,
          qualP3:       row.qual_p3         ?? null,
          raceWinner:   row.race_winner     ?? null,
          raceP2:       row.race_p2         ?? null,
          raceP3:       row.race_p3         ?? null,
          raceP4:       row.race_p4         ?? null,
          raceP5:       row.race_p5         ?? null,
          raceP6:       row.race_p6         ?? null,
          fastestLap:   row.fastest_lap     ?? null,
          safetyCar:    row.safety_car      ?? null,
          boostedPredictions: row.boosted_picks   ?? [],
          sprintQualPole: row.sprint_qual_pole ?? null,
          sprintQualP2:   row.sprint_qual_p2   ?? null,
          sprintQualP3:   row.sprint_qual_p3   ?? null,
          sprintWinner:   row.sprint_winner    ?? null,
          sprintP2:       row.sprint_p2        ?? null,
          sprintP3:       row.sprint_p3        ?? null,
        } as RacePrediction,
      }));

      const allWildcards = (wildcards ?? []).map((row) => ({
        id:            row.id as string,
        round:         row.round as number,
        question:      row.question as string,
        questionType:  row.question_type as import("@/lib/types").WildcardQuestionType,
        options:       (row.options as { id: string; name: string }[] | null) ?? null,
        points:        row.points as number,
        correctAnswer: (row.correct_answer as string | null) ?? null,
        displayOrder:  row.display_order as number,
      }));
      const allWildcardPredictions = (wcPredictions ?? []).map((row) => ({
        userId:     row.user_id as string,
        wildcardId: row.wildcard_id as string,
        pickValue:  row.pick_value as string,
        boosted:    row.boosted as boolean,
      }));

      const lb = buildLeaderboard(allPredictions, allResults, profiles ?? [], allWildcards, allWildcardPredictions);
      setLeaderboard(lb);
      setRawPredictions(allPredictions);
      setRawResults(allResults);
      setProfiles(profiles ?? []);

      // Default predRound to the most recent revealed round (weekendStartUtc < now)
      const now = Date.now();
      const revealedRaces = RACES.filter((r) => r.weekendStartUtc && new Date(r.weekendStartUtc).getTime() < now);
      if (revealedRaces.length > 0) {
        setPredRound(revealedRaces[revealedRaces.length - 1].r);
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasResults = leaderboard.some((e) => e.roundsScored > 0);

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto px-4 pt-5 pb-28 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block h-1 w-8 rounded-full"
            style={{ backgroundColor: "var(--f1-red)" }}
          />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            2026 Season
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Standings
        </h1>
      </div>

      {loading && (
        <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>
          Loading standings…
        </p>
      )}

      {error && (
        <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>
          Couldn&apos;t load standings. Check your connection and try again.
        </p>
      )}

      {!loading && !error && !hasResults && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            border: "1px solid rgba(225,6,0,0.25)",
            backgroundColor: "rgba(225,6,0,0.06)",
          }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>
            No results yet
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No results have been entered yet. Check back after the first race!
          </p>
        </div>
      )}

      {!loading && !error && hasResults && (
        <>
        <div className="flex flex-col gap-3">
          {leaderboard.map((entry, i) => {
            const accent = entry.favTeam1
              ? TEAM_COLORS[entry.favTeam1] ?? "#888888"
              : "#888888";
            const rgb = hexToRgb(accent);
            const position = i + 1;
            const isExpanded = expandedUser === entry.userId;

            // Rounds that have results
            const scoredRounds = RACES.filter((r) => entry.scoresByRound[r.r] !== undefined);

            return (
              <div key={entry.userId}>
                <button
                  onClick={() => setExpandedUser(isExpanded ? null : entry.userId)}
                  className="w-full text-left rounded-2xl p-4 transition-all"
                  style={{
                    background: `linear-gradient(135deg, rgba(${rgb},0.1) 0%, rgba(8,8,16,0.7) 100%)`,
                    border: `1px solid rgba(${rgb},0.25)`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <MedalBadge position={position} />
                    <Avatar displayName={entry.displayName} accent={accent} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                        {entry.displayName ?? "Anonymous"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {entry.roundsScored} race{entry.roundsScored !== 1 ? "s" : ""} scored
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black" style={{ color: accent }}>
                        {entry.totalPoints}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>pts</p>
                    </div>
                    <span className="text-xs ml-1" style={{ color: "var(--muted)" }}>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Expanded round breakdown */}
                {isExpanded && (
                  <div
                    className="mt-1 rounded-2xl p-4"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {scoredRounds.length === 0 ? (
                      <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
                        No scored rounds yet.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          {scoredRounds.map((race) => {
                            const pts = entry.scoresByRound[race.r] ?? 0;
                            const isRoundOpen = expandedRound[entry.userId] === race.r;
                            return (
                              <button
                                key={race.r}
                                onClick={() => setExpandedRound((prev) => ({
                                  ...prev,
                                  [entry.userId]: isRoundOpen ? null : race.r,
                                }))}
                                className="flex flex-col items-center px-3 py-2 rounded-xl transition-all"
                                style={{
                                  backgroundColor: isRoundOpen ? `rgba(${rgb},0.15)` : "rgba(255,255,255,0.05)",
                                  border: isRoundOpen ? `1px solid rgba(${rgb},0.4)` : "1px solid rgba(255,255,255,0.1)",
                                  minWidth: "56px",
                                }}
                              >
                                <span className="text-xs font-bold" style={{ color: accent }}>
                                  {pts}
                                </span>
                                <span className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                                  R{race.r}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {expandedRound[entry.userId] != null && (() => {
                          const bd = entry.breakdownsByRound[expandedRound[entry.userId]!];
                          const race = RACES.find((r) => r.r === expandedRound[entry.userId]);
                          return bd ? (
                            <div>
                              <p className="text-[10px] font-semibold mb-1" style={{ color: "var(--muted)" }}>
                                {race?.name ?? `Round ${expandedRound[entry.userId]}`}
                              </p>
                              <RoundBreakdown breakdown={bd} accent={accent} />
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Predictions ── */}
        {(() => {
          const now = Date.now();
          const revealedRaces = RACES.filter((r) => r.weekendStartUtc && new Date(r.weekendStartUtc).getTime() < now);
          if (revealedRaces.length === 0) return null;

          const selectedRace = revealedRaces.find((r) => r.r === predRound) ?? revealedRaces[revealedRaces.length - 1];
          const roundPredictions = rawPredictions.filter((p) => p.round === selectedRace.r);
          const roundResult = rawResults.find((r) => r.round === selectedRace.r) ?? null;
          const profileMap = new Map(profiles.map((p) => [p.id, p]));

          type PredRow = { key: keyof RacePrediction; label: string; isBool?: boolean };
          type PredGroup = { label: string; rows: PredRow[] };
          const PRED_GROUPS: PredGroup[] = [
            ...(selectedRace.sprint ? [
              { label: "Sprint Qualifying", rows: [
                { key: "sprintQualPole" as keyof RacePrediction, label: "Pole" },
                { key: "sprintQualP2"  as keyof RacePrediction, label: "P2"   },
                { key: "sprintQualP3"  as keyof RacePrediction, label: "P3"   },
              ]},
              { label: "Sprint Race", rows: [
                { key: "sprintWinner" as keyof RacePrediction, label: "Winner" },
                { key: "sprintP2"    as keyof RacePrediction, label: "P2"     },
                { key: "sprintP3"    as keyof RacePrediction, label: "P3"     },
              ]},
            ] : []),
            { label: "Qualifying", rows: [
              { key: "qualPole" as keyof RacePrediction, label: "Pole" },
              { key: "qualP2"   as keyof RacePrediction, label: "P2"   },
              { key: "qualP3"   as keyof RacePrediction, label: "P3"   },
            ]},
            { label: "Race", rows: [
              { key: "raceWinner" as keyof RacePrediction, label: "Winner"     },
              { key: "raceP2"     as keyof RacePrediction, label: "P2"         },
              { key: "raceP3"     as keyof RacePrediction, label: "P3"         },
              { key: "raceP4"     as keyof RacePrediction, label: "P4"         },
              { key: "raceP5"     as keyof RacePrediction, label: "P5"         },
              { key: "raceP6"     as keyof RacePrediction, label: "P6"         },
              { key: "fastestLap" as keyof RacePrediction, label: "Fastest Lap"},
              { key: "safetyCar"  as keyof RacePrediction, label: "Safety Car", isBool: true },
            ]},
          ];

          const QUAL_FIELDS = new Set(["qualPole", "qualP2", "qualP3"]);

          function predictionStatus(key: keyof RacePrediction, predictionVal: string | boolean | null | string[]) {
            if (Array.isArray(predictionVal)) return undefined;
            const resultVal = roundResult?.[key as keyof RaceResult] as string | boolean | null | undefined;
            if (resultVal == null || predictionVal == null) return undefined;
            if (predictionVal === resultVal) return "correct";
            if (QUAL_FIELDS.has(key)) {
              const qualVals = [roundResult?.qualPole, roundResult?.qualP2, roundResult?.qualP3];
              if (typeof predictionVal === "string" && qualVals.includes(predictionVal)) return "partial";
            }
            return "wrong";
          }

          return (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block h-1 w-8 rounded-full" style={{ backgroundColor: "var(--f1-red)" }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  Predictions
                </span>
              </div>
              <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
                What everyone picked
              </h2>

              {/* Round tabs */}
              <div className="flex gap-2 flex-wrap mb-5">
                {revealedRaces.map((r) => {
                  const isActive = r.r === selectedRace.r;
                  return (
                    <button
                      key={r.r}
                      onClick={() => setPredRound(r.r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                      style={{
                        backgroundColor: isActive ? "rgba(225,6,0,0.15)" : "rgba(255,255,255,0.06)",
                        border: isActive ? "1px solid rgba(225,6,0,0.5)" : "1px solid rgba(255,255,255,0.1)",
                        color: isActive ? "var(--f1-red)" : "var(--muted)",
                      }}
                    >
                      <span>{r.flag}</span>
                      <span>{r.name.replace(" Grand Prix", " GP")}</span>
                    </button>
                  );
                })}
              </div>

              {roundPredictions.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>
                  No predictions recorded for this race.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {roundPredictions.map(({ userId, pick }) => {
                    const profile = profileMap.get(userId);
                    const accent = profile?.fav_team_1
                      ? (TEAM_COLORS[profile.fav_team_1] ?? "#888888")
                      : "#888888";
                    const rgb = hexToRgb(accent);
                    return (
                      <div
                        key={userId}
                        className="rounded-xl p-4"
                        style={{
                          backgroundColor: `rgba(${rgb},0.06)`,
                          border: `1px solid rgba(${rgb},0.2)`,
                        }}
                      >
                        <p className="text-sm font-bold mb-3" style={{ color: accent }}>
                          {profile?.display_name ?? "Unknown"}
                        </p>
                        <div className="flex flex-col gap-3">
                          {PRED_GROUPS.map((group) => (
                            <div key={group.label}>
                              <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                                {group.label}
                              </p>
                              <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
                                {group.rows.map(({ key, label, isBool }) => {
                                  const val = pick[key];
                                  let displayVal: string | null = null;
                                  let displayColor = "var(--foreground)";

                                  if (isBool) {
                                    if (val === true) { displayVal = "Yes"; displayColor = "#22c55e"; }
                                    else if (val === false) { displayVal = "No"; displayColor = "#ef4444"; }
                                  } else if (typeof val === "string") {
                                    displayVal = driverLastName(val);
                                    displayColor = driverTeamColor(val) ?? "var(--foreground)";
                                  }

                                  const boosted = (pick.boostedPredictions ?? []).includes(key as string);
                                  const status = predictionStatus(key, val as string | boolean | null);
                                  const dotColor = status === "correct" ? "#22c55e"
                                    : status === "partial" ? "#f59e0b"
                                    : status === "wrong" ? "#ef4444"
                                    : null;

                                  return (
                                    <div key={key} className="flex items-center gap-1 min-w-0">
                                      <span className="text-xs shrink-0" style={{ color: "var(--muted)", minWidth: "44px" }}>
                                        {label}
                                      </span>
                                      {dotColor ? (
                                        <span style={{ color: dotColor, fontSize: "10px", flexShrink: 0 }}>
                                          {status === "correct" ? "✓" : status === "partial" ? "~" : "✗"}
                                        </span>
                                      ) : boosted ? (
                                        <span style={{ color: "#ffc800", fontSize: "10px", flexShrink: 0 }}>⚡</span>
                                      ) : null}
                                      <span className="text-xs font-semibold truncate" style={{ color: displayVal ? displayColor : "rgba(255,255,255,0.2)" }}>
                                        {displayVal ?? "—"}
                                        {boosted && dotColor ? " ⚡" : ""}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
        </>
      )}
    </div>
  );
}
