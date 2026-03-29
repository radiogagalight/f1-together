"use client";

import { useState } from "react";
import Image from "next/image";
import { DRIVERS } from "@/lib/data";
import { TEAM_COLORS } from "@/lib/teamColors";
import { DRIVER_IMAGES } from "@/lib/driverImages";

interface Props {
  label: string;
  value: string | null;
  isSaved: boolean;
  disabled: boolean;
  onPrediction: (value: string | null) => void;
  points?: number;
  resultStatus?: "correct" | "partial" | "wrong";
  pointsEarned?: number;
  boosted?: boolean;
  boostAvailable?: boolean;
  onBoost?: () => void;
}

export default function DriverSelect({ label, value, isSaved, disabled, onPrediction, points, resultStatus, pointsEarned, boosted, boostAvailable, onBoost }: Props) {
  const [open, setOpen] = useState(false);

  const driver = value ? DRIVERS.find((d) => d.id === value) : null;
  const displayName = driver ? driver.name : "Make your prediction";
  const hasPick = value !== null;
  const teamColor = driver
    ? (TEAM_COLORS[driver.team.toLowerCase().replace(/\s+/g, "-")] ?? null)
    : null;

  function handlePick(id: string) {
    onPrediction(value === id ? null : id);
    setOpen(false);
  }

  const carbonBg = "repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 10px)";

  const resultBorderLeft = resultStatus === "correct"
    ? "3px solid rgba(34,197,94,0.8)"
    : resultStatus === "partial"
    ? "3px solid rgba(245,158,11,0.7)"
    : resultStatus === "wrong"
    ? "3px solid rgba(239,68,68,0.6)"
    : null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "rgb(12, 8, 10)",
        backgroundImage: carbonBg,
        border: "1px solid rgba(225,6,0,0.2)",
        borderLeft: resultBorderLeft ?? (hasPick && teamColor ? `3px solid ${teamColor}` : "2px solid rgba(225,6,0,0.45)"),
      }}
    >
      {/* Header */}
      <button
        onClick={() => !disabled && setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors active:bg-surface-hover"
        style={{ minHeight: "56px", cursor: disabled ? "default" : "pointer" }}
        aria-expanded={open}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--muted)" }}
            >
              {label}
            </span>
            {points !== undefined && (
              <span
                className="text-[10px] font-bold px-1.5 py-px rounded-full"
                style={{
                  backgroundColor: boosted ? "rgba(255,200,0,0.22)" : "rgba(255,200,0,0.12)",
                  color: "#ffc800",
                  border: `1px solid ${boosted ? "rgba(255,200,0,0.7)" : "rgba(255,200,0,0.3)"}`,
                  lineHeight: 1.4,
                }}
              >
                {boosted ? `${points * 2} pts ⚡` : `${points} pts`}
              </span>
            )}
            {onBoost && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onBoost(); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onBoost(); } }}
                className="text-[10px] font-bold px-1.5 py-px rounded-full transition-colors"
                style={{
                  backgroundColor: boosted ? "rgba(255,200,0,0.18)" : boostAvailable ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                  color: boosted ? "#ffc800" : boostAvailable ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
                  border: boosted ? "1px solid rgba(255,200,0,0.5)" : "1px solid rgba(255,255,255,0.12)",
                  cursor: boosted || boostAvailable ? "pointer" : "default",
                  lineHeight: 1.4,
                }}
                title={boosted ? "Remove booster" : boostAvailable ? "Apply booster (2×)" : "No boosters left"}
              >
                {boosted ? "⚡ Boosted" : "⚡ Boost"}
              </span>
            )}
          </div>
          <span
            className="text-sm leading-tight truncate"
            style={{
              color: isSaved
                ? "var(--f1-red)"
                : hasPick && teamColor
                ? teamColor
                : "var(--muted)",
            }}
          >
            {isSaved ? "Saved ✓" : displayName}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {driver && DRIVER_IMAGES[driver.id] && (
            <div className="relative w-16 h-16 shrink-0 overflow-hidden">
              <Image
                src={DRIVER_IMAGES[driver.id]}
                alt={driver.name}
                fill
                style={{ objectFit: "contain", objectPosition: "top" }}
                sizes="64px"
              />
            </div>
          )}
          {disabled ? (
            resultStatus ? (
              <span
                className="text-xs font-black"
                style={{
                  color: resultStatus === "correct" ? "#22c55e"
                       : resultStatus === "partial" ? "#f59e0b"
                       : "#ef4444",
                }}
              >
                {resultStatus === "correct" ? `✓ +${pointsEarned}` : resultStatus === "partial" ? `~ +${pointsEarned}` : "✗"}
              </span>
            ) : (
              <span className="text-sm" style={{ color: "var(--muted)" }}>🔒</span>
            )
          ) : (
            <span
              className="text-lg transition-transform duration-200"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "var(--muted)" }}
            >
              ▾
            </span>
          )}
        </div>
      </button>

      {/* Driver list */}
      {open && !disabled && (
        <div className="border-t" style={{ borderColor: "rgba(225,6,0,0.2)", maxHeight: "260px", overflowY: "auto" }}>
          <ul>
            {DRIVERS.map((d) => {
              const isSelected = value === d.id;
              return (
                <li key={d.id}>
                  <button
                    onClick={() => handlePick(d.id)}
                    className="flex w-full items-center gap-3 px-4 transition-colors active:bg-surface-hover"
                    style={{ minHeight: "52px" }}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
                      style={{
                        borderColor: isSelected ? "var(--f1-red)" : "var(--border)",
                        backgroundColor: isSelected ? "var(--f1-red)" : "transparent",
                        color: isSelected ? "#fff" : "transparent",
                      }}
                    >
                      ✓
                    </span>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span
                        className="text-sm font-medium leading-tight"
                        style={{ color: isSelected ? "var(--f1-red)" : "var(--foreground)" }}
                      >
                        {d.name}
                      </span>
                      <span className="text-xs leading-tight" style={{ color: "var(--muted)" }}>
                        {d.team}
                      </span>
                    </div>
                    {DRIVER_IMAGES[d.id] && (
                      <div className="relative w-14 h-14 shrink-0 overflow-hidden">
                        <Image
                          src={DRIVER_IMAGES[d.id]}
                          alt={d.name}
                          fill
                          style={{ objectFit: "contain", objectPosition: "top" }}
                          sizes="56px"
                        />
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
