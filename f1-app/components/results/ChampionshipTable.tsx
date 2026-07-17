"use client";

import Link from "next/link";
import { TEAM_COLORS, hexToRgb } from "@/lib/teamColors";
import type { ChampionshipStanding } from "@/lib/types";

export function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span
        className="inline-block h-1 w-8 rounded-full"
        style={{ backgroundColor: "var(--f1-red)" }}
      />
      <span
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
    </div>
  );
}

function accentFor(standing: ChampionshipStanding): string {
  const id = standing.constructorId ?? standing.id;
  return TEAM_COLORS[id] ?? "#e10600";
}

export function ChampionshipTable({
  title,
  standings,
  hrefForRow,
  highlightId,
}: {
  title: string;
  standings: ChampionshipStanding[];
  hrefForRow?: (s: ChampionshipStanding) => string;
  highlightId?: string | null;
}) {
  if (standings.length === 0) return null;

  return (
    <section className="mb-8">
      <SectionHeader label={title} />
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
              <th
                className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider sticky left-0"
                style={{ color: "var(--muted)", backgroundColor: "#0f0f0f" }}
              >
                #
              </th>
              <th
                className="py-2.5 px-3 text-left text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                {title.includes("Constructor") ? "Team" : "Driver"}
              </th>
              <th
                className="py-2.5 px-2 text-right text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "var(--muted)" }}
              >
                Pts
              </th>
              <th
                className="py-2.5 px-2 text-right text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell"
                style={{ color: "var(--muted)" }}
              >
                W
              </th>
              <th
                className="py-2.5 px-2 text-right text-[10px] font-bold uppercase tracking-wider hidden sm:table-cell"
                style={{ color: "var(--muted)" }}
              >
                Pod
              </th>
              <th
                className="py-2.5 px-3 text-right text-[10px] font-bold uppercase tracking-wider hidden md:table-cell"
                style={{ color: "var(--muted)" }}
              >
                Pole
              </th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const accent = accentFor(s);
              const isHl = highlightId === s.id;
              const rowBg = isHl
                ? `rgba(${hexToRgb(accent)},0.12)`
                : i % 2 === 0
                ? "transparent"
                : "rgba(255,255,255,0.02)";
              const href = hrefForRow?.(s);
              const nameCell = href ? (
                <Link
                  href={href}
                  className="font-semibold hover:underline"
                  style={{ color: "var(--foreground)" }}
                >
                  {s.name}
                </Link>
              ) : (
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                  {s.name}
                </span>
              );

              return (
                <tr key={s.id} style={{ backgroundColor: rowBg }}>
                  <td
                    className="py-2.5 px-3 font-bold tabular-nums sticky left-0"
                    style={{
                      color: i < 3 ? accent : "var(--muted)",
                      backgroundColor: isHl ? `rgba(${hexToRgb(accent)},0.12)` : "#0f0f0f",
                    }}
                  >
                    {i + 1}
                  </td>
                  <td className="py-2.5 px-3">{nameCell}</td>
                  <td
                    className="py-2.5 px-2 text-right font-bold tabular-nums"
                    style={{ color: "var(--foreground)" }}
                  >
                    {s.points}
                  </td>
                  <td
                    className="py-2.5 px-2 text-right tabular-nums hidden sm:table-cell"
                    style={{ color: "var(--muted)" }}
                  >
                    {s.wins}
                  </td>
                  <td
                    className="py-2.5 px-2 text-right tabular-nums hidden sm:table-cell"
                    style={{ color: "var(--muted)" }}
                  >
                    {s.podiums}
                  </td>
                  <td
                    className="py-2.5 px-3 text-right tabular-nums hidden md:table-cell"
                    style={{ color: "var(--muted)" }}
                  >
                    {s.poles}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ResultsEmptyState() {
  return (
    <div
      className="rounded-xl px-5 py-10 text-center"
      style={{
        border: "1px dashed rgba(255,255,255,0.12)",
        backgroundColor: "rgba(255,255,255,0.02)",
      }}
    >
      <p className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
        No race results yet
      </p>
      <p className="text-xs leading-relaxed max-w-sm mx-auto" style={{ color: "var(--muted)" }}>
        Championship tables, race classifications, and driver form appear here after each Grand
        Prix is logged.
      </p>
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-lg"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        />
      ))}
    </div>
  );
}
