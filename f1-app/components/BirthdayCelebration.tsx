"use client";

import { useEffect, useState } from "react";
import { BAHRAIN_PALETTE } from "@/components/BahrainHeroScene";

const GOLD = "oklch(0.82 0.14 85)";
const PINK = "oklch(0.78 0.13 350)";
const CONFETTI_COLORS = [BAHRAIN_PALETTE.brightRed, BAHRAIN_PALETTE.bahrainWhite, GOLD, PINK] as const;

/** Deterministic pseudo-random so every piece is stable across renders */
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const CONFETTI = Array.from({ length: 48 }, (_, i) => ({
  left: rand(i) * 100,
  delay: rand(i + 100) * 0.9,
  dur: 2.6 + rand(i + 200) * 1.8,
  drift: (rand(i + 300) - 0.5) * 160,
  spin: 360 + rand(i + 400) * 720,
  w: 6 + rand(i + 500) * 5,
  h: 9 + rand(i + 600) * 7,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  round: i % 5 === 0,
}));

/** One-shot confetti burst over the page on load; hidden for reduced motion via CSS. */
function ConfettiBurst() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setShow(false), 5200);
    return () => clearTimeout(id);
  }, []);
  if (!show) return null;
  return (
    <div aria-hidden className="bday-confetti fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 60 }}>
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: "-20px",
            left: `${c.left}%`,
            width: `${c.w}px`,
            height: `${c.round ? c.w : c.h}px`,
            borderRadius: c.round ? "50%" : "1px",
            backgroundColor: c.color,
            ["--drift" as string]: `${c.drift}px`,
            ["--spin" as string]: `${c.spin}deg`,
            animation: `confetti-fall ${c.dur}s cubic-bezier(0.25, 0.6, 0.5, 1) ${c.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

/** Podium with a champagne spray from the top step */
function ChampagnePodium() {
  return (
    <svg viewBox="0 0 120 90" width="120" height="90" aria-hidden className="shrink-0">
      {/* spray droplets */}
      {[
        [58, 30, 0], [48, 22, 0.3], [70, 20, 0.6], [40, 14, 0.9],
        [62, 10, 0.2], [78, 12, 0.5], [52, 6, 0.8], [86, 22, 1.1],
      ].map(([x, y, d], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 2.4 : 1.6}
          fill={GOLD}
          className="bday-spray"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
      {/* bottle */}
      <path d="M57 44 L63 36 L66 38 L60 46 Z" fill="oklch(0.45 0.08 150)" />
      {/* podium steps */}
      <rect x="44" y="46" width="32" height="40" rx="2" fill={BAHRAIN_PALETTE.vibrantRed} />
      <rect x="12" y="58" width="32" height="28" rx="2" fill="oklch(0.42 0.03 230)" />
      <rect x="76" y="66" width="32" height="20" rx="2" fill="oklch(0.36 0.03 230)" />
      <text x="60" y="68" textAnchor="middle" fontSize="12" fontWeight="800" fill="white" fontFamily="var(--font-orbitron)">1</text>
      <text x="28" y="76" textAnchor="middle" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.7)" fontFamily="var(--font-orbitron)">2</text>
      <text x="92" y="80" textAnchor="middle" fontSize="10" fontWeight="700" fill="rgba(255,255,255,0.7)" fontFamily="var(--font-orbitron)">3</text>
    </svg>
  );
}

const CHEQUER = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12'%3E%3Crect width='12' height='12' fill='%23fff'/%3E%3Crect width='6' height='6' fill='%23111'/%3E%3Crect x='6' y='6' width='6' height='6' fill='%23111'/%3E%3C/svg%3E")`;

/** Home-page banner for Sarah's birthday weekend at the Bahrain GP */
export function BirthdayBanner() {
  return (
    <>
      <ConfettiBurst />
      <section
        aria-label="Sarah's birthday"
        className="relative flex items-stretch rounded-xl overflow-hidden mt-5 max-w-[620px]"
        style={{
          background: `linear-gradient(115deg, oklch(0.34 0.13 22 / 0.9) 0%, oklch(0.22 0.06 350 / 0.85) 55%, oklch(0.16 0.03 220 / 0.9) 100%)`,
          border: `1px solid ${BAHRAIN_PALETTE.badgeBorder}`,
          boxShadow: "0 0 36px oklch(0.55 0.2 22 / 0.25)",
        }}
      >
        {/* chequered-flag edge */}
        <div aria-hidden className="w-3 shrink-0" style={{ backgroundImage: CHEQUER, backgroundSize: "12px 12px", opacity: 0.85 }} />

        <div className="flex flex-1 items-center gap-3 px-4 py-4">
          <div className="flex-1 min-w-0">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
              style={{
                letterSpacing: "0.18em",
                backgroundColor: "rgba(0,0,0,0.35)",
                color: GOLD,
                border: `1px solid oklch(0.82 0.14 85 / 0.45)`,
                fontFamily: "var(--font-orbitron)",
              }}
            >
              P1 · 02 Oct
            </span>
            <h2
              className="mt-2 text-xl md:text-2xl font-bold leading-tight"
              style={{ fontFamily: "var(--font-orbitron)", color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
            >
              Happy Birthday, Sarah! 🎂
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.78)" }}>
              Lights out on another lap around the sun. It&apos;s a birthday weekend at the Bahrain GP, and the champagne&apos;s on the top step.
            </p>
          </div>
          <div className="hidden sm:block">
            <ChampagnePodium />
          </div>
        </div>
      </section>
    </>
  );
}

/** Small pill for the hero badge row */
export function BirthdayBadge() {
  return (
    <span
      className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{
        backgroundColor: "oklch(0.4 0.14 350 / 0.45)",
        color: PINK,
        border: "1px solid oklch(0.72 0.14 350 / 0.5)",
      }}
    >
      🎂 Sarah&apos;s Birthday Weekend
    </span>
  );
}
