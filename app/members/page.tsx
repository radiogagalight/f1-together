"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { CONSTRUCTORS, DRIVERS, RACES } from "@/lib/data";
import { TEAM_COLORS, hexToRgb } from "@/lib/teamColors";
import { sendPushToUser } from "@/lib/pushActions";
import { DRIVER_IMAGES } from "@/lib/driverImages";

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
  reply_to_id: string | null;
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
  const [error, setError] = useState(false);
  const [clearedBefore, setClearedBefore] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("f1_feed_cleared_before") : null
  );
  const [archiveOpen, setArchiveOpen] = useState(false);
  const supabase = createClient();

  function clearFeed() {
    const now = new Date().toISOString();
    setClearedBefore(now);
    localStorage.setItem("f1_feed_cleared_before", now);
  }

  useEffect(() => {
    async function load() {
      setError(false);
      const [{ data: racePicks, error: e1 }, { data: seasonPicks, error: e2 }, { data: raceComments, error: e3 }] = await Promise.all([
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

      if (e1 || e2 || e3) { setError(true); setLoading(false); return; }
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

    // Real-time: reload feed when anyone posts a new comment
    const channel = supabase
      .channel("feed-comments")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "race_comments" },
        () => { load(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
  if (error) {
    return <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>Couldn&apos;t load the feed. Check your connection and try again.</p>;
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
      {(() => {
        const cutoff = clearedBefore ? new Date(clearedBefore).getTime() : null;
        const activeItems = cutoff ? items.filter((it) => new Date(it.updatedAt).getTime() > cutoff) : items;
        const archivedItems = cutoff ? items.filter((it) => new Date(it.updatedAt).getTime() <= cutoff) : [];

        function renderItem(item: ActivityItem, i: number, dimmed = false) {
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
          const sharedStyle: React.CSSProperties = {
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            opacity: dimmed ? 0.55 : 1,
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
        }

        return (
          <>
            {activeItems.length === 0 && archivedItems.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>
                No activity yet. Make some picks to see them here!
              </p>
            ) : (
              <>
                {/* Clear button */}
                {activeItems.length > 0 && (
                  <div className="flex justify-end mb-1">
                    <button
                      onClick={clearFeed}
                      className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                      style={{
                        color: "var(--muted)",
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      Clear feed
                    </button>
                  </div>
                )}

                {/* Active items */}
                {activeItems.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
                    You&apos;re all caught up.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {activeItems.map((item, i) => renderItem(item, i))}
                  </div>
                )}

                {/* Archive */}
                {archivedItems.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() => setArchiveOpen((o) => !o)}
                      className="flex items-center gap-2 w-full py-2"
                    >
                      <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                      <span className="text-xs font-semibold uppercase tracking-widest shrink-0" style={{ color: "var(--muted)" }}>
                        Archive ({archivedItems.length})
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--muted)" }}>
                        {archiveOpen ? "▲" : "▼"}
                      </span>
                      <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
                    </button>
                    {archiveOpen && (
                      <div className="flex flex-col gap-2 mt-2">
                        {archivedItems.map((item, i) => renderItem(item, i, true))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        );
      })()}
    </div>
  );
}

// ─── Reaction emojis + localStorage helpers ───────────────────────────────────

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮", "👏"];

function getLastRead(round: number): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(`f1_thread_last_read_${round}`) ?? "0", 10);
}

function markAsRead(round: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`f1_thread_last_read_${round}`, Date.now().toString());
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
  const [loadError, setLoadError] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [reactions, setReactions] = useState<Record<string, Record<string, { count: number; userReacted: boolean }>>>({});
  const [showPickerFor, setShowPickerFor] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const supabase = createClient();

  // Track whether the bottom sentinel is visible
  useEffect(() => {
    const el = bottomRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        atBottomRef.current = entry.isIntersecting;
        if (entry.isIntersecting) setHasNewMessages(false);
      },
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  async function loadReactions(commentIds: string[]) {
    if (!commentIds.length) return;
    const { data } = await supabase
      .from("comment_reactions")
      .select("comment_id, emoji, user_id")
      .in("comment_id", commentIds);
    setReactions((prev) => {
      const map = { ...prev };
      for (const id of commentIds) map[id] = {};
      for (const row of data ?? []) {
        if (!map[row.comment_id]) map[row.comment_id] = {};
        const cur = map[row.comment_id][row.emoji] ?? { count: 0, userReacted: false };
        map[row.comment_id][row.emoji] = {
          count: cur.count + 1,
          userReacted: cur.userReacted || row.user_id === currentUser?.id,
        };
      }
      return map;
    });
  }

  async function toggleReaction(commentId: string, emoji: string) {
    if (!currentUser) return;
    const userReacted = reactions[commentId]?.[emoji]?.userReacted;
    setReactions((prev) => {
      const cr = { ...(prev[commentId] ?? {}) };
      const cur = cr[emoji] ?? { count: 0, userReacted: false };
      if (userReacted) {
        const newCount = cur.count - 1;
        if (newCount <= 0) {
          const u = { ...cr };
          delete u[emoji];
          return { ...prev, [commentId]: u };
        }
        return { ...prev, [commentId]: { ...cr, [emoji]: { count: newCount, userReacted: false } } };
      }
      return { ...prev, [commentId]: { ...cr, [emoji]: { count: cur.count + 1, userReacted: true } } };
    });
    setShowPickerFor(null);
    if (userReacted) {
      await supabase.from("comment_reactions").delete()
        .eq("comment_id", commentId).eq("user_id", currentUser.id).eq("emoji", emoji);
    } else {
      await supabase.from("comment_reactions").upsert(
        { comment_id: commentId, user_id: currentUser.id, emoji },
        { onConflict: "comment_id,user_id,emoji" }
      );
    }
  }

  useEffect(() => {
    setLoading(true);
    setComments([]);
    setLoadError(false);
    setReplyingTo(null);
    setEditingId(null);
    setConfirmDeleteId(null);
    setHasNewMessages(false);
    supabase
      .from("race_comments")
      .select("id,user_id,content,created_at,reply_to_id")
      .eq("round", round)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (error) { setLoadError(true); } else {
          setComments(data ?? []);
          loadReactions((data ?? []).map((c) => c.id));
        }
        setLoading(false);
      });

    const channel = supabase
      .channel(`race-comments-${round}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "race_comments", filter: `round=eq.${round}` },
        (payload) => {
          setComments((prev) => {
            if (prev.some((c) => c.id === payload.new.id)) return prev;
            loadReactions([payload.new.id]);
            if (!atBottomRef.current) setHasNewMessages(true);
            return [...prev, payload.new as Comment];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "race_comments", filter: `round=eq.${round}` },
        (payload) => {
          setComments((prev) =>
            prev.map((c) => c.id === payload.new.id ? { ...c, content: payload.new.content } : c)
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "race_comments" },
        (payload) => {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  async function saveEdit(commentId: string) {
    const trimmed = editText.trim();
    if (!trimmed) { setEditingId(null); return; }
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, content: trimmed } : c));
    setEditingId(null);
    await supabase.from("race_comments").update({ content: trimmed }).eq("id", commentId);
  }

  async function deleteComment(commentId: string) {
    setConfirmDeleteId(null);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    await supabase.from("race_comments").delete().eq("id", commentId);
  }

  async function submit() {
    if (!currentUser || !text.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(false);
    const content = text.trim();
    const { data } = await supabase
      .from("race_comments")
      .insert({ user_id: currentUser.id, round, content, reply_to_id: replyingTo?.id ?? null })
      .select("id,user_id,content,created_at,reply_to_id")
      .single();
    if (!data) {
      setSubmitError(true);
    } else {
      setComments((prev) => [...prev, data]);
      const mentionedIds = parseMentionIds(content, profileMap, currentUser.id);
      for (const userId of mentionedIds) {
        await supabase.from("notifications").insert({
          user_id: userId,
          from_user_id: currentUser.id,
          comment_id: data.id,
          round,
        });
      }
      const senderName = profileMap.get(currentUser.id)?.display_name ?? 'Someone';
      const raceName = RACES.find((r) => r.r === round)?.name ?? `Round ${round}`;
      for (const userId of mentionedIds) {
        void sendPushToUser(
          userId,
          'F1 Together',
          `${senderName} mentioned you in the ${raceName} discussion`,
          '/members'
        );
      }
      setText("");
      setShowEmojis(false);
      setReplyingTo(null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
    setSubmitting(false);
  }

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
      ) : loadError ? (
        <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>Couldn&apos;t load comments. Check your connection.</p>
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
            const isOwn = currentUser?.id === c.user_id;
            const parentComment = c.reply_to_id ? comments.find((p) => p.id === c.reply_to_id) : null;
            const parentProfile = parentComment ? profileMap.get(parentComment.user_id) : null;
            const parentAccent = parentProfile ? profileAccent(parentProfile) : "#888";
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
                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{ backgroundColor: `rgba(${rgb},0.2)`, color: accent }}
                >
                  {(profile?.display_name?.trim() || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold" style={{ color: accent }}>
                        {profile?.display_name ?? "Unknown"}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {timeAgo(c.created_at)}
                      </span>
                    </div>
                    {isOwn && (
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setShowMenuFor((prev) => prev === c.id ? null : c.id)}
                          className="w-6 h-6 flex items-center justify-center rounded text-sm leading-none"
                          style={{ color: "var(--muted)" }}
                        >···</button>
                        {showMenuFor === c.id && (
                          <div
                            className="absolute right-0 top-7 z-20 rounded-xl overflow-hidden"
                            style={{ backgroundColor: "#1a1a1a", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 4px 20px rgba(0,0,0,0.6)", minWidth: "100px" }}
                          >
                            <button
                              onClick={() => { setEditingId(c.id); setEditText(c.content); setShowMenuFor(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-left active:bg-white/10"
                              style={{ color: "var(--foreground)" }}
                            >✏️ Edit</button>
                            <button
                              onClick={() => { setShowMenuFor(null); setConfirmDeleteId(c.id); }}
                              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-left active:bg-white/10"
                              style={{ color: "#ef4444", borderTop: "1px solid rgba(255,255,255,0.08)" }}
                            >🗑️ Delete</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Reply-to quote */}
                  {parentComment && (
                    <div
                      className="mb-1.5 px-2 py-1 rounded text-xs"
                      style={{ borderLeft: `2px solid ${parentAccent}`, backgroundColor: "rgba(255,255,255,0.04)", color: "var(--muted)" }}
                    >
                      <span className="font-semibold" style={{ color: parentAccent }}>
                        {parentProfile?.display_name ?? "Unknown"}
                      </span>{" "}
                      {parentComment.content.slice(0, 80)}{parentComment.content.length > 80 ? "…" : ""}
                    </div>
                  )}
                  {/* Comment content or edit box */}
                  {editingId === c.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        rows={2}
                        maxLength={500}
                        className="w-full px-2 py-1.5 text-sm rounded-lg resize-none"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: "var(--foreground)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          outline: "none",
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(c.id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg"
                          style={{ backgroundColor: "var(--team-accent)", color: "#fff" }}
                        >Save</button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-xs rounded-lg"
                          style={{ color: "var(--muted)", backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                        >Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm leading-snug" style={{ color: "var(--foreground)" }}>
                        {renderText(c.content, profileMap)}
                      </p>
                      {confirmDeleteId === c.id && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs" style={{ color: "var(--muted)" }}>Delete this comment?</span>
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="px-2 py-0.5 text-xs font-semibold rounded"
                            style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
                          >Delete</button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 text-xs rounded"
                            style={{ color: "var(--muted)", border: "1px solid rgba(255,255,255,0.1)" }}
                          >Cancel</button>
                        </div>
                      )}
                    </>
                  )}
                  {/* Reactions + Reply button */}
                  {editingId !== c.id && (
                    <div className="flex items-center flex-wrap gap-1 mt-1.5">
                      {Object.entries(reactions[c.id] ?? {}).map(([emoji, { count, userReacted }]) => (
                        <button
                          key={emoji}
                          onClick={() => toggleReaction(c.id, emoji)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-colors"
                          style={{
                            backgroundColor: userReacted ? "rgba(225,6,0,0.15)" : "rgba(255,255,255,0.06)",
                            border: userReacted ? "1px solid rgba(225,6,0,0.4)" : "1px solid rgba(255,255,255,0.1)",
                            color: userReacted ? "var(--f1-red)" : "var(--muted)",
                          }}
                        >
                          {emoji} <span>{count}</span>
                        </button>
                      ))}
                      {currentUser && (
                        <div className="relative">
                          <button
                            onClick={() => setShowPickerFor((prev) => prev === c.id ? null : c.id)}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs transition-colors"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              color: "var(--muted)",
                            }}
                          >+</button>
                          {showPickerFor === c.id && (
                            <div
                              className="absolute bottom-8 left-0 flex gap-1 p-1.5 rounded-xl z-10"
                              style={{ backgroundColor: "#13131f", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 4px 20px rgba(0,0,0,0.6)" }}
                            >
                              {REACTION_EMOJIS.map((e) => (
                                <button
                                  key={e}
                                  onClick={() => toggleReaction(c.id, e)}
                                  className="text-lg p-1 rounded-lg hover:bg-white/10 active:bg-white/10 transition-colors"
                                >{e}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {currentUser && (
                        <button
                          onClick={() => { setReplyingTo(c); setText(""); setShowEmojis(false); setConfirmDeleteId(null); }}
                          className="text-xs px-2 py-0.5 rounded-full transition-colors"
                          style={{ color: "var(--muted)", backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                        >↩ Reply</button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {/* Bottom sentinel for jump-to-latest */}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Jump-to-latest pill */}
      {hasNewMessages && (
        <div className="flex justify-center mb-2">
          <button
            onClick={() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              setHasNewMessages(false);
            }}
            className="px-4 py-1.5 text-xs font-semibold rounded-full shadow-lg"
            style={{ backgroundColor: "var(--team-accent)", color: "#fff" }}
          >
            ↓ New messages
          </button>
        </div>
      )}

      {currentUser ? (
        <div className="mt-3">
          {/* Replying-to banner */}
          {replyingTo && (
            <div
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl mb-2"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                Replying to{" "}
                <span className="font-semibold" style={{ color: profileAccent(profileMap.get(replyingTo.user_id)) }}>
                  {profileMap.get(replyingTo.user_id)?.display_name ?? "Unknown"}
                </span>
              </p>
              <button onClick={() => setReplyingTo(null)} className="text-xs shrink-0" style={{ color: "var(--muted)" }}>✕</button>
            </div>
          )}

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
          {submitError && (
            <p className="text-xs mt-2 text-center" style={{ color: "#ef4444" }}>
              Failed to post. Please try again.
            </p>
          )}
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
  const [raceActivity, setRaceActivity] = useState<Record<number, { content: string; userId: string; createdAt: string }>>({});
  const [lastReadTimes, setLastReadTimes] = useState<Record<number, number>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const supabase = createClient();

  const race = RACES.find((r) => r.r === selectedRound)!;

  // Load last-read timestamps + latest comment per revealed round
  useEffect(() => {
    const times: Record<number, number> = {};
    for (const r of RACES) {
      const val = localStorage.getItem(`f1_thread_last_read_${r.r}`);
      if (val) times[r.r] = parseInt(val, 10);
    }
    setLastReadTimes(times);

    const revealedRounds = RACES.filter((r) => new Date(r.startUtc) < new Date()).map((r) => r.r);
    if (!revealedRounds.length) return;
    supabase
      .from("race_comments")
      .select("round, content, user_id, created_at")
      .in("round", revealedRounds)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const activity: Record<number, { content: string; userId: string; createdAt: string }> = {};
        for (const row of data ?? []) {
          if (!activity[row.round]) {
            activity[row.round] = { content: row.content, userId: row.user_id, createdAt: row.created_at };
          }
        }
        setRaceActivity(activity);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectRound(round: number) {
    setSelectedRound(round);
    markAsRead(round);
    setLastReadTimes((prev) => ({ ...prev, [round]: Date.now() }));
  }


  return (
    <div>
      {/* Race header + dropdown selector */}
      <div className="relative mb-6">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-colors active:bg-white/5"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderLeft: "3px solid var(--team-accent)",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{race.flag}</span>
            <div className="min-w-0 text-left">
              <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                {race.name.replace(" Grand Prix", " GP")}
              </p>
              {(() => {
                const activity = raceActivity[race.r];
                const lastRead = lastReadTimes[race.r] ?? 0;
                const raceStarted = new Date(race.startUtc) < new Date();
                const hasUnread = raceStarted && !!activity && new Date(activity.createdAt).getTime() > lastRead;
                const previewAuthor = activity ? (profileMap.get(activity.userId)?.display_name?.split(" ")[0] ?? "Someone") : null;
                if (raceStarted && previewAuthor && activity) {
                  return (
                    <p className="text-xs truncate" style={{ color: hasUnread ? "rgba(255,255,255,0.5)" : "var(--muted)" }}>
                      {previewAuthor}: {activity.content}
                    </p>
                  );
                }
                if (!raceStarted) {
                  return <p className="text-xs" style={{ color: "var(--muted)" }}>Upcoming race</p>;
                }
                return null;
              })()}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(() => {
              const totalUnread = RACES.filter((r) => {
                const a = raceActivity[r.r];
                const lr = lastReadTimes[r.r] ?? 0;
                return !!a && new Date(a.createdAt).getTime() > lr && r.r !== selectedRound;
              }).length;
              return totalUnread > 0 ? (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "#e10600", color: "#fff" }}
                >{totalUnread}</span>
              ) : null;
            })()}
            <span
              className="text-lg transition-transform duration-200"
              style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", color: "var(--muted)" }}
            >▾</span>
          </div>
        </button>

        {/* Dropdown list */}
        {dropdownOpen && (
          <div
            className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-30"
            style={{ border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "#131313", boxShadow: "0 8px 32px rgba(0,0,0,0.7)", maxHeight: "280px", overflowY: "auto" }}
          >
            {RACES.map((r, i) => {
              const rIsPast = new Date(r.startUtc) < new Date();
              const isSelected = selectedRound === r.r;
              const activity = raceActivity[r.r];
              const lastRead = lastReadTimes[r.r] ?? 0;
              const hasUnread = rIsPast && !!activity && new Date(activity.createdAt).getTime() > lastRead;
              const previewAuthor = activity ? (profileMap.get(activity.userId)?.display_name?.split(" ")[0] ?? "Someone") : null;
              return (
                <button
                  key={r.r}
                  onClick={() => { selectRound(r.r); setDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2.5 transition-colors active:bg-white/5"
                  style={{
                    backgroundColor: isSelected ? "rgba(255,255,255,0.07)" : "transparent",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                    borderLeft: isSelected ? "3px solid var(--team-accent)" : "3px solid transparent",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm shrink-0">{r.flag}</span>
                    <span
                      className="text-sm font-semibold flex-1 truncate"
                      style={{ color: isSelected ? "var(--foreground)" : rIsPast ? "var(--muted)" : "rgba(255,255,255,0.35)" }}
                    >
                      {r.name.replace(" Grand Prix", " GP")}
                    </span>
                    {hasUnread && (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "#e10600" }} />
                    )}
                    {!rIsPast && (
                      <span className="text-[10px] font-semibold shrink-0" style={{ color: "rgba(255,255,255,0.2)" }}>
                        upcoming
                      </span>
                    )}
                  </div>
                  {rIsPast && previewAuthor && activity && (
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: hasUnread ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.22)", paddingLeft: "22px" }}
                    >
                      {previewAuthor}: {activity.content}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
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

function MembersTab({ profiles, loading, error }: { profiles: Profile[]; loading: boolean; error: boolean }) {
  if (loading) {
    return <p className="text-sm py-4" style={{ color: "var(--muted)" }}>Loading…</p>;
  }
  if (error) {
    return <p className="text-sm py-4 text-center" style={{ color: "var(--muted)" }}>Couldn&apos;t load members. Check your connection.</p>;
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
              <div className="flex items-center gap-3 mt-1">
                {favDrivers.map((id) => {
                  const img = DRIVER_IMAGES[id];
                  const lastName = driverName(id).split(" ").pop() ?? driverName(id);
                  return (
                    <div key={id} className="flex flex-col items-center gap-0.5">
                      <div className="relative w-12 h-12 shrink-0 overflow-hidden">
                        {img ? (
                          <Image src={img} alt={driverName(id)} fill style={{ objectFit: "contain", objectPosition: "top" }} sizes="48px" />
                        ) : (
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                            <span className="text-sm" style={{ color: "var(--muted)" }}>{lastName[0]}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium" style={{ color: "var(--muted)" }}>{lastName}</span>
                    </div>
                  );
                })}
              </div>
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

function GroupPageInner() {
  const { user, refreshNotifications } = useAuth();
  const searchParams = useSearchParams();
  const now = new Date();

  const [tab, setTab] = useState<"feed" | "races" | "members">(() => {
    const t = searchParams.get("tab");
    return t === "races" || t === "members" || t === "feed" ? t : "feed";
  });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profilesError, setProfilesError] = useState(false);
  const supabase = createClient();

  // selectedRound lives here so FeedTab can deep-link into a race
  const [selectedRound, setSelectedRound] = useState<number>(() => {
    const r = searchParams.get("round");
    if (r) {
      const parsed = parseInt(r, 10);
      if (RACES.some((race) => race.r === parsed)) return parsed;
    }
    // Live race weekend?
    const liveRace = RACES.find(
      (r) => r.weekendStartUtc && new Date(r.weekendStartUtc) <= now && new Date(r.startUtc) >= now
    );
    if (liveRace) return liveRace.r;
    // Next upcoming race
    const nextRace = RACES.find((r) => new Date(r.startUtc) > now);
    if (nextRace) return nextRace.r;
    // Fall back to last past race
    const past = RACES.filter((r) => new Date(r.startUtc) < now);
    return past.length > 0 ? past[past.length - 1].r : RACES[0].r;
  });

  useEffect(() => {
    supabase
      .from("profiles")
      .select(
        "id,display_name,fav_team_1,fav_team_2,fav_team_3,fav_driver_1,fav_driver_2,fav_driver_3"
      )
      .then(({ data, error }) => {
        if (error) { setProfilesError(true); } else { setProfiles(data ?? []); }
        setLoadingProfiles(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const tabOrder: Array<"feed" | "races" | "members"> = ["feed", "races", "members"];

  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const idx = tabOrder.indexOf(tab);
    if (dx < 0 && idx < tabOrder.length - 1) setTab(tabOrder[idx + 1]);
    if (dx > 0 && idx > 0) setTab(tabOrder[idx - 1]);
  }

  function goToRace(round: number) {
    setSelectedRound(round);
    setTab("races");
  }

  const tabs = [
    { id: "feed" as const,    label: "Feed"    },
    { id: "races" as const,   label: "Race Chat"   },
    { id: "members" as const, label: "Members" },
  ];

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto px-4 pt-5 pb-28 md:pb-6">
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
          Community
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

      {/* Tab content — swipe left/right to switch tabs */}
      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
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
        {tab === "members" && <MembersTab profiles={profiles} loading={loadingProfiles} error={profilesError} />}
      </div>
    </div>
  );
}

export default function GroupPage() {
  return (
    <Suspense>
      <GroupPageInner />
    </Suspense>
  );
}
