"use client";

import { useState } from "react";
import type { Category, SeasonPicks, Driver, Constructor } from "@/lib/types";
import { DRIVERS, CONSTRUCTORS } from "@/lib/data";
import { TEAM_COLORS } from "@/lib/teamColors";

interface Props {
  category: Category;
  value: string | null;
  isSaved: boolean;
  onPick: (key: keyof SeasonPicks, value: string | null) => void;
}

const CARBON_BG =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 10px), " +
  "repeating-linear-gradient(-45deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 10px)";

function teamColorForDriver(driver: Driver): string | null {
  return TEAM_COLORS[driver.team.toLowerCase().replace(/\s+/g, "-")] ?? null;
}

function getPickColor(category: Category, value: string | null): string | null {
  if (!value) return null;
  if (category.type === "driver") {
    const d = DRIVERS.find((d) => d.id === value);
    return d ? teamColorForDriver(d) : null;
  }
  return TEAM_COLORS[value] ?? null;
}

function getLabel(category: Category, value: string | null): string {
  if (!value) return "Make your pick";
  if (category.type === "driver") {
    const d = DRIVERS.find((d) => d.id === value);
    return d ? d.name : value;
  }
  const c = CONSTRUCTORS.find((c) => c.id === value);
  return c ? c.name : value;
}

export default function CategoryCard({ category, value, isSaved, onPick }: Props) {
  const [open, setOpen] = useState(false);

  const items: (Driver | Constructor)[] =
    category.type === "driver" ? DRIVERS : CONSTRUCTORS;

  function handlePick(id: string) {
    onPick(category.key, value === id ? null : id);
    setOpen(false);
  }

  const displayLabel = getLabel(category, value);
  const hasPick = value !== null;
  const pickColor = getPickColor(category, value);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "rgb(12, 8, 10)",
        backgroundImage: CARBON_BG,
        border: "1px solid rgba(225,6,0,0.2)",
        borderLeft: hasPick && pickColor
          ? `3px solid ${pickColor}`
          : "2px solid rgba(225,6,0,0.45)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors active:bg-surface-hover"
        style={{ minHeight: "60px" }}
        aria-expanded={open}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
            {category.label}
          </span>
          <span className="text-xs leading-tight" style={{ color: "var(--muted)" }}>
            {category.description}
          </span>
          <span
            className="text-sm leading-tight truncate mt-0.5"
            style={{
              color: isSaved
                ? "var(--f1-red)"
                : hasPick && pickColor
                ? pickColor
                : "var(--muted)",
            }}
          >
            {isSaved ? "Saved ✓" : displayLabel}
          </span>
        </div>
        <span
          className="shrink-0 text-lg transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "var(--muted)" }}
        >
          ▾
        </span>
      </button>

      {/* Picker list */}
      {open && (
        <div className="border-t" style={{ borderColor: "rgba(225,6,0,0.2)" }}>
          <ul>
            {items.map((item) => {
              const isSelected = value === item.id;
              const itemColor =
                category.type === "driver"
                  ? teamColorForDriver(item as Driver)
                  : (TEAM_COLORS[item.id] ?? null);
              const activeColor = itemColor ?? "var(--f1-red)";
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handlePick(item.id)}
                    className="flex w-full items-center gap-3 px-4 transition-colors active:bg-surface-hover"
                    style={{ minHeight: "52px" }}
                  >
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold"
                      style={{
                        borderColor: isSelected ? activeColor : "var(--border)",
                        backgroundColor: isSelected ? activeColor : "transparent",
                        color: isSelected ? "#fff" : "transparent",
                      }}
                    >
                      ✓
                    </span>
                    <div className="flex flex-col items-start min-w-0">
                      <span
                        className="text-sm font-medium leading-tight"
                        style={{ color: isSelected ? activeColor : "var(--foreground)" }}
                      >
                        {item.name}
                      </span>
                      {"team" in item && (
                        <span className="text-xs leading-tight" style={{ color: "var(--muted)" }}>
                          {(item as Driver).team}
                        </span>
                      )}
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
