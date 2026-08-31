import type { ComponentType } from "react";
import SpaHeroScene, { SPA_PALETTE, SPA_SPEED_LINES } from "@/components/SpaHeroScene";
import HungaryHeroScene, { HUNGARY_PALETTE, HUNGARY_SPEED_LINES } from "@/components/HungaryHeroScene";
import DutchHeroScene, { DUTCH_PALETTE, DUTCH_SPEED_LINES } from "@/components/DutchHeroScene";
import MonzaHeroScene, { MONZA_PALETTE, MONZA_SPEED_LINES } from "@/components/MonzaHeroScene";

export type SpeedLine = {
  top: number;
  width: number;
  dur: number;
  delay: number;
  opacity: number;
  color: string;
  height: number;
};

/** Shared palette surface used by the home page celebration wiring */
export type WeekendPalette = {
  accent: string;
  liveGlow: string;
  liveBorder: string;
  badgeBg: string;
  badgeBorder: string;
  liveGlowBoxShadow: string;
  dayLabelShadow: string;
  nextDotGlow: string;
  tickerBg: string;
  scrimGradient: string;
  factColor: string;
  scheduleBg: string;
  scheduleInsetShadow: string;
  tricolor: readonly [string, string, string];
};

export type WeekendTheme = {
  round: number;
  badgeLabel: string;
  subtitle: string;
  circuitFact: string;
  palette: WeekendPalette;
  speedLines: readonly SpeedLine[];
  HeroScene: ComponentType;
};

const SPA_THEME: WeekendTheme = {
  round: 10,
  badgeLabel: "Spa Week",
  subtitle: "It's Spa week. Mist, elevation, and the longest lap of the year.",
  circuitFact: "Longest lap on the calendar — 7.004 km through the Ardennes.",
  palette: {
    accent: SPA_PALETTE.mistySage,
    liveGlow: SPA_PALETTE.liveGlow,
    liveBorder: SPA_PALETTE.liveBorder,
    badgeBg: SPA_PALETTE.badgeBg,
    badgeBorder: SPA_PALETTE.badgeBorder,
    liveGlowBoxShadow: `0 0 0 1px ${SPA_PALETTE.liveGlow}, 0 0 40px oklch(0.45 0.1 155 / 0.35)`,
    dayLabelShadow: "0 0 24px oklch(0.55 0.1 148 / 0.55), 0 2px 12px rgba(0,0,0,0.9)",
    nextDotGlow: "oklch(0.55 0.1 148 / 0.55)",
    tickerBg: "oklch(0.12 0.03 155 / 0.55)",
    scrimGradient:
      "linear-gradient(to bottom, oklch(0.12 0.02 155 / 0.1) 0%, oklch(0.12 0.02 155 / 0.55) 50%, oklch(0.1 0.02 155 / 0.96) 100%)",
    factColor: "oklch(0.78 0.03 155 / 0.65)",
    scheduleBg:
      "linear-gradient(to right, oklch(0.35 0.07 152 / 0.35) 0%, oklch(0.3 0.05 155 / 0.12) 60%, transparent 100%)",
    scheduleInsetShadow: `0 0 0 1px ${SPA_PALETTE.badgeBorder}, inset 0 0 60px oklch(0.4 0.06 152 / 0.12)`,
    tricolor: [SPA_PALETTE.belgianBlack, SPA_PALETTE.belgianYellow, SPA_PALETTE.belgianRed],
  },
  speedLines: SPA_SPEED_LINES,
  HeroScene: SpaHeroScene,
};

const HUNGARY_THEME: WeekendTheme = {
  round: 11,
  badgeLabel: "Hungary Week",
  subtitle: "It's Hungary week. Heat, dust, and a bowl where pole is everything.",
  circuitFact: "First F1 race behind the Iron Curtain, 1986. Pole is everything on this twisty bowl.",
  palette: {
    accent: HUNGARY_PALETTE.sunOchre,
    liveGlow: HUNGARY_PALETTE.liveGlow,
    liveBorder: HUNGARY_PALETTE.liveBorder,
    badgeBg: HUNGARY_PALETTE.badgeBg,
    badgeBorder: HUNGARY_PALETTE.badgeBorder,
    liveGlowBoxShadow: `0 0 0 1px ${HUNGARY_PALETTE.liveGlow}, 0 0 40px oklch(0.5 0.12 55 / 0.35)`,
    dayLabelShadow: "0 0 24px oklch(0.65 0.12 70 / 0.5), 0 2px 12px rgba(0,0,0,0.9)",
    nextDotGlow: "oklch(0.65 0.12 70 / 0.55)",
    tickerBg: "oklch(0.18 0.04 55 / 0.55)",
    scrimGradient:
      "linear-gradient(to bottom, oklch(0.18 0.04 55 / 0.12) 0%, oklch(0.16 0.035 50 / 0.55) 50%, oklch(0.12 0.03 50 / 0.96) 100%)",
    factColor: "oklch(0.82 0.05 75 / 0.7)",
    scheduleBg:
      "linear-gradient(to right, oklch(0.4 0.09 55 / 0.38) 0%, oklch(0.32 0.06 55 / 0.14) 60%, transparent 100%)",
    scheduleInsetShadow: `0 0 0 1px ${HUNGARY_PALETTE.badgeBorder}, inset 0 0 60px oklch(0.45 0.08 60 / 0.12)`,
    tricolor: [HUNGARY_PALETTE.hungarianRed, HUNGARY_PALETTE.hungarianWhite, HUNGARY_PALETTE.hungarianGreen],
  },
  speedLines: HUNGARY_SPEED_LINES,
  HeroScene: HungaryHeroScene,
};

const DUTCH_THEME: WeekendTheme = {
  round: 12,
  badgeLabel: "Dutch GP Week",
  subtitle: "It's Dutch GP week. Dunes, banking, and a sea of Oranje at Zandvoort.",
  circuitFact: "Zandvoort was absent from the F1 calendar for 35 years before returning as the Dutch GP home in 2021.",
  palette: {
    accent: DUTCH_PALETTE.vibrantOrange,
    liveGlow: DUTCH_PALETTE.liveGlow,
    liveBorder: DUTCH_PALETTE.liveBorder,
    badgeBg: DUTCH_PALETTE.badgeBg,
    badgeBorder: DUTCH_PALETTE.badgeBorder,
    liveGlowBoxShadow: `0 0 0 1px ${DUTCH_PALETTE.liveGlow}, 0 0 40px oklch(0.55 0.18 42 / 0.35)`,
    dayLabelShadow: "0 0 24px oklch(0.65 0.18 45 / 0.55), 0 2px 12px rgba(0,0,0,0.9)",
    nextDotGlow: "oklch(0.65 0.18 45 / 0.55)",
    tickerBg: "oklch(0.16 0.03 55 / 0.55)",
    scrimGradient:
      "linear-gradient(to bottom, oklch(0.18 0.03 55 / 0.12) 0%, oklch(0.16 0.03 55 / 0.55) 50%, oklch(0.12 0.03 55 / 0.96) 100%)",
    factColor: "oklch(0.82 0.05 55 / 0.7)",
    scheduleBg:
      "linear-gradient(to right, oklch(0.42 0.12 45 / 0.38) 0%, oklch(0.34 0.08 50 / 0.14) 60%, transparent 100%)",
    scheduleInsetShadow: `0 0 0 1px ${DUTCH_PALETTE.badgeBorder}, inset 0 0 60px oklch(0.45 0.1 48 / 0.12)`,
    tricolor: [DUTCH_PALETTE.dutchRed, DUTCH_PALETTE.dutchWhite, DUTCH_PALETTE.dutchBlue],
  },
  speedLines: DUTCH_SPEED_LINES,
  HeroScene: DutchHeroScene,
};

const MONZA_THEME: WeekendTheme = {
  round: 13,
  badgeLabel: "Monza GP Week",
  subtitle: "It's Monza week. The Temple of Speed — flat-out through the Royal Park in a sea of tifosi red.",
  circuitFact: "Monza has hosted the Italian GP in every F1 World Championship season but one (1980) — and its abandoned 1955 banking still curves through the woods.",
  palette: {
    accent: MONZA_PALETTE.brightRed,
    liveGlow: MONZA_PALETTE.liveGlow,
    liveBorder: MONZA_PALETTE.liveBorder,
    badgeBg: MONZA_PALETTE.badgeBg,
    badgeBorder: MONZA_PALETTE.badgeBorder,
    liveGlowBoxShadow: `0 0 0 1px ${MONZA_PALETTE.liveGlow}, 0 0 40px oklch(0.55 0.2 28 / 0.35)`,
    dayLabelShadow: "0 0 24px oklch(0.6 0.2 30 / 0.55), 0 2px 12px rgba(0,0,0,0.9)",
    nextDotGlow: "oklch(0.62 0.2 30 / 0.55)",
    tickerBg: "oklch(0.16 0.04 150 / 0.55)",
    scrimGradient:
      "linear-gradient(to bottom, oklch(0.18 0.04 150 / 0.12) 0%, oklch(0.15 0.035 150 / 0.55) 50%, oklch(0.11 0.03 150 / 0.96) 100%)",
    factColor: "oklch(0.84 0.04 90 / 0.7)",
    scheduleBg:
      "linear-gradient(to right, oklch(0.42 0.16 28 / 0.38) 0%, oklch(0.32 0.09 40 / 0.14) 60%, transparent 100%)",
    scheduleInsetShadow: `0 0 0 1px ${MONZA_PALETTE.badgeBorder}, inset 0 0 60px oklch(0.45 0.14 30 / 0.12)`,
    tricolor: [MONZA_PALETTE.italianGreen, MONZA_PALETTE.italianWhite, MONZA_PALETTE.italianRed],
  },
  speedLines: MONZA_SPEED_LINES,
  HeroScene: MonzaHeroScene,
};

const THEMES_BY_ROUND: Record<number, WeekendTheme> = {
  [SPA_THEME.round]: SPA_THEME,
  [HUNGARY_THEME.round]: HUNGARY_THEME,
  [DUTCH_THEME.round]: DUTCH_THEME,
  [MONZA_THEME.round]: MONZA_THEME,
};

export function getWeekendTheme(round: number): WeekendTheme | null {
  return THEMES_BY_ROUND[round] ?? null;
}
