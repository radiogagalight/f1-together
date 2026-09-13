/** Azerbaijan GP weekend celebration palette — OKLCH Caspian dusk, Flame Towers, Old City stone */
export const BAKU_PALETTE = {
  deepCaspian: "oklch(0.18 0.045 250)",
  midBlue: "oklch(0.38 0.08 240)",
  flameOrange: "oklch(0.65 0.19 45)",
  brightFlame: "oklch(0.73 0.18 50)",
  seaHaze: "oklch(0.8 0.05 220 / 0.16)",
  castleStone: "oklch(0.55 0.02 70)",
  castleStoneShadow: "oklch(0.3 0.02 60)",
  trackRibbon: "oklch(0.74 0.12 40 / 0.62)",
  liveGlow: "oklch(0.55 0.18 40)",
  liveBorder: "oklch(0.63 0.16 45)",
  badgeBg: "oklch(0.38 0.12 240 / 0.45)",
  badgeBorder: "oklch(0.6 0.14 220 / 0.5)",
  /** Azerbaijan tricolor — mavi, qırmızı, yaşıl */
  azeriBlue: "oklch(0.55 0.15 235)",
  azeriRed: "oklch(0.55 0.2 25)",
  azeriGreen: "oklch(0.5 0.14 145)",
} as const;

/** Caspian dusk / Flame Tower speed lines for the weekend atmosphere */
export const BAKU_SPEED_LINES = [
  { top: 8, width: 72, dur: 3.4, delay: 0.0, opacity: 0.32, color: BAKU_PALETTE.flameOrange, height: 3 },
  { top: 19, width: 50, dur: 4.4, delay: 1.2, opacity: 0.22, color: BAKU_PALETTE.azeriBlue, height: 2 },
  { top: 31, width: 80, dur: 2.9, delay: 2.7, opacity: 0.3, color: BAKU_PALETTE.brightFlame, height: 3 },
  { top: 44, width: 56, dur: 5.0, delay: 0.6, opacity: 0.2, color: BAKU_PALETTE.castleStone, height: 2 },
  { top: 57, width: 76, dur: 3.5, delay: 2.1, opacity: 0.32, color: BAKU_PALETTE.flameOrange, height: 3 },
  { top: 69, width: 44, dur: 4.1, delay: 1.6, opacity: 0.18, color: BAKU_PALETTE.azeriBlue, height: 2 },
  { top: 81, width: 66, dur: 3.8, delay: 3.7, opacity: 0.26, color: BAKU_PALETTE.azeriGreen, height: 2 },
  { top: 91, width: 54, dur: 4.7, delay: 0.4, opacity: 0.28, color: BAKU_PALETTE.azeriRed, height: 3 },
] as const;

/**
 * Layered Baku backdrop: the Flame Towers over the Caspian at dusk, the
 * crenellated Old City walls, and the notoriously tight castle-section kink.
 * Pure SVG/CSS — no external assets.
 */
export default function BakuHeroScene() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(
          165deg,
          oklch(0.42 0.09 40) 0%,
          oklch(0.3 0.08 230) 38%,
          ${BAKU_PALETTE.deepCaspian} 100%
        )`,
      }}
    >
      {/* Distant Flame Towers silhouette */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.55 }}
      >
        <path
          fill={BAKU_PALETTE.midBlue}
          d="M0 285
            L120 285 L120 260 L140 260 L140 285
            L520 285
            L540 240
            C548 220, 556 210, 566 196
            C576 210, 584 220, 592 240
            L612 285
            L632 250
            C640 232, 648 222, 658 210
            C668 222, 676 232, 684 250
            L704 285
            L724 258
            C730 244, 736 236, 744 226
            C752 236, 758 244, 764 258
            L784 285
            L800 285 L800 400 L0 400 Z"
        />
        {/* flame-tower warm glow */}
        <defs>
          <radialGradient id="baku-flame-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={BAKU_PALETTE.brightFlame} stopOpacity="0.85" />
            <stop offset="100%" stopColor={BAKU_PALETTE.brightFlame} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="566" cy="230" rx="46" ry="70" fill="url(#baku-flame-glow)" opacity="0.55" />
        <ellipse cx="658" cy="248" rx="34" ry="52" fill="url(#baku-flame-glow)" opacity="0.4" />
        <ellipse cx="744" cy="258" rx="26" ry="40" fill="url(#baku-flame-glow)" opacity="0.35" />
      </svg>

      {/* Mid Caspian sea haze */}
      <div
        style={{
          position: "absolute",
          top: "33%",
          left: "-20%",
          width: "140%",
          height: "16%",
          background: `linear-gradient(to right, transparent, ${BAKU_PALETTE.seaHaze}, transparent)`,
          filter: "blur(14px)",
          animation: "mist-drift 34s linear infinite",
        }}
      />

      {/* Mid Baku skyline */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.72 }}
      >
        <path
          fill="oklch(0.28 0.05 235)"
          d="M0 312
            L50 312 L50 288 L70 288 L70 312
            L130 312 L130 270 L146 270 L146 312
            L200 312 L200 294 L222 294 L222 312
            L280 312 L280 258 L298 244 L316 258 L316 312
            L370 312 L370 282 L390 282 L390 312
            L450 312 L450 264 L466 264 L466 312
            L520 312 L520 248 L536 236 L552 248 L552 312
            L610 312 L610 284 L628 284 L628 312
            L680 312 L680 292 L700 292 L700 312
            L750 312 L750 268 L770 268 L770 312
            L800 312 L800 400 L0 400 Z"
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
          background: `linear-gradient(to right, transparent 10%, ${BAKU_PALETTE.seaHaze} 45%, oklch(0.75 0.06 45 / 0.1) 65%, transparent)`,
          filter: "blur(18px)",
          animation: "mist-drift 40s linear infinite reverse",
        }}
      />

      {/* Foreground Old City crenellated wall */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.94 }}
      >
        <path
          fill={BAKU_PALETTE.castleStone}
          d="M0 356
            L0 340 L22 340 L22 350 L44 350 L44 340 L66 340 L66 350 L88 350 L88 340
            L110 340 L110 350 L132 350 L132 340 L154 340 L154 350 L176 350 L176 340
            L198 340 L198 336 L520 336
            L520 340 L542 340 L542 350 L564 350 L564 340 L586 340 L586 350 L608 350 L608 340
            L630 340 L630 350 L652 350 L652 340 L674 340 L674 350 L696 350 L696 340
            L718 340 L718 336 L800 336
            L800 400 L0 400 Z"
        />
        <path
          fill={BAKU_PALETTE.castleStoneShadow}
          d="M0 356 L800 356 L800 400 L0 400 Z"
        />
      </svg>

      {/* Track ribbon — long straight into the notorious castle-section kink */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <path
          d="M 20 320
            L 450 320
            L 480 320
            L 496 294
            L 514 294
            L 530 320
            L 560 320
            L 790 320"
          fill="none"
          stroke={BAKU_PALETTE.flameOrange}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.12"
        />
        <path
          d="M 20 320
            L 450 320
            L 480 320
            L 496 294
            L 514 294
            L 530 320
            L 560 320
            L 790 320"
          fill="none"
          stroke={BAKU_PALETTE.trackRibbon}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
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
            "linear-gradient(to bottom, oklch(0.18 0.04 240 / 0.42) 0%, transparent 28%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
