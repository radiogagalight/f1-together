/** Monza weekend celebration palette — OKLCH Royal Park green, rosso corsa, sunlit haze */
export const MONZA_PALETTE = {
  deepForest: "oklch(0.2 0.04 150)",
  midPark: "oklch(0.38 0.08 148)",
  rossoCorsa: "oklch(0.58 0.2 27)",
  brightRed: "oklch(0.67 0.21 30)",
  sunHaze: "oklch(0.86 0.08 95 / 0.16)",
  concrete: "oklch(0.74 0.02 90)",
  concreteShadow: "oklch(0.46 0.02 95)",
  trackRibbon: "oklch(0.72 0.14 30 / 0.6)",
  liveGlow: "oklch(0.52 0.2 27)",
  liveBorder: "oklch(0.62 0.19 30)",
  badgeBg: "oklch(0.4 0.14 28 / 0.45)",
  badgeBorder: "oklch(0.62 0.17 30 / 0.5)",
  /** Italian tricolore — used once as a thin bar */
  italianGreen: "oklch(0.55 0.16 150)",
  italianWhite: "oklch(0.95 0.01 100)",
  italianRed: "oklch(0.53 0.2 27)",
} as const;

/** Tempio della Velocità speed lines — rosso corsa heavy, flat-out atmosphere */
export const MONZA_SPEED_LINES = [
  { top: 8, width: 74, dur: 3.3, delay: 0.0, opacity: 0.34, color: MONZA_PALETTE.rossoCorsa, height: 3 },
  { top: 19, width: 52, dur: 4.1, delay: 1.2, opacity: 0.22, color: MONZA_PALETTE.concrete, height: 2 },
  { top: 31, width: 82, dur: 2.8, delay: 2.6, opacity: 0.32, color: MONZA_PALETTE.brightRed, height: 3 },
  { top: 44, width: 58, dur: 4.8, delay: 0.7, opacity: 0.18, color: MONZA_PALETTE.concrete, height: 2 },
  { top: 57, width: 78, dur: 3.2, delay: 2.1, opacity: 0.34, color: MONZA_PALETTE.rossoCorsa, height: 3 },
  { top: 69, width: 46, dur: 3.9, delay: 1.6, opacity: 0.16, color: MONZA_PALETTE.italianWhite, height: 2 },
  { top: 81, width: 66, dur: 3.5, delay: 3.6, opacity: 0.24, color: MONZA_PALETTE.italianGreen, height: 2 },
  { top: 91, width: 56, dur: 4.4, delay: 0.5, opacity: 0.26, color: MONZA_PALETTE.brightRed, height: 3 },
] as const;

/**
 * Layered Monza backdrop: Royal Park treelines, sunlit haze, the abandoned
 * 1955 banking curving through the woods, and the long Rettifilo into Parabolica.
 * Pure SVG/CSS — no external assets.
 */
export default function MonzaHeroScene() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(
          165deg,
          oklch(0.5 0.09 110) 0%,
          oklch(0.36 0.08 140) 38%,
          ${MONZA_PALETTE.deepForest} 100%
        )`,
      }}
    >
      {/* Distant Royal Park canopy */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }}
      >
        <path
          fill={MONZA_PALETTE.midPark}
          d="M0 258
            q 25 -26 50 0 q 25 -30 50 0 q 25 -22 50 0 q 25 -28 50 0
            q 25 -24 50 0 q 25 -30 50 0 q 25 -22 50 0 q 25 -28 50 0
            q 25 -24 50 0 q 25 -30 50 0 q 25 -22 50 0 q 25 -26 50 0
            q 25 -28 50 0 q 25 -22 50 0 q 25 -28 50 0 q 25 -24 50 0
            L800 400 L0 400 Z"
        />
      </svg>

      {/* Mid sunlit haze through the trees */}
      <div
        style={{
          position: "absolute",
          top: "34%",
          left: "-20%",
          width: "140%",
          height: "16%",
          background: `linear-gradient(to right, transparent, ${MONZA_PALETTE.sunHaze}, transparent)`,
          filter: "blur(14px)",
          animation: "mist-drift 34s linear infinite",
        }}
      />

      {/* Mid treeline */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.72 }}
      >
        <path
          fill="oklch(0.3 0.06 146)"
          d="M0 300
            q 30 -30 60 0 q 30 -36 60 0 q 30 -26 60 0 q 30 -34 60 0
            q 30 -28 60 0 q 30 -36 60 0 q 30 -26 60 0 q 30 -34 60 0
            q 30 -28 60 0 q 30 -36 60 0 q 30 -26 60 0 q 30 -32 60 0
            q 30 -34 60 0 q 30 -28 60 0
            L800 400 L0 400 Z"
        />
      </svg>

      {/* Abandoned 1955 banking — concrete curve through the park */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.9 }}
      >
        <path
          fill={MONZA_PALETTE.concrete}
          d="M -30 332
            C 110 300, 210 214, 380 196
            C 520 181, 650 214, 840 184
            L 840 214
            C 650 244, 520 211, 380 226
            C 210 244, 110 330, -30 362 Z"
        />
        {/* shaded underside */}
        <path
          fill={MONZA_PALETTE.concreteShadow}
          d="M -30 362
            C 110 330, 210 244, 380 226
            C 520 211, 650 244, 840 214
            L 840 226
            C 650 256, 520 223, 380 238
            C 210 256, 110 342, -30 374 Z"
        />
        {/* expansion-joint slats */}
        {[
          "M 40 322 L 52 352",
          "M 150 280 L 160 312",
          "M 270 236 L 278 268",
          "M 400 198 L 404 230",
          "M 520 202 L 524 234",
          "M 640 224 L 646 256",
          "M 750 200 L 758 232",
        ].map((d) => (
          <path key={d} d={d} stroke="oklch(0.4 0.02 95 / 0.45)" strokeWidth="2" />
        ))}
        {/* sun-catch highlight along the top lip */}
        <path
          d="M -30 332 C 110 300, 210 214, 380 196 C 520 181, 650 214, 840 184"
          fill="none"
          stroke="oklch(0.92 0.03 95 / 0.4)"
          strokeWidth="2"
        />
      </svg>

      {/* Near haze */}
      <div
        style={{
          position: "absolute",
          top: "52%",
          left: "-25%",
          width: "150%",
          height: "12%",
          background: `linear-gradient(to right, transparent 10%, ${MONZA_PALETTE.sunHaze} 45%, oklch(0.8 0.05 110 / 0.1) 65%, transparent)`,
          filter: "blur(18px)",
          animation: "mist-drift 42s linear infinite reverse",
        }}
      />

      {/* Foreground park edge */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.94 }}
      >
        <path
          fill="oklch(0.16 0.035 148)"
          d="M0 344
            q 36 -22 72 0 q 36 -28 72 0 q 36 -20 72 0 q 36 -26 72 0
            q 36 -22 72 0 q 36 -28 72 0 q 36 -20 72 0 q 36 -26 72 0
            q 36 -22 72 0 q 36 -26 72 0 q 36 -22 72 0
            L800 400 L0 400 Z"
        />
      </svg>

      {/* The Rettifilo straight into the Parabolica sweep */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <path
          d="M -20 372
            L 480 360
            C 590 356, 660 340, 690 300
            C 712 270, 706 234, 672 214"
          fill="none"
          stroke={MONZA_PALETTE.rossoCorsa}
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.12"
        />
        <path
          d="M -20 372
            L 480 360
            C 590 356, 660 340, 690 300
            C 712 270, 706 234, 672 214"
          fill="none"
          stroke={MONZA_PALETTE.trackRibbon}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="5 7"
          opacity="0.75"
        />
      </svg>

      {/* Soft top vignette so badges stay readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, oklch(0.18 0.03 150 / 0.42) 0%, transparent 28%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
