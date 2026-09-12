/** Spanish GP weekend celebration palette — OKLCH Madrid gold, rojo, banked-corner steel */
export const SPAIN_PALETTE = {
  deepMadrid: "oklch(0.2 0.035 50)",
  midGold: "oklch(0.4 0.08 70)",
  vibrantRed: "oklch(0.56 0.21 27)",
  brightGold: "oklch(0.78 0.14 85)",
  sunHaze: "oklch(0.86 0.08 80 / 0.16)",
  skylineDusk: "oklch(0.3 0.05 55)",
  skylineNear: "oklch(0.17 0.03 50)",
  bankSteel: "oklch(0.6 0.02 90 / 0.5)",
  trackRibbon: "oklch(0.74 0.13 35 / 0.62)",
  liveGlow: "oklch(0.55 0.21 30)",
  liveBorder: "oklch(0.65 0.18 40)",
  badgeBg: "oklch(0.4 0.15 30 / 0.45)",
  badgeBorder: "oklch(0.66 0.16 42 / 0.5)",
  /** Spanish flag — rojo, gualda, rojo */
  spanishRed: "oklch(0.5 0.21 25)",
  spanishGold: "oklch(0.82 0.15 85)",
} as const;

/** Madrid gold/rojo speed lines for the weekend atmosphere */
export const SPAIN_SPEED_LINES = [
  { top: 8, width: 70, dur: 3.6, delay: 0.0, opacity: 0.34, color: SPAIN_PALETTE.vibrantRed, height: 3 },
  { top: 19, width: 50, dur: 4.6, delay: 1.3, opacity: 0.22, color: SPAIN_PALETTE.brightGold, height: 2 },
  { top: 31, width: 78, dur: 3.1, delay: 2.8, opacity: 0.32, color: SPAIN_PALETTE.vibrantRed, height: 3 },
  { top: 44, width: 56, dur: 5.2, delay: 0.7, opacity: 0.2, color: SPAIN_PALETTE.bankSteel, height: 2 },
  { top: 57, width: 74, dur: 3.7, delay: 2.2, opacity: 0.32, color: SPAIN_PALETTE.brightGold, height: 3 },
  { top: 69, width: 44, dur: 4.3, delay: 1.7, opacity: 0.18, color: SPAIN_PALETTE.bankSteel, height: 2 },
  { top: 81, width: 64, dur: 4.0, delay: 3.9, opacity: 0.26, color: SPAIN_PALETTE.spanishGold, height: 2 },
  { top: 91, width: 54, dur: 5.0, delay: 0.5, opacity: 0.28, color: SPAIN_PALETTE.vibrantRed, height: 3 },
] as const;

/**
 * Layered Madring backdrop: Madrid skyline at golden hour, a raised banked
 * corner unlike anything else on the calendar, and the debut street ribbon.
 * Pure SVG/CSS — no external assets.
 */
export default function SpainHeroScene() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(
          165deg,
          oklch(0.5 0.1 70) 0%,
          oklch(0.36 0.08 55) 36%,
          ${SPAIN_PALETTE.deepMadrid} 100%
        )`,
      }}
    >
      {/* Distant Madrid skyline — Cuatro Torres silhouette */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.55 }}
      >
        <path
          fill={SPAIN_PALETTE.midGold}
          d="M0 280
            L60 280 L60 250 L90 250 L90 280
            L140 280 L140 230 L150 220 L160 230 L160 280
            L210 280 L210 258 L235 258 L235 280
            L280 280 L280 210 L296 195 L312 210 L312 280
            L370 280 L370 245 L392 245 L392 280
            L440 280 L440 265 L460 265 L460 280
            L520 280 L520 218 L536 205 L552 218 L552 280
            L610 280 L610 250 L630 250 L630 280
            L680 280 L680 260 L700 260 L700 280
            L760 280 L760 240 L780 240 L780 280
            L800 280 L800 400 L0 400 Z"
        />
      </svg>

      {/* Mid golden-hour haze over the city */}
      <div
        style={{
          position: "absolute",
          top: "32%",
          left: "-20%",
          width: "140%",
          height: "16%",
          background: `linear-gradient(to right, transparent, ${SPAIN_PALETTE.sunHaze}, transparent)`,
          filter: "blur(14px)",
          animation: "mist-drift 33s linear infinite",
        }}
      />

      {/* Mid skyline row */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.75 }}
      >
        <path
          fill={SPAIN_PALETTE.skylineDusk}
          d="M0 315
            L45 315 L45 290 L75 290 L75 315
            L120 315 L120 270 L138 270 L138 315
            L190 315 L190 296 L214 296 L214 315
            L260 315 L260 255 L280 240 L300 255 L300 315
            L350 315 L350 284 L372 284 L372 315
            L420 315 L420 265 L438 265 L438 315
            L490 315 L490 250 L508 238 L526 250 L526 315
            L580 315 L580 286 L600 286 L600 315
            L650 315 L650 296 L670 296 L670 315
            L720 315 L720 272 L742 272 L742 315
            L800 315 L800 400 L0 400 Z"
        />
      </svg>

      {/* Near haze */}
      <div
        style={{
          position: "absolute",
          top: "47%",
          left: "-25%",
          width: "150%",
          height: "12%",
          background: `linear-gradient(to right, transparent 10%, ${SPAIN_PALETTE.sunHaze} 45%, oklch(0.85 0.07 80 / 0.1) 65%, transparent)`,
          filter: "blur(18px)",
          animation: "mist-drift 41s linear infinite reverse",
        }}
      />

      {/* Foreground city edge */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.94 }}
      >
        <path
          fill={SPAIN_PALETTE.skylineNear}
          d="M0 348
            C90 336, 130 352, 200 340
            C270 328, 300 348, 380 338
            C460 328, 500 346, 580 336
            C660 326, 700 344, 800 332
            L800 400 L0 400 Z"
        />
      </svg>

      {/* Madring's signature raised banked corner */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.9 }}
      >
        <path
          d="M 480 320
            C 540 300, 590 250, 640 222
            C 668 206, 672 176, 648 162"
          fill="none"
          stroke={SPAIN_PALETTE.bankSteel}
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 480 320
            C 540 300, 590 250, 640 222
            C 668 206, 672 176, 648 162"
          fill="none"
          stroke="oklch(0.9 0.02 90 / 0.35)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Debut street-circuit ribbon */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <path
          d="M 20 360
            C 100 355, 160 340, 220 342
            C 300 344, 340 330, 400 328
            C 440 327, 460 322, 480 320
            C 540 300, 590 250, 640 222
            C 668 206, 672 176, 648 162
            C 700 150, 750 165, 790 150"
          fill="none"
          stroke={SPAIN_PALETTE.vibrantRed}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.12"
        />
        <path
          d="M 20 360
            C 100 355, 160 340, 220 342
            C 300 344, 340 330, 400 328
            C 440 327, 460 322, 480 320
            C 540 300, 590 250, 640 222
            C 668 206, 672 176, 648 162
            C 700 150, 750 165, 790 150"
          fill="none"
          stroke={SPAIN_PALETTE.trackRibbon}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="5 7"
          opacity="0.8"
        />
      </svg>

      {/* Soft top vignette so badges stay readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, oklch(0.2 0.035 55 / 0.42) 0%, transparent 28%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
