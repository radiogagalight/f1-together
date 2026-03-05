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
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: "1px solid rgba(255,200,0,0.3)",
        background: "linear-gradient(135deg, rgba(255,200,0,0.06) 0%, rgba(10,10,18,0.8) 100%)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,200,0,0.15)" }}
      >
        <div className="flex items-center gap-3 mb-1">
          <span
            className="inline-block w-1 h-5 rounded-full shrink-0"
            style={{ backgroundColor: "#ffc800" }}
          />
          <h2
            className="text-sm font-bold uppercase tracking-widest"
            style={{ color: "#ffc800" }}
          >
            Mid-Season
          </h2>
          {isOpen && (
            <span
              className="text-[10px] font-bold px-2 py-px rounded-full uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(34,197,94,0.15)",
                border: "1px solid rgba(34,197,94,0.4)",
                color: "#22c55e",
              }}
            >
              Window Open
            </span>
          )}
          {isLocked && (
            <span
              className="text-[10px] font-bold px-2 py-px rounded-full uppercase tracking-wider"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "var(--muted)",
              }}
            >
              🔒 Locked
            </span>
          )}
        </div>
        <p className="text-xs ml-4" style={{ color: "rgba(255,200,0,0.65)" }}>
          {isLocked
            ? "Mid-season predictions are locked — the Hungarian GP has started."
            : isOpen
            ? "Revise your championship picks — window closes at Hungarian GP lights out (26 Jul)."
            : "Revise your WDC & WCC picks at the halfway point. Opens after the Belgian GP (19 Jul)."}
        </p>
      </div>

      {/* Picks */}
      <div className="p-4">
        {loading ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
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
    </div>
  );
}
