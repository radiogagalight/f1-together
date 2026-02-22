"use client";

import { use } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RACES, formatDate } from "@/lib/data";
import { useRacePick } from "@/hooks/useRacePick";
import DriverSelect from "@/components/DriverSelect";
import type { RacePick } from "@/lib/types";

export default function RaceDetailPage({
  params,
}: {
  params: Promise<{ round: string }>;
}) {
  const { round: roundStr } = use(params);
  const round = parseInt(roundStr);
  const race = RACES.find((r) => r.r === round);
  const { user } = useAuth();
  const { picks, setPick, savedField, loading } = useRacePick(user?.id, round);

  if (!race) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-6">
        <p style={{ color: "var(--muted)" }}>Race not found.</p>
      </div>
    );
  }

  const isLocked = new Date(race.date + "T14:00:00Z").getTime() < Date.now();

  function pick(field: keyof RacePick, value: string | boolean) {
    if (!isLocked) setPick(field, value);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Race header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>
            Round {race.r} · {formatDate(race.date)}
          </span>
          {race.sprint && (
            <span
              className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
              style={{ backgroundColor: "rgba(255,200,0,0.1)", color: "#ffc800", border: "1px solid rgba(255,200,0,0.3)" }}
            >
              Sprint
            </span>
          )}
          {isLocked && (
            <span
              className="text-[9px] px-1.5 py-px rounded font-bold uppercase tracking-wider"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--muted)", border: "1px solid var(--border)" }}
            >
              🔒 Locked
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <span>{race.flag}</span>
          <span>{race.name}</span>
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{race.circuit}</p>
      </div>

      {isLocked && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--muted)" }}
        >
          Predictions for this race are locked — the race weekend has passed.
        </div>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>Loading…</p>
      ) : (
        <div className="flex flex-col gap-6">

          {/* ── Qualifying ── */}
          <div>
            <h2
              className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
              style={{ color: "var(--muted)" }}
            >
              <span className="inline-block h-px w-4 rounded-full" style={{ backgroundColor: "var(--f1-red)" }} />
              Qualifying
            </h2>
            <div className="flex flex-col gap-2">
              <DriverSelect
                label="Pole Position"
                value={picks?.qualPole ?? null}
                isSaved={savedField === "qualPole"}
                disabled={isLocked}
                onPick={(v) => pick("qualPole", v)}
              />
              <DriverSelect
                label="P2"
                value={picks?.qualP2 ?? null}
                isSaved={savedField === "qualP2"}
                disabled={isLocked}
                onPick={(v) => pick("qualP2", v)}
              />
              <DriverSelect
                label="P3"
                value={picks?.qualP3 ?? null}
                isSaved={savedField === "qualP3"}
                disabled={isLocked}
                onPick={(v) => pick("qualP3", v)}
              />
            </div>
          </div>

          {/* ── Race ── */}
          <div>
            <h2
              className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
              style={{ color: "var(--muted)" }}
            >
              <span className="inline-block h-px w-4 rounded-full" style={{ backgroundColor: "var(--f1-red)" }} />
              Race
            </h2>
            <div className="flex flex-col gap-2">
              <DriverSelect
                label="Race Winner"
                value={picks?.raceWinner ?? null}
                isSaved={savedField === "raceWinner"}
                disabled={isLocked}
                onPick={(v) => pick("raceWinner", v)}
              />
              <DriverSelect
                label="P2"
                value={picks?.raceP2 ?? null}
                isSaved={savedField === "raceP2"}
                disabled={isLocked}
                onPick={(v) => pick("raceP2", v)}
              />
              <DriverSelect
                label="P3"
                value={picks?.raceP3 ?? null}
                isSaved={savedField === "raceP3"}
                disabled={isLocked}
                onPick={(v) => pick("raceP3", v)}
              />
              <DriverSelect
                label="Fastest Lap"
                value={picks?.fastestLap ?? null}
                isSaved={savedField === "fastestLap"}
                disabled={isLocked}
                onPick={(v) => pick("fastestLap", v)}
              />
            </div>
          </div>

          {/* ── Safety Car ── */}
          <div>
            <h2
              className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
              style={{ color: "var(--muted)" }}
            >
              <span className="inline-block h-px w-4 rounded-full" style={{ backgroundColor: "var(--f1-red)" }} />
              Safety Car
            </h2>
            <div
              className="rounded-xl px-4 py-4"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
                Will there be a safety car deployment?
              </p>
              <div className="flex gap-3">
                {([true, false] as const).map((option) => {
                  const isSelected = picks?.safetyCar === option;
                  const isSaved = savedField === "safetyCar" && isSelected;
                  return (
                    <button
                      key={String(option)}
                      onClick={() => pick("safetyCar", option)}
                      disabled={isLocked}
                      className="flex-1 rounded-xl py-3 text-sm font-bold transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? option ? "rgba(225,6,0,0.15)" : "rgba(255,255,255,0.08)"
                          : "var(--background)",
                        border: isSelected
                          ? `1px solid ${option ? "var(--f1-red)" : "var(--foreground)"}`
                          : "1px solid var(--border)",
                        color: isSelected
                          ? option ? "var(--f1-red)" : "var(--foreground)"
                          : "var(--muted)",
                        opacity: isLocked ? 0.5 : 1,
                        cursor: isLocked ? "default" : "pointer",
                      }}
                    >
                      {option ? "Yes" : "No"}
                      {isSaved ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
