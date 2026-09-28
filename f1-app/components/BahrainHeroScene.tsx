/** Bahrain GP (at Sepang) weekend celebration palette — OKLCH Bahraini red, tropical storm sky, rainforest canopy */
export const BAHRAIN_PALETTE = {
  deepStorm: "oklch(0.17 0.03 200)",
  midCanopy: "oklch(0.3 0.06 165)",
  nearCanopy: "oklch(0.2 0.045 160)",
  vibrantRed: "oklch(0.58 0.21 22)",
  brightRed: "oklch(0.66 0.2 22)",
  stormCloud: "oklch(0.36 0.02 230)",
  rainHaze: "oklch(0.82 0.03 200 / 0.14)",
  roofWhite: "oklch(0.9 0.01 90)",
  trackRibbon: "oklch(0.75 0.14 25 / 0.62)",
  liveGlow: "oklch(0.55 0.2 22)",
  liveBorder: "oklch(0.64 0.18 24)",
  badgeBg: "oklch(0.38 0.14 22 / 0.45)",
  badgeBorder: "oklch(0.64 0.17 24 / 0.5)",
  /** Bahraini flag — white hoist, serrated edge, red fly */
  bahrainRed: "oklch(0.52 0.21 22)",
  bahrainWhite: "oklch(0.96 0 0)",
} as const;

/** Storm-light / Bahraini red speed lines for the weekend atmosphere */
export const BAHRAIN_SPEED_LINES = [
  { top: 8, width: 72, dur: 3.4, delay: 0.0, opacity: 0.32, color: BAHRAIN_PALETTE.vibrantRed, height: 3 },
  { top: 19, width: 50, dur: 4.4, delay: 1.2, opacity: 0.22, color: BAHRAIN_PALETTE.bahrainWhite, height: 2 },
  { top: 31, width: 80, dur: 2.9, delay: 2.7, opacity: 0.3, color: BAHRAIN_PALETTE.brightRed, height: 3 },
  { top: 44, width: 56, dur: 5.0, delay: 0.6, opacity: 0.2, color: BAHRAIN_PALETTE.midCanopy, height: 2 },
  { top: 57, width: 76, dur: 3.5, delay: 2.1, opacity: 0.32, color: BAHRAIN_PALETTE.vibrantRed, height: 3 },
  { top: 69, width: 44, dur: 4.1, delay: 1.6, opacity: 0.18, color: BAHRAIN_PALETTE.bahrainWhite, height: 2 },
  { top: 81, width: 66, dur: 3.8, delay: 3.7, opacity: 0.26, color: BAHRAIN_PALETTE.stormCloud, height: 2 },
  { top: 91, width: 54, dur: 4.7, delay: 0.4, opacity: 0.28, color: BAHRAIN_PALETTE.bahrainRed, height: 3 },
] as const;

/** Rainforest canopy silhouette — overlapping rounded crowns along a baseline */
function canopyPath(baseY: number, crowns: readonly (readonly [number, number])[]) {
  let d = `M0 ${baseY}`;
  for (const [x, h] of crowns) {
    const r = h * 0.9;
    d += ` L${x - r} ${baseY} A${r} ${h} 0 0 1 ${x + r} ${baseY}`;
  }
  return `${d} L800 ${baseY} L800 400 L0 400 Z`;
}

const FAR_CROWNS = [
  [30, 26], [90, 34], [150, 22], [215, 30], [280, 38], [350, 24], [410, 32],
  [470, 28], [540, 36], [610, 22], [670, 30], [735, 34], [790, 24],
] as const;

const NEAR_CROWNS = [
  [10, 20], [60, 30], [118, 24], [170, 18], [590, 26], [640, 20],
  [690, 32], [748, 24], [796, 28],
] as const;

/**
 * Layered Bahrain-GP-at-Sepang backdrop: a tropical afternoon storm rolling
 * over the rainforest, Sepang's twin-leaf grandstand roof, the Bahraini
 * serrated flag edge, and the long back straight into the final hairpin.
 * Pure SVG/CSS — no external assets.
 */
export default function BahrainHeroScene() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(
          170deg,
          oklch(0.4 0.03 230) 0%,
          oklch(0.34 0.07 25) 42%,
          ${BAHRAIN_PALETTE.deepStorm} 100%
        )`,
      }}
    >
      {/* Storm clouds */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMin slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.55, filter: "blur(6px)" }}
      >
        <defs>
          <radialGradient id="bahrain-sun-break" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.85 0.1 60)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="oklch(0.85 0.1 60)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="610" cy="150" rx="150" ry="70" fill="url(#bahrain-sun-break)" />
        <path
          fill={BAHRAIN_PALETTE.stormCloud}
          d="M-20 70
            C 30 30, 90 40, 120 60
            C 150 20, 230 20, 260 60
            C 300 40, 360 50, 380 80
            C 420 60, 470 70, 480 100
            L 480 120 L -20 120 Z"
        />
        <path
          fill="oklch(0.3 0.02 230)"
          d="M420 40
            C 460 10, 540 15, 560 45
            C 600 25, 680 30, 700 60
            C 740 45, 800 55, 820 80
            L 820 100 L 420 100 Z"
          opacity="0.8"
        />
      </svg>

      {/* Drifting rain haze */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "-20%",
          width: "140%",
          height: "16%",
          background: `linear-gradient(to right, transparent, ${BAHRAIN_PALETTE.rainHaze}, transparent)`,
          filter: "blur(14px)",
          animation: "mist-drift 34s linear infinite",
        }}
      />

      {/* Far rainforest canopy */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.6 }}
      >
        <path fill={BAHRAIN_PALETTE.midCanopy} d={canopyPath(290, FAR_CROWNS)} />
      </svg>

      {/* Sepang's twin-leaf grandstand roof */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.85 }}
      >
        {/* stand body */}
        <path fill="oklch(0.26 0.03 200)" d="M240 318 L240 292 L560 292 L560 318 Z" />
        {/* two sweeping leaf canopies meeting at a central spine */}
        <path
          fill={BAHRAIN_PALETTE.roofWhite}
          opacity="0.82"
          d="M400 262
            C 360 250, 300 252, 236 282
            C 300 272, 360 274, 400 282 Z"
        />
        <path
          fill={BAHRAIN_PALETTE.roofWhite}
          opacity="0.82"
          d="M400 262
            C 440 250, 500 252, 564 282
            C 500 272, 440 274, 400 282 Z"
        />
        <path d="M400 258 L400 292" stroke={BAHRAIN_PALETTE.roofWhite} strokeWidth="2" opacity="0.6" />
      </svg>

      {/* Near haze */}
      <div
        style={{
          position: "absolute",
          top: "48%",
          left: "-25%",
          width: "150%",
          height: "12%",
          background: `linear-gradient(to right, transparent 10%, ${BAHRAIN_PALETTE.rainHaze} 45%, oklch(0.7 0.1 25 / 0.1) 65%, transparent)`,
          filter: "blur(18px)",
          animation: "mist-drift 40s linear infinite reverse",
        }}
      />

      {/* Foreground canopy framing the stand */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.95 }}
      >
        <path fill={BAHRAIN_PALETTE.nearCanopy} d={canopyPath(340, NEAR_CROWNS)} />
      </svg>

      {/* Track ribbon — back straight into the final hairpin, then the main straight */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        {[
          { stroke: BAHRAIN_PALETTE.vibrantRed, width: 8, opacity: 0.12, dash: undefined },
          { stroke: BAHRAIN_PALETTE.trackRibbon, width: 2.5, opacity: 0.8, dash: "5 7" },
        ].map((s, i) => (
          <path
            key={i}
            d="M 20 314
              L 660 314
              C 740 314, 760 344, 700 348
              L 60 350"
            fill="none"
            stroke={s.stroke}
            strokeWidth={s.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={s.dash}
            opacity={s.opacity}
          />
        ))}
      </svg>

      {/* Bahraini serrated flag edge along the top */}
      <svg
        viewBox="0 0 800 20"
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "10px", opacity: 0.55 }}
      >
        <rect width="800" height="20" fill={BAHRAIN_PALETTE.bahrainWhite} />
        <path
          fill={BAHRAIN_PALETTE.bahrainRed}
          d={`M0 20 ${Array.from({ length: 20 }, (_, i) => `L${i * 40 + 20} 6 L${i * 40 + 40} 20`).join(" ")} Z`}
        />
      </svg>

      {/* Soft top vignette so badges stay readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, oklch(0.18 0.03 220 / 0.42) 0%, transparent 28%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
