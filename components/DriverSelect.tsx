"use client";

import { useState } from "react";
import { DRIVERS } from "@/lib/data";

interface Props {
  label: string;
  value: string | null;
  isSaved: boolean;
  disabled: boolean;
  onPick: (value: string) => void;
}

export default function DriverSelect({ label, value, isSaved, disabled, onPick }: Props) {
  const [open, setOpen] = useState(false);

  const driver = value ? DRIVERS.find((d) => d.id === value) : null;
  const displayName = driver ? driver.name : "Make your prediction";
  const hasPick = value !== null;

  function handlePick(id: string) {
    onPick(id);
    setOpen(false);
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
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
                : hasPick
                ? "var(--foreground)"
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
        <div className="border-t" style={{ borderColor: "var(--border)", maxHeight: "260px", overflowY: "auto" }}>
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
