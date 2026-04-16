"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { buildLeaderboard, getPickResultStatus, PICK_POINTS } from "@/lib/scoring";
import { RACES, DRIVERS } from "@/lib/data";
import { TEAM_COLORS, hexToRgb } from "@/lib/teamColors";
import type { RaceResult, RacePrediction, LeaderboardEntry, ScoreBreakdown, SeasonPredictions } from "@/lib/types";

const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"] as const;
const STICKY_BG = "#0f0f0f";

// ── Row definitions ──────────────────────────────────────────────────────────
const QUAL_ROWS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "qualPole", label: "Pole" }, { key: "qualP2", label: "Qual P2" }, { key: "qualP3", label: "Qual P3" },
];
const RACE_ROWS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "raceWinner", label: "Race Win" }, { key: "raceP2", label: "Race P2" }, { key: "raceP3", label: "Race P3" },
  { key: "fastestLap", label: "Fastest Lap" }, { key: "safetyCar", label: "Safety Car" },
];
const SPRINT_QUAL_ROWS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "sprintQualPole", label: "Sprint Pole" }, { key: "sprintQualP2", label: "Sprint Q P2" }, { key: "sprintQualP3", label: "Sprint Q P3" },
];
const SPRINT_RACE_ROWS: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: "sprintWinner", label: "Sprint Win" }, { key: "sprintP2", label: "Sprint P2" }, { key: "sprintP3", label: "Sprint P3" },
];
const SEASON_ROWS: { key: keyof SeasonPredictions; label: string; type: "driver" | "constructor" }[] = [
  { key: "wdcWinner",           label: "WDC Winner",        type: "driver"      },
  { key: "wccWinner",           label: "WCC Winner",        type: "constructor" },
  { key: "mostWins",            label: "Most Race Wins",    type: "driver"      },
  { key: "mostPoles",           label: "Most Poles",        type: "driver"      },
  { key: "mostPodiums",         label: "Most Podiums",      type: "driver"      },
  { key: "mostDnfsDriver",      label: "First DNF Driver",  type: "driver"      },
  { key: "mostDnfsConstructor", label: "First DNF Constr.", type: "constructor" },
];

function sumBreakdown(b: ScoreBreakdown): number {
  return Object.values(b).reduce((s, v) => s + v, 0);
}

type BreakdownRowDef = { key: keyof ScoreBreakdown; label: string };

function ScoreBreakdownSection({ breakdown, accent, rows, heading }: {
  breakdown: ScoreBreakdown | null; accent: string; rows: BreakdownRowDef[]; heading: string;
}) {
  if (!breakdown) return null;
  return (
    <>
      <p className="text-[10px] font-bold uppercase tracking-widest col-span-2 mt-2 first:mt-0"
        style={{ color: "rgba(255,255,255,0.35)" }}>
        {heading}
      </p>
      {rows.map(({ key, label }) => {
        const pts = breakdown[key]; const max = PICK_POINTS[key]; const scored = pts > 0;
        return (
          <div key={key} className="flex items-center justify-between col-span-2 py-0.5">
            <span className="text-xs" style={{ color: scored ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.3)" }}>{label}</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: scored ? accent : "rgba(255,255,255,0.2)" }}>
              {scored ? `+${pts}` : `0 / ${max}`}
            </span>
          </div>
        );
      })}
    </>
  );
}

function RoundBreakdown({ breakdown, accent, showSprintSections, wildcardPoints }: {
  breakdown: ScoreBreakdown | null; accent: string; showSprintSections: boolean; wildcardPoints: number;
}) {
  return (
    <div className="mt-2 px-3 py-2 rounded-xl grid grid-cols-2 gap-x-4"
      style={{ backgroundColor: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="col-span-2">
        {!breakdown && wildcardPoints <= 0 && (
          <p className="text-xs py-1" style={{ color: "var(--muted)" }}>Nothing scored for this round.</p>
        )}
        <ScoreBreakdownSection breakdown={breakdown} accent={accent} rows={QUAL_ROWS} heading="Qualifying" />
        <ScoreBreakdownSection breakdown={breakdown} accent={accent} rows={RACE_ROWS} heading="Race" />
        {showSprintSections && <ScoreBreakdownSection breakdown={breakdown} accent={accent} rows={SPRINT_QUAL_ROWS} heading="Sprint Qualifying" />}
        {showSprintSections && <ScoreBreakdownSection breakdown={breakdown} accent={accent} rows={SPRINT_RACE_ROWS} heading="Sprint Race" />}
        {wildcardPoints > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest col-span-2 mt-2"
              style={{ color: "rgba(255,255,255,0.35)" }}>Wildcards</p>
            <div className="flex items-center justify-between col-span-2 py-0.5">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>Bonus</span>
              <span className="text-xs font-bold tabular-nums" style={{ color: accent }}>+{wildcardPoints}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type RawPick = { userId: string; round: number; pick: RacePrediction };
type ProfileRow = { id: string; display_name: string | null; fav_team_1: string | null };
type SeasonPickRow = { userId: string; picks: SeasonPredictions };

function driverLastName(id: string | null | undefined): string {
  if (!id) return "—";
  return DRIVERS.find((d) => d.id === id)?.name.split(" ").pop() ?? id;
}
function driverTeamColor(id: string | null | undefined): string | null {
  if (!id) return null;
  const d = DRIVERS.find((d) => d.id === id);
  return d ? (TEAM_COLORS[d.team.toLowerCase().replace(/\s+/g, "-")] ?? null) : null;
}
function constructorName(id: string | null | undefined): string {
  if (!id) return "—";
  return id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
function constructorColor(id: string | null | undefined): string | null {
  if (!id) return null;
  return TEAM_COLORS[id] ?? null;
}
function raceAbbr(name: string): string {
  return name.replace(/ Grand Prix$/i, "").trim().split(" ")[0].substring(0, 3).toUpperCase();
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="inline-block h-1 w-8 rounded-full" style={{ backgroundColor: "var(--f1-red)" }} />
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>{label}</span>
    </div>
  );
}

// ── Table column header ───────────────────────────────────────────────────────
function UserColHeader({ entry, accent, isMe }: { entry: LeaderboardEntry; accent: string; isMe: boolean }) {
  return (
    <th
      className="py-3 px-3 font-bold text-xs uppercase tracking-wider whitespace-nowrap text-center"
      style={{
        color: accent,
        backgroundColor: isMe ? `rgba(${hexToRgb(accent)},0.07)` : undefined,
      }}
    >
      {entry.displayName?.split(" ")[0] ?? "?"}
      {isMe && <span className="block text-[8px] font-bold mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>YOU</span>}
    </th>
  );
}

export default function StandingsPage() {
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rawPredictions, setRawPredictions] = useState<RawPick[]>([]);
  const [rawResults, setRawResults] = useState<RaceResult[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [seasonPicks, setSeasonPicks] = useState<SeasonPickRow[]>([]);
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
        { data: profilesData, error: e3 },
        { data: wildcards },
        { data: wcPredictions },
        { data: seasonPicksData },
      ] = await Promise.all([
        supabase.from("race_results").select("*"),
        supabase.from("race_picks").select("user_id,round,qual_pole,qual_p2,qual_p3,race_winner,race_p2,race_p3,race_p4,race_p5,race_p6,fastest_lap,safety_car,boosted_picks,sprint_qual_pole,sprint_qual_p2,sprint_qual_p3,sprint_winner,sprint_p2,sprint_p3"),
        supabase.from("profiles").select("id,display_name,fav_team_1"),
        supabase.from("race_wildcards").select("id,round,question,question_type,options,points,correct_answer,display_order"),
        supabase.from("wildcard_picks").select("user_id,wildcard_id,pick_value,boosted"),
        supabase.from("season_picks").select("user_id,wdc_winner,wcc_winner,most_wins,most_poles,most_podiums,most_dnfs_driver,most_dnfs_constructor"),
      ]);

      if (e2 || e3) { setError(true); setLoading(false); return; }

      const allResults: RaceResult[] = (results ?? []).map((row) => ({
        round: row.round, qualPole: row.qual_pole ?? null, qualP2: row.qual_p2 ?? null, qualP3: row.qual_p3 ?? null,
        raceWinner: row.race_winner ?? null, raceP2: row.race_p2 ?? null, raceP3: row.race_p3 ?? null,
        raceP4: row.race_p4 ?? null, raceP5: row.race_p5 ?? null, raceP6: row.race_p6 ?? null,
        fastestLap: row.fastest_lap ?? null, safetyCar: row.safety_car ?? null,
        sprintQualPole: row.sprint_qual_pole ?? null, sprintQualP2: row.sprint_qual_p2 ?? null, sprintQualP3: row.sprint_qual_p3 ?? null,
        sprintWinner: row.sprint_winner ?? null, sprintP2: row.sprint_p2 ?? null, sprintP3: row.sprint_p3 ?? null,
        fetchedAt: row.fetched_at ?? null, manuallyOverridden: row.manually_overridden ?? false, updatedAt: row.updated_at,
      }));

      const allPredictions = (predictions ?? []).map((row) => ({
        userId: row.user_id, round: row.round,
        pick: {
          qualPole: row.qual_pole ?? null, qualP2: row.qual_p2 ?? null, qualP3: row.qual_p3 ?? null,
          raceWinner: row.race_winner ?? null, raceP2: row.race_p2 ?? null, raceP3: row.race_p3 ?? null,
          raceP4: row.race_p4 ?? null, raceP5: row.race_p5 ?? null, raceP6: row.race_p6 ?? null,
          fastestLap: row.fastest_lap ?? null, safetyCar: row.safety_car ?? null,
          boostedPredictions: row.boosted_picks ?? [],
          sprintQualPole: row.sprint_qual_pole ?? null, sprintQualP2: row.sprint_qual_p2 ?? null, sprintQualP3: row.sprint_qual_p3 ?? null,
          sprintWinner: row.sprint_winner ?? null, sprintP2: row.sprint_p2 ?? null, sprintP3: row.sprint_p3 ?? null,
        } as RacePrediction,
      }));

      const allWildcards = (wildcards ?? []).map((row) => ({
        id: row.id as string, round: row.round as number, question: row.question as string,
        questionType: row.question_type as import("@/lib/types").WildcardQuestionType,
        options: (row.options as { id: string; name: string }[] | null) ?? null,
        points: row.points as number, correctAnswer: (row.correct_answer as string | null) ?? null,
        displayOrder: row.display_order as number,
      }));
      const allWildcardPredictions = (wcPredictions ?? []).map((row) => ({
        userId: row.user_id as string, wildcardId: row.wildcard_id as string,
        pickValue: row.pick_value as string, boosted: row.boosted as boolean,
      }));

      const lb = buildLeaderboard(allPredictions, allResults, profilesData ?? [], allWildcards, allWildcardPredictions);
      setLeaderboard(lb);
      setRawPredictions(allPredictions);
      setRawResults(allResults);
      setProfiles(profilesData ?? []);

      setSeasonPicks((seasonPicksData ?? []).map((row) => ({
        userId: row.user_id as string,
        picks: {
          wdcWinner: row.wdc_winner ?? null, wccWinner: row.wcc_winner ?? null,
          mostWins: row.most_wins ?? null, mostPoles: row.most_poles ?? null,
          mostPodiums: row.most_podiums ?? null,
          mostDnfsDriver: row.most_dnfs_driver ?? null, mostDnfsConstructor: row.most_dnfs_constructor ?? null,
        },
      })));

      const nowMs = Date.now();
      const revealedRaces = RACES.filter((r) => r.weekendStartUtc && new Date(r.weekendStartUtc).getTime() < nowMs);
      if (revealedRaces.length > 0) setPredRound(revealedRaces[revealedRaces.length - 1].r);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const leaderPts = leaderboard[0]?.totalPoints ?? 0;
  const nowMs = Date.now();
  const revealedRaces = RACES.filter((r) => r.weekendStartUtc && new Date(r.weekendStartUtc).getTime() < nowMs);
  const latestResultRound = rawResults.length > 0 ? rawResults.map((r) => r.round).sort((a, b) => b - a)[0] : null;
  const selectedRace = revealedRaces.find((r) => r.r === predRound) ?? revealedRaces[revealedRaces.length - 1] ?? null;
  const roundPredictions = selectedRace ? rawPredictions.filter((p) => p.round === selectedRace.r) : [];
  const roundResult = selectedRace ? rawResults.find((r) => r.round === selectedRace.r) ?? null : null;
  const hasResults = rawResults.length > 0 || leaderboard.some((e) => e.totalPoints > 0 || e.roundsScored > 0);

  const usersInTable = leaderboard.map((entry) => {
    const pred = roundPredictions.find((p) => p.userId === entry.userId);
    const accent = entry.favTeam1 ? TEAM_COLORS[entry.favTeam1] ?? "#888888" : "#888888";
    const rgb = hexToRgb(accent);
    const isMe = entry.userId === currentUserId;
    return { entry, pred, accent, rgb, isMe };
  });
  const hasAnyPicks = usersInTable.some((u) => u.pred != null);
  const seasonPickMap = new Map(seasonPicks.map((s) => [s.userId, s.picks]));

  // Current user's leaderboard entry
  const myEntry = currentUserId ? leaderboard.find((e) => e.userId === currentUserId) : null;
  const myAccent = myEntry?.favTeam1 ? TEAM_COLORS[myEntry.favTeam1] ?? "#888888" : "#888888";
  const myRgb = hexToRgb(myAccent);
  const myLastRoundPts = latestResultRound != null ? (myEntry?.scoresByRound[latestResultRound] ?? 0) : 0;
  const myLastRace = latestResultRound != null ? RACES.find((r) => r.r === latestResultRound) : null;

  type PredRow = { key: keyof RacePrediction; label: string; isBool?: boolean };
  type PredGroup = { label: string; rows: PredRow[] };
  const PRED_GROUPS: PredGroup[] = [
    ...(selectedRace?.sprint ? [
      { label: "Sprint Qualifying", rows: [
        { key: "sprintQualPole" as keyof RacePrediction, label: "Sprint Pole" },
        { key: "sprintQualP2"   as keyof RacePrediction, label: "Sprint P2"   },
        { key: "sprintQualP3"   as keyof RacePrediction, label: "Sprint P3"   },
      ]},
      { label: "Sprint Race", rows: [
        { key: "sprintWinner" as keyof RacePrediction, label: "Sprint Win" },
        { key: "sprintP2"    as keyof RacePrediction, label: "Sprint P2"  },
        { key: "sprintP3"    as keyof RacePrediction, label: "Sprint P3"  },
      ]},
    ] : []),
    { label: "Qualifying", rows: [
      { key: "qualPole" as keyof RacePrediction, label: "Pole" },
      { key: "qualP2"   as keyof RacePrediction, label: "P2"   },
      { key: "qualP3"   as keyof RacePrediction, label: "P3"   },
    ]},
    { label: "Race", rows: [
      { key: "raceWinner" as keyof RacePrediction, label: "Winner"      },
      { key: "raceP2"     as keyof RacePrediction, label: "P2"          },
      { key: "raceP3"     as keyof RacePrediction, label: "P3"          },
      { key: "raceP4"     as keyof RacePrediction, label: "P4"          },
      { key: "raceP5"     as keyof RacePrediction, label: "P5"          },
      { key: "raceP6"     as keyof RacePrediction, label: "P6"          },
      { key: "fastestLap" as keyof RacePrediction, label: "Fastest Lap" },
      { key: "safetyCar"  as keyof RacePrediction, label: "Safety Car", isBool: true },
    ]},
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 pt-5 pb-28 md:pb-6">

      {/* Page header */}
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="inline-block h-1 w-8 rounded-full" style={{ backgroundColor: "var(--f1-red)" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>2026 Season</span>
        </div>
        <h1 className="text-3xl font-black" style={{ color: "var(--foreground)" }}>Standings</h1>
      </div>

      {loading && <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>Loading standings…</p>}
      {error && <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>Couldn&apos;t load standings. Check your connection and try again.</p>}
      {!loading && !error && !hasResults && (
        <div className="rounded-2xl p-6 text-center" style={{ border: "1px solid rgba(225,6,0,0.25)", backgroundColor: "rgba(225,6,0,0.06)" }}>
          <p className="text-base font-bold mb-1" style={{ color: "var(--foreground)" }}>No results yet</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>No results have been entered yet. Check back after the first race!</p>
        </div>
      )}

      {!loading && !error && hasResults && (
        <>
          {/* ── Your Standing hero strip ─────────────────────────────── */}
          {myEntry && (
            <div className="rounded-2xl overflow-hidden mb-7" style={{
              border: `1px solid rgba(${myRgb},0.45)`,
              background: `linear-gradient(135deg, rgba(${myRgb},0.14) 0%, rgba(8,8,16,0.85) 100%)`,
              boxShadow: `0 0 32px rgba(${myRgb},0.08)`,
            }}>
              <div className="flex">
                <div style={{ width: "5px", backgroundColor: myAccent, flexShrink: 0 }} />
                <div className="flex-1 px-5 py-4 flex items-center gap-5">
                  {/* Rank */}
                  <div className="shrink-0 text-center" style={{ minWidth: "48px" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: `rgba(${myRgb},0.6)` }}>Rank</p>
                    <p className="text-5xl font-black tabular-nums leading-none" style={{ color: myAccent }}>
                      #{myEntry.rank}
                    </p>
                  </div>

                  <div style={{ width: "1px", height: "48px", backgroundColor: `rgba(${myRgb},0.2)`, flexShrink: 0 }} />

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Your Standing</p>
                    <p className="text-xl font-black truncate" style={{ color: "var(--foreground)" }}>
                      {myEntry.displayName ?? "You"}
                    </p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--muted)" }}>
                      {myEntry.totalPoints} pts · {Object.keys(myEntry.scoresByRound).length} rounds scored
                    </p>
                  </div>

                  {/* Last race delta */}
                  {myLastRace && (
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>Last Race</p>
                      <span className="text-sm font-bold px-3 py-1 rounded-full" style={{
                        backgroundColor: `rgba(${myRgb},0.18)`,
                        color: myAccent,
                        border: `1px solid rgba(${myRgb},0.3)`,
                      }}>
                        {myLastRace.flag} +{myLastRoundPts}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="md:flex md:gap-8 md:items-start">

            {/* ── Left: Leaderboard ───────────────────────────────────── */}
            <div className="md:w-[340px] md:shrink-0">
              <SectionHeader label="Leaderboard" />

              <div className="flex flex-col gap-2.5">
                {leaderboard.map((entry) => {
                  const accent = entry.favTeam1 ? TEAM_COLORS[entry.favTeam1] ?? "#888888" : "#888888";
                  const rgb = hexToRgb(accent);
                  const isMe = entry.userId === currentUserId;
                  const isExpanded = expandedUser === entry.userId;
                  const roundsWithPoints = Object.keys(entry.scoresByRound).length;
                  const scoredRounds = RACES.filter((r) => entry.scoresByRound[r.r] !== undefined);
                  const barWidth = leaderPts > 0 ? Math.round((entry.totalPoints / leaderPts) * 100) : 0;
                  const lastRoundPts = latestResultRound != null ? (entry.scoresByRound[latestResultRound] ?? 0) : 0;
                  const lastRace = latestResultRound != null ? RACES.find((r) => r.r === latestResultRound) : null;
                  const posColor = entry.rank === 1 ? MEDAL_COLORS[0] : entry.rank === 2 ? MEDAL_COLORS[1] : entry.rank === 3 ? MEDAL_COLORS[2] : "rgba(255,255,255,0.22)";

                  return (
                    <div key={entry.userId}>
                      <div className="rounded-2xl overflow-hidden" style={{
                        border: isMe ? `1px solid rgba(${rgb},0.5)` : `1px solid rgba(${rgb},0.22)`,
                        background: `linear-gradient(135deg, rgba(${rgb},0.07) 0%, rgba(8,8,16,0.8) 100%)`,
                      }}>
                        <button onClick={() => setExpandedUser(isExpanded ? null : entry.userId)} className="w-full text-left">
                          <div className="flex">
                            {/* Left accent bar */}
                            <div style={{ width: "4px", backgroundColor: accent, flexShrink: 0 }} />

                            <div className="flex-1 px-4 py-3 flex items-center gap-3">
                              {/* Position number */}
                              <div className="shrink-0 w-8 text-right">
                                <span className="text-2xl font-black tabular-nums leading-none" style={{ color: posColor }}>
                                  {entry.rank}
                                </span>
                              </div>

                              {/* Name + meta */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                                    {entry.displayName ?? "Anonymous"}
                                  </p>
                                  {isMe && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                                      style={{ backgroundColor: `rgba(${rgb},0.2)`, color: accent }}>
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  {lastRace && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                      style={{ backgroundColor: `rgba(${rgb},0.15)`, color: accent }}>
                                      {lastRace.flag} +{lastRoundPts}
                                    </span>
                                  )}
                                  <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                                    {roundsWithPoints} round{roundsWithPoints !== 1 ? "s" : ""} scored
                                  </span>
                                </div>
                                {/* Progress bar */}
                                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                                  <div style={{ width: `${barWidth}%`, height: "100%", backgroundColor: accent, borderRadius: "9999px" }} />
                                </div>
                              </div>

                              {/* Points — hero */}
                              <div className="shrink-0 text-right ml-1">
                                <p className="text-4xl font-black tabular-nums leading-none" style={{ color: accent }}>
                                  {entry.totalPoints}
                                </p>
                                <p className="text-[10px] font-semibold mt-1" style={{ color: "var(--muted)" }}>pts</p>
                              </div>

                              <ChevronDown size={14} style={{
                                color: "var(--muted)", flexShrink: 0,
                                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }} />
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Expanded round breakdown */}
                      {isExpanded && (
                        <div className="mt-1 rounded-2xl p-4"
                          style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {scoredRounds.length === 0 ? (
                            <p className="text-xs text-center" style={{ color: "var(--muted)" }}>No scored rounds yet.</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <div className="flex flex-wrap gap-2">
                                {scoredRounds.map((race) => {
                                  const pts = entry.scoresByRound[race.r] ?? 0;
                                  const isRoundOpen = expandedRound[entry.userId] === race.r;
                                  return (
                                    <button key={race.r}
                                      onClick={() => setExpandedRound((prev) => ({ ...prev, [entry.userId]: isRoundOpen ? null : race.r }))}
                                      className="flex flex-col items-center px-3 py-2 rounded-xl transition-all"
                                      style={{
                                        backgroundColor: isRoundOpen ? `rgba(${rgb},0.15)` : "rgba(255,255,255,0.05)",
                                        border: isRoundOpen ? `1px solid rgba(${rgb},0.4)` : "1px solid rgba(255,255,255,0.1)",
                                        minWidth: "52px",
                                      }}>
                                      <span className="text-sm">{race.flag}</span>
                                      <span className="text-sm font-black mt-0.5" style={{ color: accent }}>{pts}</span>
                                      <span className="text-[9px] font-semibold mt-0.5" style={{ color: "var(--muted)" }}>{raceAbbr(race.name)}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {expandedRound[entry.userId] != null && (() => {
                                const roundNum = expandedRound[entry.userId]!;
                                const bd = entry.breakdownsByRound[roundNum] ?? null;
                                const race = RACES.find((r) => r.r === roundNum);
                                const roundTotal = entry.scoresByRound[roundNum] ?? 0;
                                const fromRace = bd ? sumBreakdown(bd) : 0;
                                const wildcardPts = Math.max(0, roundTotal - fromRace);
                                return (
                                  <div>
                                    <p className="text-xs font-bold mb-1" style={{ color: "var(--muted)" }}>
                                      {race?.name ?? `Round ${roundNum}`}
                                    </p>
                                    {!bd && wildcardPts > 0 && (
                                      <p className="text-[11px] mb-1" style={{ color: "var(--muted)" }}>
                                        No race result scored for your picks this round (wildcard points only).
                                      </p>
                                    )}
                                    <RoundBreakdown breakdown={bd} accent={accent} showSprintSections={race?.sprint ?? false} wildcardPoints={wildcardPts} />
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right: Predictions + Season ─────────────────────────── */}
            <div className="md:flex-1 min-w-0 mt-8 md:mt-0">

              {/* Race predictions comparison */}
              {revealedRaces.length > 0 && selectedRace && (
                <>
                  <SectionHeader label="What Everyone Picked" />

                  {/* Round tabs */}
                  <div className="flex gap-2 flex-wrap mb-5">
                    {revealedRaces.map((r) => {
                      const isActive = r.r === selectedRace.r;
                      return (
                        <button key={r.r} onClick={() => setPredRound(r.r)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                          style={{
                            backgroundColor: isActive ? "rgba(225,6,0,0.15)" : "rgba(255,255,255,0.06)",
                            border: isActive ? "1px solid rgba(225,6,0,0.5)" : "1px solid rgba(255,255,255,0.1)",
                            color: isActive ? "var(--f1-red)" : "var(--muted)",
                          }}>
                          <span>{r.flag}</span>
                          <span>{r.name.replace(" Grand Prix", " GP")}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!hasAnyPicks ? (
                    <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>No predictions recorded for this race.</p>
                  ) : (
                    <div className="rounded-2xl overflow-hidden mb-8" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.07)" }}>
                              <th className="text-left py-3 pl-4 pr-3 font-bold text-[11px] uppercase tracking-widest whitespace-nowrap sticky left-0 z-10"
                                style={{ color: "var(--muted)", backgroundColor: "#181820" }}>
                                Category
                              </th>
                              <th className="py-3 px-3 font-bold text-[11px] uppercase tracking-widest whitespace-nowrap text-center"
                                style={{ color: "rgba(255,255,255,0.45)", backgroundColor: "rgba(255,255,255,0.07)" }}>
                                Result
                              </th>
                              {usersInTable.map(({ entry, accent, isMe }) => (
                                <UserColHeader key={entry.userId} entry={entry} accent={accent} isMe={isMe} />
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {PRED_GROUPS.map((group) => (
                              <React.Fragment key={group.label}>
                                <tr style={{ borderTop: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.045)" }}>
                                  <td colSpan={2 + usersInTable.length} className="pl-4 py-2"
                                    style={{ borderLeft: "3px solid var(--f1-red)" }}>
                                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.55)" }}>
                                      {group.label}
                                    </span>
                                  </td>
                                </tr>
                                {group.rows.map(({ key, label, isBool }) => {
                                  const resultRaw = roundResult ? (roundResult as unknown as Record<string, unknown>)[key as string] : undefined;
                                  let resultDisplay: string | null = null;
                                  let resultColor = "var(--foreground)";
                                  if (isBool) {
                                    if (resultRaw === true)  { resultDisplay = "Yes"; resultColor = "#22c55e"; }
                                    else if (resultRaw === false) { resultDisplay = "No"; resultColor = "#ef4444"; }
                                  } else if (typeof resultRaw === "string" && resultRaw) {
                                    resultDisplay = driverLastName(resultRaw);
                                    resultColor = driverTeamColor(resultRaw) ?? "var(--foreground)";
                                  }
                                  const resultBg = isBool
                                    ? (resultRaw === true ? "rgba(34,197,94,0.09)" : resultRaw === false ? "rgba(239,68,68,0.09)" : "transparent")
                                    : (typeof resultRaw === "string" && resultRaw
                                      ? (() => { const tc = driverTeamColor(resultRaw as string); return tc ? `rgba(${hexToRgb(tc)},0.09)` : "transparent"; })()
                                      : "transparent");
                                  return (
                                    <tr key={key} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                      <td className="py-2 pl-4 pr-3 whitespace-nowrap sticky left-0 z-10 font-semibold text-[11px]"
                                        style={{ color: "var(--muted)", backgroundColor: STICKY_BG }}>
                                        {label}
                                      </td>
                                      <td className="py-2 px-3 text-center whitespace-nowrap font-bold text-[11px]"
                                        style={{ backgroundColor: resultBg }}>
                                        <span style={{ color: resultDisplay ? resultColor : "rgba(255,255,255,0.2)" }}>
                                          {resultDisplay ?? "—"}
                                        </span>
                                      </td>
                                      {usersInTable.map(({ entry, pred, accent, isMe }) => {
                                        const meBg = isMe ? `rgba(${hexToRgb(accent)},0.04)` : "transparent";
                                        if (!pred) {
                                          return (
                                            <td key={entry.userId} className="py-2 px-3 text-center text-[11px]"
                                              style={{ color: "rgba(255,255,255,0.18)", backgroundColor: meBg }}>—</td>
                                          );
                                        }
                                        const val = pred.pick[key];
                                        const status = (Array.isArray(val) || key === "boostedPredictions")
                                          ? undefined
                                          : getPickResultStatus(key as keyof RacePrediction, val as string | boolean | null, roundResult);
                                        const boosted = (pred.pick.boostedPredictions ?? []).includes(key as string);
                                        let displayVal: string | null = null;
                                        let displayColor = "var(--foreground)";
                                        if (isBool) {
                                          if (val === true)  { displayVal = "Yes"; displayColor = "#22c55e"; }
                                          else if (val === false) { displayVal = "No"; displayColor = "#ef4444"; }
                                        } else if (typeof val === "string" && val) {
                                          displayVal = driverLastName(val);
                                          displayColor = driverTeamColor(val) ?? "var(--foreground)";
                                        }
                                        const indicatorColor = status === "correct" ? "#22c55e" : status === "partial" ? "#f59e0b" : status === "wrong" ? "#ef4444" : null;
                                        const cellBg = status === "correct" ? "rgba(34,197,94,0.08)" : status === "partial" ? "rgba(245,158,11,0.08)" : status === "wrong" ? "rgba(239,68,68,0.07)" : meBg;
                                        return (
                                          <td key={entry.userId} className="py-2 px-3 text-center whitespace-nowrap" style={{ backgroundColor: cellBg }}>
                                            <div className="flex flex-col items-center gap-0.5">
                                              {indicatorColor && (
                                                <span style={{ color: indicatorColor, fontSize: "9px", lineHeight: 1, fontWeight: 800 }}>
                                                  {status === "correct" ? "✓" : status === "partial" ? "~" : "✗"}
                                                </span>
                                              )}
                                              <span className="text-[11px]" style={{ color: displayVal ? (indicatorColor ?? displayColor) : "rgba(255,255,255,0.18)", fontWeight: displayVal ? 700 : 400 }}>
                                                {displayVal ?? "—"}{boosted ? " ⚡" : ""}
                                              </span>
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  );
                                })}
                              </React.Fragment>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: "2px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.03)" }}>
                              <td className="py-3 pl-4 pr-3 font-black text-[10px] uppercase tracking-widest whitespace-nowrap sticky left-0"
                                style={{ color: "var(--muted)", backgroundColor: STICKY_BG }}>
                                Round Total
                              </td>
                              <td />
                              {usersInTable.map(({ entry, accent, isMe }) => {
                                const roundTotal = selectedRace ? (entry.scoresByRound[selectedRace.r] ?? 0) : 0;
                                return (
                                  <td key={entry.userId} className="py-3 px-3 text-center font-black tabular-nums text-sm"
                                    style={{
                                      color: roundTotal > 0 ? accent : "rgba(255,255,255,0.18)",
                                      backgroundColor: isMe ? `rgba(${hexToRgb(accent)},0.06)` : undefined,
                                    }}>
                                    {roundTotal > 0 ? `+${roundTotal}` : "—"}
                                  </td>
                                );
                              })}
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Season predictions comparison */}
              {seasonPicks.length > 0 && (
                <>
                  <SectionHeader label="Season Predictions" />
                  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.07)" }}>
                            <th className="text-left py-3 pl-4 pr-3 font-bold text-[11px] uppercase tracking-widest whitespace-nowrap sticky left-0 z-10"
                              style={{ color: "var(--muted)", backgroundColor: "#181820" }}>
                              Category
                            </th>
                            {leaderboard.map((entry) => {
                              const accent = entry.favTeam1 ? TEAM_COLORS[entry.favTeam1] ?? "#888888" : "#888888";
                              const isMe = entry.userId === currentUserId;
                              return <UserColHeader key={entry.userId} entry={entry} accent={accent} isMe={isMe} />;
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {SEASON_ROWS.map(({ key, label, type }) => (
                            <tr key={key} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              <td className="py-2 pl-4 pr-3 whitespace-nowrap sticky left-0 z-10 font-semibold text-[11px]"
                                style={{ color: "var(--muted)", backgroundColor: STICKY_BG }}>
                                {label}
                              </td>
                              {leaderboard.map((entry) => {
                                const accent = entry.favTeam1 ? TEAM_COLORS[entry.favTeam1] ?? "#888888" : "#888888";
                                const isMe = entry.userId === currentUserId;
                                const picks = seasonPickMap.get(entry.userId);
                                const val = picks?.[key] ?? null;
                                let displayVal: string | null = null;
                                let displayColor = "var(--foreground)";
                                if (type === "driver") {
                                  displayVal = val ? driverLastName(val) : null;
                                  displayColor = driverTeamColor(val) ?? "var(--foreground)";
                                } else {
                                  displayVal = val ? constructorName(val) : null;
                                  displayColor = constructorColor(val) ?? "var(--foreground)";
                                }
                                return (
                                  <td key={entry.userId} className="py-2 px-3 text-center whitespace-nowrap text-[11px]"
                                    style={{ backgroundColor: isMe ? `rgba(${hexToRgb(accent)},0.04)` : undefined }}>
                                    <span style={{ color: displayVal ? displayColor : "rgba(255,255,255,0.18)", fontWeight: displayVal ? 700 : 400 }}>
                                      {displayVal ?? "—"}
                                    </span>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
