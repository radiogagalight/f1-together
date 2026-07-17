import type { ComponentType } from "react";
import SpaHeroScene, { SPA_PALETTE, SPA_SPEED_LINES } from "@/components/SpaHeroScene";
import HungaryHeroScene, { HUNGARY_PALETTE, HUNGARY_SPEED_LINES } from "@/components/HungaryHeroScene";

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

const THEMES_BY_ROUND: Record<number, WeekendTheme> = {
  [SPA_THEME.round]: SPA_THEME,
  [HUNGARY_THEME.round]: HUNGARY_THEME,
};

export function getWeekendTheme(round: number): WeekendTheme | null {
  return THEMES_BY_ROUND[round] ?? null;
}
