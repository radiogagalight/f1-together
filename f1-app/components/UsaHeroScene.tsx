/** US GP (COTA) weekend celebration palette — OKLCH Old Glory red, white & blue over a Texas night */
export const USA_PALETTE = {
  nightNavy: "oklch(0.16 0.06 265)",
  midNavy: "oklch(0.26 0.11 265)",
  hillDusk: "oklch(0.2 0.05 270)",
  sunsetEmber: "oklch(0.5 0.2 28)",
  gloryRed: "oklch(0.58 0.23 25)",
  brightRed: "oklch(0.66 0.22 25)",
  starWhite: "oklch(0.97 0.01 250)",
  skyBlue: "oklch(0.68 0.16 250)",
  electricBlue: "oklch(0.58 0.2 262)",
  towerSteel: "oklch(0.78 0.02 250)",
  trackRibbon: "oklch(0.95 0.02 250 / 0.7)",
  liveGlow: "oklch(0.56 0.22 25)",
  liveBorder: "oklch(0.64 0.2 25)",
  badgeBg: "oklch(0.36 0.14 262 / 0.5)",
  badgeBorder: "oklch(0.64 0.18 25 / 0.55)",
  /** Stars and Stripes */
  usaRed: "oklch(0.52 0.21 25)",
  usaWhite: "oklch(0.97 0 0)",
  usaBlue: "oklch(0.36 0.14 264)",
} as const;

/** Red, white & blue speed lines — faster and brighter than other weekends */
export const USA_SPEED_LINES = [
  { top: 6, width: 78, dur: 2.6, delay: 0.0, opacity: 0.42, color: USA_PALETTE.gloryRed, height: 3 },
  { top: 15, width: 56, dur: 3.2, delay: 1.0, opacity: 0.32, color: USA_PALETTE.starWhite, height: 2 },
  { top: 26, width: 84, dur: 2.3, delay: 2.2, opacity: 0.4, color: USA_PALETTE.electricBlue, height: 3 },
  { top: 37, width: 60, dur: 3.6, delay: 0.5, opacity: 0.3, color: USA_PALETTE.gloryRed, height: 2 },
  { top: 49, width: 80, dur: 2.5, delay: 1.7, opacity: 0.42, color: USA_PALETTE.starWhite, height: 3 },
  { top: 61, width: 50, dur: 3.0, delay: 1.3, opacity: 0.3, color: USA_PALETTE.electricBlue, height: 2 },
  { top: 72, width: 74, dur: 2.8, delay: 3.0, opacity: 0.38, color: USA_PALETTE.gloryRed, height: 3 },
  { top: 83, width: 58, dur: 3.3, delay: 0.3, opacity: 0.3, color: USA_PALETTE.starWhite, height: 2 },
  { top: 93, width: 70, dur: 2.7, delay: 2.5, opacity: 0.38, color: USA_PALETTE.electricBlue, height: 3 },
] as const;

/** Five-point star path centred on (cx, cy) */
function starPath(cx: number, cy: number, r: number) {
  const inner = r * 0.4;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

/** Starfield canton — staggered rows like the flag's union */
const CANTON_STARS = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: row % 2 === 0 ? 6 : 5 }, (_, col) => ({
    x: 26 + col * 40 + (row % 2 === 0 ? 0 : 20),
    y: 22 + row * 24,
    delay: ((row * 7 + col * 3) % 10) * 0.32,
  })),
).flat();

type Burst = { x: number; y: number; r: number; color: string; delay: number; dur: number; rays: number };

/** Firework bursts — staggered so the sky never goes quiet */
const BURSTS: readonly Burst[] = [
  { x: 560, y: 70, r: 58, color: USA_PALETTE.brightRed, delay: 0, dur: 3.2, rays: 14 },
  { x: 700, y: 120, r: 44, color: USA_PALETTE.starWhite, delay: 0.9, dur: 3.2, rays: 12 },
  { x: 430, y: 110, r: 50, color: USA_PALETTE.skyBlue, delay: 1.7, dur: 3.2, rays: 14 },
  { x: 640, y: 40, r: 36, color: USA_PALETTE.skyBlue, delay: 2.4, dur: 3.2, rays: 10 },
  { x: 330, y: 60, r: 40, color: USA_PALETTE.brightRed, delay: 2.9, dur: 3.2, rays: 12 },
  { x: 760, y: 200, r: 34, color: USA_PALETTE.brightRed, delay: 1.3, dur: 3.2, rays: 10 },
];

function FireworkBurst({ x, y, r, color, delay, dur, rays }: Burst) {
  return (
    <g
      className="usa-firework"
      style={{
        transformOrigin: `${x}px ${y}px`,
        animation: `usa-firework ${dur}s ease-out ${delay}s infinite`,
      }}
    >
      {Array.from({ length: rays }, (_, i) => {
        const a = (i / rays) * Math.PI * 2;
        // Rounded so server and client render identical attributes
        const x1 = +(x + Math.cos(a) * r * 0.25).toFixed(2);
        const y1 = +(y + Math.sin(a) * r * 0.25).toFixed(2);
        const x2 = +(x + Math.cos(a) * r).toFixed(2);
        const y2 = +(y + Math.sin(a) * r).toFixed(2);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" strokeLinecap="round" />
            <circle cx={x2} cy={y2} r="2.6" fill={color} />
          </g>
        );
      })}
      <circle cx={x} cy={y} r={r * 0.14} fill={USA_PALETTE.starWhite} opacity="0.9" />
    </g>
  );
}

/** Red veil strands spilling off the COTA Observation Tower's crown */
const VEIL_STRANDS = Array.from({ length: 9 }, (_, i) => {
  const spread = (i - 4) * 9;
  return `M470 132 C ${470 + spread * 0.6} 150, ${470 + spread * 1.6} 220, ${470 + spread * 2.1} 300`;
});

/**
 * Layered US-GP-at-COTA backdrop: a Texas night going off — fireworks over
 * Austin, a twinkling star canton, waving Stars and Stripes, the Observation
 * Tower and its red veil, and the climb up to Turn 1.
 * Pure SVG/CSS — no external assets.
 */
export default function UsaHeroScene() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(
          175deg,
          ${USA_PALETTE.nightNavy} 0%,
          ${USA_PALETTE.midNavy} 48%,
          oklch(0.32 0.14 20) 74%,
          ${USA_PALETTE.sunsetEmber} 100%
        )`,
      }}
    >
      {/* Waving stripes sweeping across the sky */}
      <div
        className="usa-wave"
        style={{
          position: "absolute",
          inset: "-10% -20%",
          opacity: 0.16,
          background: `repeating-linear-gradient(
            -8deg,
            ${USA_PALETTE.usaRed} 0px,
            ${USA_PALETTE.usaRed} 22px,
            ${USA_PALETTE.usaWhite} 22px,
            ${USA_PALETTE.usaWhite} 44px
          )`,
          maskImage: "linear-gradient(to bottom, transparent 5%, black 40%, black 70%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 5%, black 40%, black 70%, transparent 95%)",
          animation: "usa-flag-wave 6s ease-in-out infinite",
        }}
      />

      {/* Star canton, top-left */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMinYMin slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="usa-canton" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={USA_PALETTE.usaBlue} stopOpacity="0.75" />
            <stop offset="100%" stopColor={USA_PALETTE.usaBlue} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="280" height="140" fill="url(#usa-canton)" />
        {CANTON_STARS.map((s, i) => (
          <path
            key={i}
            className="usa-twinkle"
            d={starPath(s.x, s.y, 6)}
            fill={USA_PALETTE.starWhite}
            style={{ animation: `usa-twinkle 3.2s ease-in-out ${s.delay}s infinite` }}
          />
        ))}
      </svg>

      {/* Fireworks */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMaxYMin slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: "drop-shadow(0 0 6px oklch(0.9 0.08 30 / 0.6))" }}
      >
        {BURSTS.map((b, i) => (
          <FireworkBurst key={i} {...b} />
        ))}
      </svg>

      {/* Giant faint Lone Star */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07 }}
      >
        <path d={starPath(600, 210, 150)} fill={USA_PALETTE.starWhite} />
      </svg>

      {/* Hill country + Turn 1 rise, Observation Tower */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {/* far ridge */}
        <path
          fill="oklch(0.24 0.06 275)"
          opacity="0.85"
          d="M0 300 C 120 286, 220 296, 330 288 C 450 278, 560 292, 680 282 C 740 278, 780 284, 800 286 L800 400 L0 400 Z"
        />

        {/* Observation Tower — slim shaft, crown deck, red veil */}
        <g opacity="0.95">
          <path d="M466 300 L468 132 L472 132 L474 300 Z" fill={USA_PALETTE.towerSteel} opacity="0.75" />
          {VEIL_STRANDS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke={USA_PALETTE.gloryRed}
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity={0.55 + (i % 3) * 0.12}
            />
          ))}
          <ellipse cx="470" cy="130" rx="20" ry="5" fill={USA_PALETTE.towerSteel} />
          <rect x="455" y="122" width="30" height="7" rx="2" fill={USA_PALETTE.starWhite} opacity="0.85" />
          <circle cx="470" cy="114" r="2.5" fill={USA_PALETTE.brightRed} className="usa-twinkle" style={{ animation: "usa-twinkle 1.4s ease-in-out infinite" }} />
          <line x1="470" y1="114" x2="470" y2="122" stroke={USA_PALETTE.towerSteel} strokeWidth="1.2" />
        </g>

        {/* near hill — the climb to Turn 1 on the right */}
        <path
          fill={USA_PALETTE.hillDusk}
          d="M0 336 C 160 332, 360 334, 500 322 C 580 314, 640 270, 700 252 C 740 242, 780 250, 800 260 L800 400 L0 400 Z"
        />

        {/* Track ribbon: main straight, uphill into Turn 1 hairpin */}
        {[
          { stroke: USA_PALETTE.gloryRed, width: 9, opacity: 0.2, dash: undefined },
          { stroke: USA_PALETTE.trackRibbon, width: 2.5, opacity: 0.85, dash: "6 7" },
        ].map((s, i) => (
          <path
            key={i}
            d="M 20 352
              C 220 350, 420 350, 540 336
              C 620 326, 660 284, 706 266
              C 736 256, 752 266, 732 280
              C 708 296, 690 320, 660 340"
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

      {/* Stars and Stripes ribbon along the top */}
      <svg
        viewBox="0 0 800 26"
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "12px", opacity: 0.75 }}
      >
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x="0" y={i * (26 / 7)} width="800" height={26 / 7} fill={i % 2 === 0 ? USA_PALETTE.usaRed : USA_PALETTE.usaWhite} />
        ))}
        <rect x="0" y="0" width="140" height="26" fill={USA_PALETTE.usaBlue} />
      </svg>

      {/* Soft top vignette so badges stay readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, oklch(0.14 0.05 265 / 0.38) 0%, transparent 28%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
