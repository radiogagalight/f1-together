"use client";

import Link from "next/link";
import { RACES, formatDate } from "@/lib/data";

export default function RacePredictionsPage() {
  const now = Date.now();
  const nextIdx = Math.max(0, RACES.findIndex((r) => new Date(r.date + "T14:00:00Z").getTime() > now));

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
        Race Predictions
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Select a race to make your predictions
      </p>

      <div className="flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {RACES.map((race, i) => {
          const isPast = new Date(race.date + "T14:00:00Z").getTime() < now;
          const isNext = race.r === RACES[nextIdx].r;
          const isLast = i === RACES.length - 1;

          return (
            <Link
              key={race.r}
              href={`/predictions/race/${race.r}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
              style={{
                borderBottom: isLast ? "none" : "1px solid var(--border)",
                borderLeft: isNext ? "2px solid var(--f1-red)" : "2px solid transparent",
                backgroundColor: isNext ? "rgba(225,6,0,0.06)" : "transparent",
                opacity: isPast ? 0.45 : 1,
              }}
            >
              <span className="font-mono text-xs shrink-0" style={{ color: "var(--muted)", minWidth: "26px" }}>
                R{String(race.r).padStart(2, "0")}
              </span>
              <span className="text-xl leading-none shrink-0">{race.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                  {race.name.replace(" Grand Prix", " GP")}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{formatDate(race.date)}</span>
                  {isNext && (
                    <span
                      className="text-[9px] px-1 py-px rounded font-bold uppercase tracking-wider"
                      style={{ backgroundColor: "rgba(225,6,0,0.2)", color: "var(--f1-red)", border: "1px solid rgba(225,6,0,0.4)" }}
                    >
                      Next
                    </span>
                  )}
                  {race.sprint && (
                    <span
                      className="text-[9px] px-1 py-px rounded font-bold uppercase tracking-wider"
                      style={{ backgroundColor: "rgba(255,200,0,0.1)", color: "#ffc800", border: "1px solid rgba(255,200,0,0.3)" }}
                    >
                      Sprint
                    </span>
                  )}
                  {isPast && (
                    <span className="text-[10px]" style={{ color: "var(--muted)" }}>🔒</span>
                  )}
                </div>
              </div>
              <span style={{ color: "var(--muted)", fontSize: "12px" }}>›</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
