"use client";

import { useState } from "react";
import { DRIVERS } from "@/lib/data";
import { TEAM_COLORS } from "@/lib/teamColors";

interface Props {
  label: string;
  value: string | null;
  isSaved: boolean;
  disabled: boolean;
  onPick: (value: string | null) => void;
}

export default function DriverSelect({ label, value, isSaved, disabled, onPick }: Props) {
  const [open, setOpen] = useState(false);

  const driver = value ? DRIVERS.find((d) => d.id === value) : null;
  const displayName = driver ? driver.name : "Make your prediction";
  const hasPick = value !== null;
  const teamColor = driver
    ? (TEAM_COLORS[driver.team.toLowerCase().replace(/\s+/g, "-")] ?? null)
    : null;

  function handlePick(id: string) {
    onPick(value === id ? null : id);
    setOpen(false);
  }

  const carbonBg = "repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 10px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 10px)";

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "rgb(12, 8, 10)",
        backgroundImage: carbonBg,
        border: "1px solid rgba(225,6,0,0.2)",
        borderLeft: hasPick && teamColor ? `3px solid ${teamColor}` : "2px solid rgba(225,6,0,0.45)",
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
          <span
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: "var(--muted)" }}
          >
            {label}
          </span>
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
        {disabled ? (
          <span className="shrink-0 text-sm" style={{ color: "var(--muted)" }}>🔒</span>
        ) : (
          <span
            className="shrink-0 text-lg transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "var(--muted)" }}
          >
            ▾
          </span>
        )}
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
                    <div className="flex flex-col items-start min-w-0">
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
