/** Spa weekend celebration palette — OKLCH forest greens + mist neutrals */
export const SPA_PALETTE = {
  deepPine: "oklch(0.22 0.04 155)",
  midForest: "oklch(0.32 0.055 152)",
  mistySage: "oklch(0.62 0.07 148)",
  fogWhite: "oklch(0.88 0.01 160)",
  mistBand: "oklch(0.78 0.02 155 / 0.18)",
  elevation: "oklch(0.72 0.06 148 / 0.55)",
  liveGlow: "oklch(0.45 0.1 155)",
  liveBorder: "oklch(0.55 0.12 152)",
  badgeBg: "oklch(0.35 0.06 150 / 0.45)",
  badgeBorder: "oklch(0.55 0.08 148 / 0.5)",
  /** Belgian tricolor accents — used once as a thin bar */
  belgianBlack: "oklch(0.18 0.005 155)",
  belgianYellow: "oklch(0.88 0.14 95)",
  belgianRed: "oklch(0.52 0.2 25)",
} as const;

/** Mist-palette speed lines for the weekend atmosphere */
export const SPA_SPEED_LINES = [
  { top: 8, width: 68, dur: 4.2, delay: 0.0, opacity: 0.28, color: SPA_PALETTE.mistySage, height: 3 },
  { top: 19, width: 48, dur: 5.2, delay: 1.4, opacity: 0.22, color: SPA_PALETTE.fogWhite, height: 2 },
  { top: 31, width: 74, dur: 3.5, delay: 3.1, opacity: 0.26, color: SPA_PALETTE.midForest, height: 3 },
  { top: 44, width: 55, dur: 6.0, delay: 0.8, opacity: 0.2, color: SPA_PALETTE.fogWhite, height: 2 },
  { top: 57, width: 72, dur: 4.0, delay: 2.5, opacity: 0.3, color: SPA_PALETTE.mistySage, height: 3 },
  { top: 69, width: 42, dur: 4.8, delay: 1.9, opacity: 0.18, color: SPA_PALETTE.fogWhite, height: 2 },
  { top: 81, width: 62, dur: 4.4, delay: 4.3, opacity: 0.24, color: SPA_PALETTE.belgianYellow, height: 2 },
  { top: 91, width: 52, dur: 5.5, delay: 0.6, opacity: 0.22, color: SPA_PALETTE.deepPine, height: 3 },
] as const;

/**
 * Layered Ardennes backdrop: pine treelines, drifting mist, Eau Rouge elevation ribbon.
 * Pure SVG/CSS — no external assets.
 */
export default function SpaHeroScene() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(
          165deg,
          oklch(0.18 0.03 155) 0%,
          ${SPA_PALETTE.deepPine} 40%,
          oklch(0.16 0.025 160) 100%
        )`,
      }}
    >
      {/* Distant treeline */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.55,
        }}
      >
        <path
          fill={SPA_PALETTE.deepPine}
          d="M0 280
            L40 240 L55 255 L80 220 L100 245 L130 200 L155 230 L180 195 L210 235
            L240 210 L270 250 L300 205 L330 240 L360 215 L390 255 L420 200 L450 245
            L480 210 L510 250 L540 205 L570 240 L600 215 L630 255 L660 200 L690 245
            L720 210 L750 250 L780 220 L800 260 L800 400 L0 400 Z"
        />
      </svg>

      {/* Mid mist band */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "-20%",
          width: "140%",
          height: "18%",
          background: `linear-gradient(to right, transparent, ${SPA_PALETTE.mistBand}, transparent)`,
          filter: "blur(12px)",
          animation: "mist-drift 28s linear infinite",
        }}
      />

      {/* Mid treeline */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.75,
        }}
      >
        <path
          fill={SPA_PALETTE.midForest}
          d="M0 300
            L25 265 L45 280 L70 245 L95 275 L120 235 L150 270 L175 240 L205 275
            L235 250 L265 285 L295 245 L325 280 L355 250 L385 290 L415 240 L445 280
            L475 255 L505 290 L535 245 L565 280 L595 250 L625 290 L655 240 L685 280
            L715 255 L745 290 L775 260 L800 295 L800 400 L0 400 Z"
        />
      </svg>

      {/* Near mist band */}
      <div
        style={{
          position: "absolute",
          top: "52%",
          left: "-30%",
          width: "160%",
          height: "14%",
          background: `linear-gradient(to right, transparent 10%, ${SPA_PALETTE.mistBand} 40%, oklch(0.78 0.02 155 / 0.12) 60%, transparent)`,
          filter: "blur(16px)",
          animation: "mist-drift 36s linear infinite reverse",
        }}
      />

      {/* Foreground treeline */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.9,
        }}
      >
        <path
          fill="oklch(0.16 0.035 152)"
          d="M0 330
            L20 295 L40 315 L65 275 L90 310 L115 270 L145 305 L170 280 L200 320
            L230 285 L260 325 L290 275 L320 315 L350 285 L380 330 L410 275 L440 320
            L470 290 L500 330 L530 280 L560 320 L590 290 L620 330 L650 275 L680 320
            L710 295 L740 330 L770 290 L800 325 L800 400 L0 400 Z"
        />
      </svg>

      {/* Eau Rouge–Raidillon elevation ribbon */}
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
          d="M 40 340 C 120 338, 180 330, 220 300 C 280 240, 320 180, 380 160 C 440 140, 500 155, 560 200 C 620 250, 680 300, 760 320"
          fill="none"
          stroke={SPA_PALETTE.elevation}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="6 8"
          opacity="0.7"
        />
        {/* Soft glow under the ribbon */}
        <path
          d="M 40 340 C 120 338, 180 330, 220 300 C 280 240, 320 180, 380 160 C 440 140, 500 155, 560 200 C 620 250, 680 300, 760 320"
          fill="none"
          stroke={SPA_PALETTE.mistySage}
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
            "linear-gradient(to bottom, oklch(0.12 0.02 155 / 0.35) 0%, transparent 28%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
