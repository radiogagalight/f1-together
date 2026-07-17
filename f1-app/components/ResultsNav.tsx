"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RACES, DRIVERS } from "@/lib/data";

const TABS = [
  { href: "/results", label: "Season", match: (p: string) => p === "/results" },
  {
    href: "/results/races",
    label: "Races",
    match: (p: string) => p.startsWith("/results/races"),
  },
  {
    href: "/results/drivers",
    label: "Drivers",
    match: (p: string) => p.startsWith("/results/drivers"),
  },
] as const;

export default function ResultsNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  const raceDetail = pathname.match(/^\/results\/races\/(\d+)$/);
  const driverDetail = pathname.match(/^\/results\/drivers\/([^/]+)$/);
  const race =
    raceDetail != null
      ? RACES.find((r) => r.r === parseInt(raceDetail[1], 10))
      : null;
  const driver =
    driverDetail != null
      ? DRIVERS.find((d) => d.id === decodeURIComponent(driverDetail[1]))
      : null;

  if (mobile && race) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          href="/results/races"
          className="text-sm font-semibold shrink-0"
          style={{ color: "var(--muted)" }}
        >
          ← Back
        </Link>
        <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
          {race.flag} {race.name.replace(" Grand Prix", " GP")}
        </span>
      </div>
    );
  }

  if (mobile && driver) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <Link
          href="/results/drivers"
          className="text-sm font-semibold shrink-0"
          style={{ color: "var(--muted)" }}
        >
          ← Back
        </Link>
        <span className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
          {driver.name}
        </span>
      </div>
    );
  }

  if (mobile) {
    return (
      <div className="flex gap-1 px-3 py-2 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                backgroundColor: isActive ? "var(--f1-red)" : "rgba(255,255,255,0.06)",
                color: isActive ? "#fff" : "var(--muted)",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full px-3 py-5">
      <div className="flex items-center gap-2 mb-4 px-2">
        <span
          className="inline-block h-0.5 w-4 rounded-full"
          style={{ backgroundColor: "var(--f1-red)" }}
        />
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--muted)" }}
        >
          2026 Results
        </span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {TABS.map((tab) => {
          const isActive = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{
                backgroundColor: isActive ? "rgba(225,6,0,0.12)" : "transparent",
                color: isActive ? "var(--f1-red)" : "var(--muted)",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
