"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { buildLeaderboard } from "@/lib/scoring";
import { RACES } from "@/lib/data";
import { TEAM_COLORS, hexToRgb } from "@/lib/teamColors";
import type { RaceResult, RacePick, LeaderboardEntry } from "@/lib/types";

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

export default function StandingsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setError(false);
      const [
        { data: results, error: e1 },
        { data: picks, error: e2 },
        { data: profiles, error: e3 },
      ] = await Promise.all([
        supabase.from("race_results").select("*"),
        supabase.from("race_picks").select("user_id,round,qual_pole,qual_p2,qual_p3,race_winner,race_p2,race_p3,fastest_lap,safety_car,sprint_qual_pole,sprint_qual_p2,sprint_qual_p3,sprint_winner,sprint_p2,sprint_p3"),
        supabase.from("profiles").select("id,display_name,fav_team_1"),
      ]);

      if (e1 || e2 || e3) { setError(true); setLoading(false); return; }

      const allResults: RaceResult[] = (results ?? []).map((row) => ({
        round:              row.round,
        qualPole:           row.qual_pole           ?? null,
        qualP2:             row.qual_p2             ?? null,
        qualP3:             row.qual_p3             ?? null,
        raceWinner:         row.race_winner         ?? null,
        raceP2:             row.race_p2             ?? null,
        raceP3:             row.race_p3             ?? null,
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

      const allPicks = (picks ?? []).map((row) => ({
        userId: row.user_id,
        round: row.round,
        pick: {
          qualPole:     row.qual_pole       ?? null,
          qualP2:       row.qual_p2         ?? null,
          qualP3:       row.qual_p3         ?? null,
          raceWinner:   row.race_winner     ?? null,
          raceP2:       row.race_p2         ?? null,
          raceP3:       row.race_p3         ?? null,
          fastestLap:   row.fastest_lap     ?? null,
          safetyCar:    row.safety_car      ?? null,
          sprintQualPole: row.sprint_qual_pole ?? null,
          sprintQualP2:   row.sprint_qual_p2   ?? null,
          sprintQualP3:   row.sprint_qual_p3   ?? null,
          sprintWinner:   row.sprint_winner    ?? null,
          sprintP2:       row.sprint_p2        ?? null,
          sprintP3:       row.sprint_p3        ?? null,
        } as RacePick,
      }));

      const lb = buildLeaderboard(allPicks, allResults, profiles ?? []);
      setLeaderboard(lb);
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
                      <div className="flex flex-wrap gap-2">
                        {scoredRounds.map((race) => {
                          const pts = entry.scoresByRound[race.r] ?? 0;
                          return (
                            <div
                              key={race.r}
                              className="flex flex-col items-center px-3 py-2 rounded-xl"
                              style={{
                                backgroundColor: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                minWidth: "56px",
                              }}
                            >
                              <span className="text-xs font-bold" style={{ color: accent }}>
                                {pts}
                              </span>
                              <span className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                                R{race.r}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
