"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { RACES, formatRaceDate, flagToCC } from "@/lib/data";
import { loadRacePickStatuses } from "@/lib/raceStorage";

export default function AllPredictionsPage() {
  const { user, timezoneOffset } = useAuth();
  const [pickedRounds, setPickedRounds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadRacePickStatuses(user.id, supabase).then((statuses) => {
      setPickedRounds(statuses);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
        All Predictions
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        {loading ? "Loading…" : `${pickedRounds.size} of 24 races picked`}
      </p>

      <div className="flex flex-col rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {RACES.map((race, i) => {
          const isPast = new Date(race.date + "T14:00:00Z").getTime() < Date.now();
          const hasPick = pickedRounds.has(race.r);
          const isLast = i === RACES.length - 1;

          let badgeText = "No pick";
          let badgeBg = "rgba(255,255,255,0.04)";
          let badgeColor = "var(--muted)";
          let badgeBorder = "var(--border)";

          if (isPast && !hasPick) {
            badgeText = "Locked";
          } else if (hasPick) {
            badgeText = "Picked ✓";
            badgeBg = "rgba(34,197,94,0.1)";
            badgeColor = "#22c55e";
            badgeBorder = "rgba(34,197,94,0.3)";
          }

          return (
            <Link
              key={race.r}
              href={`/predictions/race/${race.r}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
              style={{
                borderBottom: isLast ? "none" : "1px solid var(--border)",
                opacity: isPast && !hasPick ? 0.5 : 1,
              }}
            >
              <span className="font-mono text-xs shrink-0" style={{ color: "var(--muted)", minWidth: "26px" }}>
                R{String(race.r).padStart(2, "0")}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://flagcdn.com/w40/${flagToCC(race.flag)}.png`} width={24} height={18} alt="" className="shrink-0 rounded-sm" style={{ objectFit: "cover" }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                  {race.name.replace(" Grand Prix", " GP")}
                </div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {formatRaceDate(race, timezoneOffset)}
                  {race.sprint && (
                    <span
                      className="ml-2 text-[9px] px-1 py-px rounded font-bold uppercase tracking-wider"
                      style={{ backgroundColor: "rgba(255,200,0,0.1)", color: "#ffc800", border: "1px solid rgba(255,200,0,0.3)" }}
                    >
                      Sprint
                    </span>
                  )}
                </div>
              </div>
              <span
                className="shrink-0 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider"
                style={{ backgroundColor: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` }}
              >
                {badgeText}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
