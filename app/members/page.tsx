"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { CONSTRUCTORS, DRIVERS, RACES } from "@/lib/data";
import { TEAM_COLORS, hexToRgb } from "@/lib/teamColors";

// ─── Types ────────────────────────────────────────────────────────────────────

type Profile = {
  id: string;
  display_name: string | null;
  fav_team_1: string | null;
  fav_team_2: string | null;
  fav_team_3: string | null;
  fav_driver_1: string | null;
  fav_driver_2: string | null;
  fav_driver_3: string | null;
};

type Comment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type PicksRow = {
  user_id: string;
  qual_pole: string | null;
  qual_p2: string | null;
  qual_p3: string | null;
  race_winner: string | null;
  race_p2: string | null;
  race_p3: string | null;
  fastest_lap: string | null;
  safety_car: boolean | null;
};

type ActivityItem = {
  userId: string;
  label: string;
  updatedAt: string;
  onTap?: () => void;
};

type MentionNotification = {
  id: string;
  from_user_id: string;
  round: number;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function driverName(id: string | null): string {
  if (!id) return "";
  return DRIVERS.find((d) => d.id === id)?.name ?? id;
}

function teamName(id: string | null): string {
  if (!id) return "";
  return CONSTRUCTORS.find((c) => c.id === id)?.name ?? id;
}

function driverTeamColor(driverId: string | null): string | null {
  if (!driverId) return null;
  const d = DRIVERS.find((d) => d.id === driverId);
  if (!d) return null;
  return TEAM_COLORS[d.team.toLowerCase().replace(/\s+/g, "-")] ?? null;
}

function profileAccent(profile: Profile | undefined): string {
  if (!profile?.fav_team_1) return "#888888";
  return TEAM_COLORS[profile.fav_team_1] ?? "#888888";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/** First word of a display name — used as the @mention handle. */
function firstWord(displayName: string | null): string {
  return (displayName ?? "").split(" ")[0];
}

/** Parse @handles in comment text and return matching user IDs (excluding sender). */
function parseMentionIds(
  content: string,
  profileMap: Map<string, Profile>,
  senderId: string
): string[] {
  const matches = content.match(/@(\w+)/g);
  if (!matches) return [];
  const ids: string[] = [];
  for (const match of matches) {
    const handle = match.slice(1).toLowerCase();
    for (const [id, profile] of profileMap) {
      if (id === senderId) continue;
      if (firstWord(profile.display_name).toLowerCase() === handle) {
        ids.push(id);
        break;
      }
    }
  }
  return [...new Set(ids)];
}

/** Render comment text with @handles highlighted in the mentioned user's team colour. */
function renderText(content: string, profileMap: Map<string, Profile>): React.ReactNode {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const handle = part.slice(1).toLowerCase();
      let accent: string | null = null;
      for (const [, profile] of profileMap) {
        if (firstWord(profile.display_name).toLowerCase() === handle) {
          accent = profileAccent(profile);
          break;
        }
      }
      if (accent) {
        return (
          <span key={i} className="font-semibold" style={{ color: accent }}>
            {part}
          </span>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

// ─── Shared components ────────────────────────────────────────────────────────

function Avatar({ profile, size = 8 }: { profile: Profile | undefined; size?: number }) {
  const accent = profileAccent(profile);
  const rgb = hexToRgb(accent);
  return (
    <div
      className={`w-${size} h-${size} rounded-full shrink-0 flex items-center justify-center text-xs font-bold`}
      style={{ backgroundColor: `rgba(${rgb},0.2)`, color: accent }}
    >
      {(profile?.display_name?.trim() || "?")[0].toUpperCase()}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span
        className="inline-block w-1 h-5 rounded-full shrink-0"
        style={{ backgroundColor: "var(--team-accent)" }}
      />
      <h2
        className="text-sm font-bold uppercase tracking-widest shrink-0"
        style={{ color: "var(--foreground)" }}
      >
        {label}
      </h2>
      <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
    </div>
  );
}

// ─── Feed Tab ─────────────────────────────────────────────────────────────────

function FeedTab({
  profileMap,
  currentUser,
  refreshNotifications,
  onViewRace,
}: {
  profileMap: Map<string, Profile>;
  currentUser: User | null;
  refreshNotifications: () => Promise<void>;
  onViewRace: (round: number) => void;
}) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [mentions, setMentions] = useState<MentionNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [{ data: racePicks }, { data: seasonPicks }, { data: raceComments }] = await Promise.all([
        supabase
          .from("race_picks")
          .select("user_id,round,updated_at")
          .order("updated_at", { ascending: false })
          .limit(20),
        supabase
          .from("season_picks")
          .select("user_id,updated_at")
          .order("updated_at", { ascending: false })
          .limit(10),
        supabase
          .from("race_comments")
          .select("user_id,round,created_at")
          .order("created_at", { ascending: false })
          .limit(15),
      ]);

      const feed: ActivityItem[] = [];
      for (const row of racePicks ?? []) {
        const race = RACES.find((r) => r.r === row.round);
        feed.push({
          userId: row.user_id,
          label: `updated their ${race?.name ?? `Round ${row.round}`} picks`,
          updatedAt: row.updated_at,
        });
      }
      for (const row of seasonPicks ?? []) {
        feed.push({
          userId: row.user_id,
          label: "updated their season predictions",
          updatedAt: row.updated_at,
        });
      }
      for (const row of raceComments ?? []) {
        const race = RACES.find((r) => r.r === row.round);
        feed.push({
          userId: row.user_id,
          label: `posted a comment about the ${race?.name ?? `Round ${row.round}`}`,
          updatedAt: row.created_at,
          onTap: () => onViewRace(row.round),
        });
      }
      feed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setItems(feed.slice(0, 25));
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load and mark-as-read any unread notifications for the current user
  useEffect(() => {
    if (!currentUser) return;
    supabase
      .from("notifications")
      .select("id,from_user_id,round,created_at")
      .eq("user_id", currentUser.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = data ?? [];
        setMentions(rows);
        if (rows.length > 0) {
          supabase
            .from("notifications")
            .update({ read_at: new Date().toISOString() })
            .eq("user_id", currentUser.id)
            .is("read_at", null)
            .then(() => refreshNotifications());
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  if (loading) {
    return <p className="text-sm py-4" style={{ color: "var(--muted)" }}>Loading feed…</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Mentions section */}
      {mentions.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-block h-1 w-4 rounded-full shrink-0"
              style={{ backgroundColor: "var(--f1-red)" }}
            />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--f1-red)" }}
            >
              Mentions
            </span>
          </div>
          <div className="flex flex-col gap-2 mb-4">
            {mentions.map((m) => {
              const fromProfile = profileMap.get(m.from_user_id);
              const accent = profileAccent(fromProfile);
              const race = RACES.find((r) => r.r === m.round);
              return (
                <button
                  key={m.id}
                  onClick={() => onViewRace(m.round)}
                  className="flex items-start gap-3 p-3 rounded-xl w-full text-left"
                  style={{
                    backgroundColor: "rgba(225,6,0,0.06)",
                    border: "1px solid rgba(225,6,0,0.2)",
                  }}
                >
                  <Avatar profile={fromProfile} />
                  <div className="min-w-0">
                    <p className="text-sm leading-snug" style={{ color: "var(--foreground)" }}>
                      <span className="font-semibold" style={{ color: accent }}>
                        {fromProfile?.display_name ?? "Someone"}
                      </span>{" "}
                      mentioned you in the{" "}
                      <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                        {race?.name ?? `Round ${m.round}`}
                      </span>{" "}
                      discussion
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {timeAgo(m.created_at)} · Tap to view
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity feed */}
      {items.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>
          No activity yet. Make some picks to see them here!
        </p>
      ) : (
        items.map((item, i) => {
          const profile = profileMap.get(item.userId);
          const accent = profileAccent(profile);
          const inner = (
            <>
              <Avatar profile={profile} />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug" style={{ color: "var(--foreground)" }}>
                  <span className="font-semibold" style={{ color: accent }}>
                    {profile?.display_name ?? "Someone"}
                  </span>{" "}
                  {item.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {timeAgo(item.updatedAt)}
                  {item.onTap && <span style={{ color: "var(--team-accent)" }}> · View →</span>}
                </p>
              </div>
            </>
          );
          const sharedStyle = {
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          };
          return item.onTap ? (
            <button
              key={i}
              onClick={item.onTap}
              className="flex items-start gap-3 p-3 rounded-xl w-full text-left active:bg-white/5 transition-colors"
              style={sharedStyle}
            >
              {inner}
            </button>
          ) : (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={sharedStyle}>
              {inner}
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Picks Grid ───────────────────────────────────────────────────────────────

const PICK_LABELS: { key: keyof PicksRow; label: string }[] = [
  { key: "qual_pole",   label: "Pole"     },
  { key: "qual_p2",     label: "Q P2"     },
  { key: "qual_p3",     label: "Q P3"     },
  { key: "race_winner", label: "Race Win" },
  { key: "race_p2",     label: "Race P2"  },
  { key: "race_p3",     label: "Race P3"  },
  { key: "fastest_lap", label: "Fastest"  },
  { key: "safety_car",  label: "Safety"   },
];

function PicksGrid({
  picks,
  profileMap,
  loading,
}: {
  picks: PicksRow[];
  profileMap: Map<string, Profile>;
  loading: boolean;
}) {
  if (loading) {
    return <p className="text-sm py-4" style={{ color: "var(--muted)" }}>Loading predictions…</p>;
  }
  if (picks.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
        No picks have been made for this race yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {picks.map((pick) => {
        const profile = profileMap.get(pick.user_id);
        const accent = profileAccent(profile);
        const rgb = hexToRgb(accent);
        return (
          <div
            key={pick.user_id}
            className="rounded-xl p-4"
            style={{
              backgroundColor: `rgba(${rgb},0.06)`,
              border: `1px solid rgba(${rgb},0.2)`,
            }}
          >
            <p className="text-sm font-bold mb-3" style={{ color: accent }}>
              {profile?.display_name ?? "Unknown"}
            </p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {PICK_LABELS.map(({ key, label }) => {
                const val = pick[key];
                let displayVal: string | null = null;
                let displayColor = "var(--foreground)";

                if (key === "safety_car") {
                  if (val === true) { displayVal = "Yes"; displayColor = "#22c55e"; }
                  else if (val === false) { displayVal = "No"; displayColor = "#ef4444"; }
                } else {
                  const strVal = val as string | null;
                  displayVal = driverName(strVal) || null;
                  displayColor = driverTeamColor(strVal) ?? "var(--foreground)";
                }

                return (
                  <div key={key} className="flex items-start gap-1">
                    <span
                      className="text-xs shrink-0 mt-px"
                      style={{ color: "var(--muted)", minWidth: "52px" }}
                    >
                      {label}
                    </span>
                    <span
                      className="text-xs font-medium truncate"
                      style={{ color: displayVal ? displayColor : "var(--muted)" }}
                    >
                      {displayVal ?? "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Emoji list ───────────────────────────────────────────────────────────────

const EMOJIS = [
  "😂", "🔥", "👏", "💪", "😮", "😍",
  "🎉", "👍", "👎", "😢", "😤", "🤩",
  "🏆", "💯", "🏎️", "🏁", "🚀", "⚡",
  "🌧️", "🤞", "😬", "🥇", "⭐", "💥",
  "😅", "🤔", "😎", "👀", "🙏", "🤯",
];

// ─── Comment Thread ───────────────────────────────────────────────────────────

function CommentThread({
  round,
  profileMap,
  currentUser,
}: {
  round: number;
  profileMap: Map<string, Profile>;
  currentUser: User | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setLoading(true);
    setComments([]);
    supabase
      .from("race_comments")
      .select("id,user_id,content,created_at")
      .eq("round", round)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setComments(data ?? []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  async function submit() {
    if (!currentUser || !text.trim() || submitting) return;
    setSubmitting(true);
    const content = text.trim();
    const { data } = await supabase
      .from("race_comments")
      .insert({ user_id: currentUser.id, round, content })
      .select("id,user_id,content,created_at")
      .single();
    if (data) {
      setComments((prev) => [...prev, data]);
      // Write a notification for each @mentioned user
      const mentionedIds = parseMentionIds(content, profileMap, currentUser.id);
      for (const userId of mentionedIds) {
        await supabase.from("notifications").insert({
          user_id: userId,
          from_user_id: currentUser.id,
          comment_id: data.id,
          round,
        });
      }
    }
    setText("");
    setSubmitting(false);
    setShowEmojis(false);
  }

  // Compute @mention autocomplete suggestions from the current text
  const mentionMatch = text.match(/(^|\s)@(\w*)$/);
  const mentionQuery = mentionMatch ? mentionMatch[2].toLowerCase() : null;
  const mentionSuggestions =
    mentionQuery !== null
      ? Array.from(profileMap.values()).filter((p) => {
          if (p.id === currentUser?.id) return false;
          return firstWord(p.display_name).toLowerCase().startsWith(mentionQuery);
        })
      : [];

  function insertMention(profile: Profile) {
    const handle = firstWord(profile.display_name);
    setText((t) => t.replace(/(^|\s)@\w*$/, (m) => m.replace(/@\w*$/, `@${handle} `)));
    setShowEmojis(false);
  }

  return (
    <div>
      {loading ? (
        <p className="text-sm py-4" style={{ color: "var(--muted)" }}>Loading discussion…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
          No comments yet. Start the discussion!
        </p>
      ) : (
        <div className="flex flex-col gap-2 mb-3">
          {comments.map((c) => {
            const profile = profileMap.get(c.user_id);
            const accent = profileAccent(profile);
            const rgb = hexToRgb(accent);
            return (
              <div
                key={c.id}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `rgba(${rgb},0.2)`, color: accent }}
                >
                  {(profile?.display_name?.trim() || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: accent }}>
                      {profile?.display_name ?? "Unknown"}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {timeAgo(c.created_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-snug" style={{ color: "var(--foreground)" }}>
                    {renderText(c.content, profileMap)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {currentUser ? (
        <div className="mt-3">
          {/* @mention suggestions */}
          {mentionSuggestions.length > 0 && (
            <div
              className="rounded-xl mb-2 overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            >
              {mentionSuggestions.map((profile) => {
                const accent = profileAccent(profile);
                const rgb = hexToRgb(accent);
                return (
                  <button
                    key={profile.id}
                    onClick={() => insertMention(profile)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/5 active:bg-white/5 transition-colors"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ backgroundColor: `rgba(${rgb},0.2)`, color: accent }}
                    >
                      {(profile.display_name?.trim() || "?")[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: accent }}>
                      @{firstWord(profile.display_name)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {profile.display_name}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Emoji panel */}
          {showEmojis && (
            <div
              className="flex flex-wrap gap-0.5 p-2 rounded-xl mb-2"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setText((t) => t + emoji)}
                  className="p-1.5 rounded-lg text-lg leading-none hover:bg-white/10 active:bg-white/10 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Write a comment… (@ to mention)"
              maxLength={500}
              className="flex-1 px-3 py-2.5 text-sm rounded-lg"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "var(--foreground)",
                border: "1px solid rgba(255,255,255,0.12)",
                outline: "none",
              }}
            />
            <button
              onClick={() => setShowEmojis((s) => !s)}
              className="px-3 py-2 text-xl rounded-lg shrink-0 transition-colors"
              style={{
                backgroundColor: showEmojis
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                lineHeight: 1,
              }}
            >
              🙂
            </button>
            <button
              onClick={submit}
              disabled={!text.trim() || submitting}
              className="px-4 py-2 text-sm font-semibold rounded-lg shrink-0"
              style={{
                backgroundColor:
                  text.trim() && !submitting ? "var(--team-accent)" : "rgba(255,255,255,0.06)",
                color: text.trim() && !submitting ? "#fff" : "var(--muted)",
                transition: "background-color 0.2s",
              }}
            >
              Post
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-center py-2" style={{ color: "var(--muted)" }}>
          Log in to join the discussion
        </p>
      )}
    </div>
  );
}

// ─── Races Tab ────────────────────────────────────────────────────────────────

function RacesTab({
  profileMap,
  currentUser,
  selectedRound,
  setSelectedRound,
}: {
  profileMap: Map<string, Profile>;
  currentUser: User | null;
  selectedRound: number;
  setSelectedRound: (r: number) => void;
}) {
  const now = new Date();
  const [picks, setPicks] = useState<PicksRow[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(false);
  const supabase = createClient();

  const race = RACES.find((r) => r.r === selectedRound)!;
  const isRevealed = new Date(race.startUtc) < now;

  useEffect(() => {
    if (!isRevealed) {
      setPicks([]);
      return;
    }
    setLoadingPicks(true);
    supabase
      .from("race_picks")
      .select("user_id,qual_pole,qual_p2,qual_p3,race_winner,race_p2,race_p3,fastest_lap,safety_car")
      .eq("round", selectedRound)
      .then(({ data }) => {
        setPicks(data ?? []);
        setLoadingPicks(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRound]);

  return (
    <div>
      {/* Race selector */}
      <select
        value={selectedRound}
        onChange={(e) => setSelectedRound(Number(e.target.value))}
        className="w-full mb-6 px-3 py-3 rounded-xl text-sm font-medium"
        style={{
          backgroundColor: "rgba(255,255,255,0.06)",
          color: "var(--foreground)",
          border: "1px solid rgba(255,255,255,0.12)",
          outline: "none",
        }}
      >
        {RACES.map((r) => (
          <option
            key={r.r}
            value={r.r}
            style={{ backgroundColor: "#0c0810", color: "#fff" }}
          >
            Round {r.r} — {r.name}
          </option>
        ))}
      </select>

      {/* Predictions */}
      <div className="mb-6">
        <SectionHeader label="Predictions" />
        {isRevealed ? (
          <PicksGrid picks={picks} profileMap={profileMap} loading={loadingPicks} />
        ) : (
          <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
            Predictions are revealed once the race weekend begins.
          </p>
        )}
      </div>

      {/* Discussion */}
      <div>
        <SectionHeader label="Discussion" />
        <CommentThread
          round={selectedRound}
          profileMap={profileMap}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({ profiles, loading }: { profiles: Profile[]; loading: boolean }) {
  if (loading) {
    return <p className="text-sm py-4" style={{ color: "var(--muted)" }}>Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {profiles.map((profile) => {
        const accent = profile.fav_team_1 ? TEAM_COLORS[profile.fav_team_1] ?? null : null;
        const rgb = accent ? hexToRgb(accent) : null;
        const favTeams = [profile.fav_team_1, profile.fav_team_2, profile.fav_team_3].filter(
          Boolean
        ) as string[];
        const favDrivers = [
          profile.fav_driver_1,
          profile.fav_driver_2,
          profile.fav_driver_3,
        ].filter(Boolean) as string[];

        return (
          <div
            key={profile.id}
            className="rounded-2xl p-5"
            style={{
              background: rgb
                ? `linear-gradient(135deg, rgba(${rgb},0.12) 0%, rgba(8,8,16,0.8) 100%)`
                : "rgba(26,26,26,0.8)",
              border: `1px solid ${rgb ? `rgba(${rgb},0.3)` : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <p className="text-xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
              {profile.display_name ?? (
                <span style={{ color: "var(--muted)", fontWeight: 400 }}>Anonymous</span>
              )}
            </p>

            {favTeams.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {favTeams.map((teamId, i) => {
                  const tc = TEAM_COLORS[teamId] ?? "#888";
                  const tcRgb = hexToRgb(tc);
                  return (
                    <span
                      key={i}
                      className="text-xs font-semibold px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: `rgba(${tcRgb},0.15)`,
                        color: tc,
                        border: `1px solid rgba(${tcRgb},0.35)`,
                      }}
                    >
                      {teamName(teamId)}
                    </span>
                  );
                })}
              </div>
            )}

            {favDrivers.length > 0 && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {favDrivers.map((id) => driverName(id)).join(" · ")}
              </p>
            )}

            {favTeams.length === 0 && favDrivers.length === 0 && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                No favourites set yet
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GroupPage() {
  const { user, refreshNotifications } = useAuth();
  const [tab, setTab] = useState<"feed" | "races" | "members">("feed");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const supabase = createClient();

  // selectedRound lives here so FeedTab can deep-link into a race
  const now = new Date();
  const [selectedRound, setSelectedRound] = useState<number>(() => {
    const past = RACES.filter((r) => new Date(r.startUtc) < now);
    return past.length > 0 ? past[past.length - 1].r : RACES[0].r;
  });

  useEffect(() => {
    supabase
      .from("profiles")
      .select(
        "id,display_name,fav_team_1,fav_team_2,fav_team_3,fav_driver_1,fav_driver_2,fav_driver_3"
      )
      .then(({ data }) => {
        setProfiles(data ?? []);
        setLoadingProfiles(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  function goToRace(round: number) {
    setSelectedRound(round);
    setTab("races");
  }

  const tabs = [
    { id: "feed" as const,    label: "Feed"    },
    { id: "races" as const,   label: "Races"   },
    { id: "members" as const, label: "Members" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block h-1 w-8 rounded-full"
            style={{ backgroundColor: "var(--f1-red)" }}
          />
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--muted)" }}
          >
            The Paddock
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Group
        </h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
            style={{
              backgroundColor: tab === t.id ? "var(--team-accent)" : "rgba(255,255,255,0.06)",
              color: tab === t.id ? "#fff" : "var(--muted)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "feed" && (
        <FeedTab
          profileMap={profileMap}
          currentUser={user}
          refreshNotifications={refreshNotifications}
          onViewRace={goToRace}
        />
      )}
      {tab === "races" && (
        <RacesTab
          profileMap={profileMap}
          currentUser={user}
          selectedRound={selectedRound}
          setSelectedRound={setSelectedRound}
        />
      )}
      {tab === "members" && <MembersTab profiles={profiles} loading={loadingProfiles} />}
    </div>
  );
}
