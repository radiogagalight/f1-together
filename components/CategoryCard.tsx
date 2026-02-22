"use client";

import { useState } from "react";
import type { Category, SeasonPicks, Driver, Constructor } from "@/lib/types";
import { DRIVERS, CONSTRUCTORS } from "@/lib/data";

interface Props {
  category: Category;
  value: string | null;
  isSaved: boolean;
  onPick: (key: keyof SeasonPicks, value: string) => void;
}

function getLabel(category: Category, value: string | null): string {
  if (!value) return "Not picked";
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
    onPick(category.key, id);
    setOpen(false);
  }

  const displayLabel = getLabel(category, value);
  const hasPick = value !== null;

  return (
    <div
      className="rounded-xl border border-border bg-surface overflow-hidden"
    >
      {/* Header — tap to expand/collapse */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors active:bg-surface-hover"
        style={{ minHeight: "56px" }}
        aria-expanded={open}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-foreground leading-tight">
            {category.label}
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
            {isSaved ? "Saved ✓" : displayLabel}
          </span>
        </div>
        <span
          className="shrink-0 text-lg transition-transform duration-200"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--muted)",
          }}
        >
          ▾
        </span>
      </button>

      {/* Picker list — shown when open */}
      {open && (
        <div className="border-t border-border">
          <p className="px-4 py-2 text-xs text-muted">{category.description}</p>
          <ul>
            {items.map((item) => {
              const isSelected = value === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handlePick(item.id)}
                    className="flex w-full items-center gap-3 px-4 transition-colors active:bg-surface-hover"
                    style={{ minHeight: "52px" }}
                  >
                    {/* Selection indicator */}
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
                        {item.name}
                      </span>
                      {"team" in item && (
                        <span className="text-xs text-muted leading-tight">
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
