/** Dutch weekend celebration palette — OKLCH dune sand, sea haze, Oranje */
export const DUTCH_PALETTE = {
  deepDune: "oklch(0.2 0.03 60)",
  midSand: "oklch(0.4 0.06 70)",
  vibrantOrange: "oklch(0.68 0.19 45)",
  brightOrange: "oklch(0.76 0.17 55)",
  seaMist: "oklch(0.86 0.02 220)",
  haze: "oklch(0.75 0.06 220 / 0.16)",
  trackRibbon: "oklch(0.72 0.1 45 / 0.6)",
  liveGlow: "oklch(0.55 0.19 40)",
  liveBorder: "oklch(0.65 0.17 45)",
  badgeBg: "oklch(0.4 0.12 45 / 0.45)",
  badgeBorder: "oklch(0.65 0.15 48 / 0.5)",
  /** Dutch tricolor — used once as a thin bar */
  dutchRed: "oklch(0.5 0.2 25)",
  dutchWhite: "oklch(0.95 0.01 80)",
  dutchBlue: "oklch(0.4 0.1 255)",
} as const;

/** Dune/Oranje-palette speed lines for the weekend atmosphere */
export const DUTCH_SPEED_LINES = [
  { top: 8, width: 68, dur: 4.2, delay: 0.0, opacity: 0.32, color: DUTCH_PALETTE.vibrantOrange, height: 3 },
  { top: 19, width: 48, dur: 5.2, delay: 1.4, opacity: 0.22, color: DUTCH_PALETTE.seaMist, height: 2 },
  { top: 31, width: 74, dur: 3.5, delay: 3.1, opacity: 0.3, color: DUTCH_PALETTE.brightOrange, height: 3 },
  { top: 44, width: 55, dur: 6.0, delay: 0.8, opacity: 0.2, color: DUTCH_PALETTE.seaMist, height: 2 },
  { top: 57, width: 72, dur: 4.0, delay: 2.5, opacity: 0.32, color: DUTCH_PALETTE.vibrantOrange, height: 3 },
  { top: 69, width: 42, dur: 4.8, delay: 1.9, opacity: 0.18, color: DUTCH_PALETTE.seaMist, height: 2 },
  { top: 81, width: 62, dur: 4.4, delay: 4.3, opacity: 0.24, color: DUTCH_PALETTE.dutchBlue, height: 2 },
  { top: 91, width: 52, dur: 5.5, delay: 0.6, opacity: 0.26, color: DUTCH_PALETTE.midSand, height: 3 },
] as const;

/**
 * Layered Zandvoort backdrop: rolling dune ridges, sea haze, banked track ribbon.
 * Pure SVG/CSS — no external assets.
 */
export default function DutchHeroScene() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(
          165deg,
          oklch(0.46 0.1 50) 0%,
          oklch(0.34 0.07 60) 35%,
          ${DUTCH_PALETTE.deepDune} 100%
        )`,
      }}
    >
      {/* Distant dune ridge */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.5,
        }}
      >
        <path
          fill={DUTCH_PALETTE.midSand}
          d="M0 265
            C90 240, 170 275, 250 250
            C330 225, 410 260, 490 245
            C570 230, 650 258, 730 240
            L800 250 L800 400 L0 400 Z"
        />
      </svg>

      {/* Mid sea haze */}
      <div
        style={{
          position: "absolute",
          top: "34%",
          left: "-20%",
          width: "140%",
          height: "16%",
          background: `linear-gradient(to right, transparent, ${DUTCH_PALETTE.haze}, transparent)`,
          filter: "blur(14px)",
          animation: "mist-drift 32s linear infinite",
        }}
      />

      {/* Mid dune ridge */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.7,
        }}
      >
        <path
          fill="oklch(0.32 0.06 58)"
          d="M0 305
            C70 280, 150 315, 230 285
            C310 255, 390 300, 470 278
            C550 255, 630 298, 710 275
            L800 288 L800 400 L0 400 Z"
        />
      </svg>

      {/* Near sea haze */}
      <div
        style={{
          position: "absolute",
          top: "48%",
          left: "-25%",
          width: "150%",
          height: "12%",
          background: `linear-gradient(to right, transparent 10%, ${DUTCH_PALETTE.haze} 45%, oklch(0.8 0.03 220 / 0.1) 65%, transparent)`,
          filter: "blur(18px)",
          animation: "mist-drift 40s linear infinite reverse",
        }}
      />

      {/* Foreground dune edge */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.92,
        }}
      >
        <path
          fill="oklch(0.18 0.03 55)"
          d="M0 340
            C80 315, 160 350, 240 320
            C320 290, 400 335, 480 315
            C560 295, 640 338, 720 312
            L800 325 L800 400 L0 400 Z"
        />
      </svg>

      {/* Banked Zandvoort track ribbon */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <path
          d="M 25 355
            C 80 340, 110 300, 150 305
            C 200 312, 210 350, 260 345
            C 320 338, 330 285, 390 280
            C 450 275, 470 320, 530 315
            C 590 310, 610 260, 670 270
            C 715 278, 745 310, 790 300"
          fill="none"
          stroke={DUTCH_PALETTE.trackRibbon}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="5 7"
          opacity="0.75"
        />
        <path
          d="M 25 355
            C 80 340, 110 300, 150 305
            C 200 312, 210 350, 260 345
            C 320 338, 330 285, 390 280
            C 450 275, 470 320, 530 315
            C 590 310, 610 260, 670 270
            C 715 278, 745 310, 790 300"
          fill="none"
          stroke={DUTCH_PALETTE.vibrantOrange}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.12"
        />
      </svg>

      {/* Soft top vignette so badges stay readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, oklch(0.2 0.03 55 / 0.4) 0%, transparent 28%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
