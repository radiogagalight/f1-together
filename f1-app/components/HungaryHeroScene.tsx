/** Hungary weekend celebration palette — OKLCH heat, dust, terracotta */
export const HUNGARY_PALETTE = {
  deepDust: "oklch(0.22 0.04 55)",
  midTerracotta: "oklch(0.38 0.08 48)",
  sunOchre: "oklch(0.72 0.12 75)",
  dryGold: "oklch(0.78 0.1 85)",
  dustyWhite: "oklch(0.88 0.02 80)",
  heatHaze: "oklch(0.78 0.06 70 / 0.16)",
  trackRibbon: "oklch(0.7 0.08 70 / 0.6)",
  liveGlow: "oklch(0.5 0.12 55)",
  liveBorder: "oklch(0.62 0.12 65)",
  badgeBg: "oklch(0.38 0.07 55 / 0.45)",
  badgeBorder: "oklch(0.62 0.1 70 / 0.5)",
  /** Hungarian tricolor — used once as a thin bar */
  hungarianRed: "oklch(0.52 0.2 25)",
  hungarianWhite: "oklch(0.94 0.01 80)",
  hungarianGreen: "oklch(0.48 0.12 145)",
} as const;

/** Heat-palette speed lines for the weekend atmosphere */
export const HUNGARY_SPEED_LINES = [
  { top: 8, width: 68, dur: 4.2, delay: 0.0, opacity: 0.28, color: HUNGARY_PALETTE.sunOchre, height: 3 },
  { top: 19, width: 48, dur: 5.2, delay: 1.4, opacity: 0.2, color: HUNGARY_PALETTE.dustyWhite, height: 2 },
  { top: 31, width: 74, dur: 3.5, delay: 3.1, opacity: 0.26, color: HUNGARY_PALETTE.midTerracotta, height: 3 },
  { top: 44, width: 55, dur: 6.0, delay: 0.8, opacity: 0.18, color: HUNGARY_PALETTE.dustyWhite, height: 2 },
  { top: 57, width: 72, dur: 4.0, delay: 2.5, opacity: 0.28, color: HUNGARY_PALETTE.dryGold, height: 3 },
  { top: 69, width: 42, dur: 4.8, delay: 1.9, opacity: 0.16, color: HUNGARY_PALETTE.dustyWhite, height: 2 },
  { top: 81, width: 62, dur: 4.4, delay: 4.3, opacity: 0.22, color: HUNGARY_PALETTE.hungarianGreen, height: 2 },
  { top: 91, width: 52, dur: 5.5, delay: 0.6, opacity: 0.24, color: HUNGARY_PALETTE.deepDust, height: 3 },
] as const;

/**
 * Layered Hungaroring backdrop: dry-grass amphitheatre hills, heat haze, twisty track ribbon.
 * Pure SVG/CSS — no external assets.
 */
export default function HungaryHeroScene() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(
          165deg,
          oklch(0.42 0.1 70) 0%,
          oklch(0.32 0.08 55) 35%,
          ${HUNGARY_PALETTE.deepDust} 100%
        )`,
      }}
    >
      {/* Distant hillside bowl */}
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
          fill={HUNGARY_PALETTE.midTerracotta}
          d="M0 260
            C80 250, 160 270, 240 255
            C320 240, 400 265, 480 250
            C560 235, 640 260, 720 248
            L800 255 L800 400 L0 400 Z"
        />
      </svg>

      {/* Mid heat haze */}
      <div
        style={{
          position: "absolute",
          top: "36%",
          left: "-20%",
          width: "140%",
          height: "16%",
          background: `linear-gradient(to right, transparent, ${HUNGARY_PALETTE.heatHaze}, transparent)`,
          filter: "blur(14px)",
          animation: "mist-drift 32s linear infinite",
        }}
      />

      {/* Mid dry-grass ridge */}
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
          fill="oklch(0.3 0.06 52)"
          d="M0 300
            C60 285, 120 310, 200 290
            C280 270, 360 305, 440 288
            C520 270, 600 300, 680 285
            L800 295 L800 400 L0 400 Z"
        />
      </svg>

      {/* Near heat haze */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "-25%",
          width: "150%",
          height: "12%",
          background: `linear-gradient(to right, transparent 10%, ${HUNGARY_PALETTE.heatHaze} 45%, oklch(0.78 0.05 75 / 0.1) 65%, transparent)`,
          filter: "blur(18px)",
          animation: "mist-drift 40s linear infinite reverse",
        }}
      />

      {/* Foreground amphitheatre edge */}
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
          fill="oklch(0.18 0.035 50)"
          d="M0 335
            C70 320, 140 345, 220 325
            C300 305, 380 340, 460 322
            C540 305, 620 338, 700 320
            L800 330 L800 400 L0 400 Z"
        />
      </svg>

      {/* Twisty Hungaroring track ribbon */}
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
          d="M 30 350
            C 90 345, 130 320, 160 300
            C 200 270, 220 250, 250 265
            C 290 285, 310 310, 350 295
            C 400 275, 420 240, 460 255
            C 510 275, 530 310, 580 290
            C 640 265, 680 280, 720 310
            C 745 328, 770 340, 790 345"
          fill="none"
          stroke={HUNGARY_PALETTE.trackRibbon}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="5 7"
          opacity="0.75"
        />
        <path
          d="M 30 350
            C 90 345, 130 320, 160 300
            C 200 270, 220 250, 250 265
            C 290 285, 310 310, 350 295
            C 400 275, 420 240, 460 255
            C 510 275, 530 310, 580 290
            C 640 265, 680 280, 720 310
            C 745 328, 770 340, 790 345"
          fill="none"
          stroke={HUNGARY_PALETTE.sunOchre}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.1"
        />
      </svg>

      {/* Soft top vignette so badges stay readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, oklch(0.2 0.04 55 / 0.4) 0%, transparent 28%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
