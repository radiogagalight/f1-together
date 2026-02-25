"use client";

import { useAuth } from "@/components/AuthProvider";
import { useMidseasonPicks } from "@/hooks/useMidseasonPicks";
import CategoryCard from "./CategoryCard";
import { CATEGORIES, RACES } from "@/lib/data";
import type { MidseasonPicks } from "@/lib/types";

const RACE_12 = RACES.find((r) => r.r === 12)!; // Belgian GP  — window opens
const RACE_13 = RACES.find((r) => r.r === 13)!; // Hungarian GP — window closes

const MIDSEASON_CATS = CATEGORIES.filter(
  (c) => c.key === "wdcWinner" || c.key === "wccWinner"
);

export default function MidseasonPredictions() {
  const { user } = useAuth();
  const { picks, setPick, savedKey, loading } = useMidseasonPicks(user?.id);

  const now = Date.now();
  const windowStart = new Date(RACE_12.startUtc).getTime();
  const windowEnd   = new Date(RACE_13.startUtc).getTime();
  const isOpen   = now >= windowStart && now < windowEnd;
  const isLocked = now >= windowEnd;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="inline-block w-1 h-5 rounded-full shrink-0"
          style={{ backgroundColor: "var(--team-accent)" }}
        />
        <h2
          className="text-sm font-bold uppercase tracking-widest shrink-0"
          style={{ color: "var(--foreground)" }}
        >
          Mid-Season
        </h2>
        <div className="flex-1 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
      </div>

      {/* Status banner */}
      {!isOpen && !isLocked && (
        <div
          className="rounded-xl px-4 py-3 text-sm mb-3"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--muted)" }}
        >
          Opens after the Belgian GP (Round 12 · 19 Jul) and closes at the Hungarian GP lights out (Round 13 · 26 Jul).
        </div>
      )}

      {isOpen && (
        <div
          className="rounded-xl px-4 py-3 text-sm mb-3"
          style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}
        >
          Window open — locks at Hungarian GP lights out (26 Jul).
        </div>
      )}

      {isLocked && (
        <div
          className="rounded-xl px-4 py-3 text-sm mb-3"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--muted)" }}
        >
          🔒 Mid-season predictions are locked — the Hungarian GP has started.
        </div>
      )}

      {/* Picks */}
      {loading ? (
        <p className="text-sm py-2" style={{ color: "var(--muted)" }}>Loading…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {MIDSEASON_CATS.map((cat) => (
            <CategoryCard
              key={cat.key}
              category={cat}
              value={picks?.[cat.key as keyof MidseasonPicks] ?? null}
              isSaved={savedKey === (cat.key as keyof MidseasonPicks)}
              disabled={!isOpen}
              onPick={(key, value) => setPick(key as keyof MidseasonPicks, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
