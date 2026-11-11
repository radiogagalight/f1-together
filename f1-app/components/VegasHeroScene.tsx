/** Las Vegas GP weekend celebration palette — neon Strip at night, maximum voltage */
export const VEGAS_PALETTE = {
  nightPurple: "oklch(0.14 0.08 312)",
  deepMagenta: "oklch(0.2 0.15 332)",
  horizonGlow: "oklch(0.38 0.2 350)",
  neonPink: "oklch(0.72 0.29 0)",
  hotMagenta: "oklch(0.66 0.28 338)",
  neonCyan: "oklch(0.85 0.16 200)",
  electricCyan: "oklch(0.88 0.17 195)",
  neonGold: "oklch(0.86 0.18 88)",
  jackpotGold: "oklch(0.82 0.19 84)",
  neonPurple: "oklch(0.62 0.26 300)",
  white: "oklch(0.98 0.01 300)",
  sphereCore: "oklch(0.72 0.2 318)",
  liveGlow: "oklch(0.68 0.28 340)",
  liveBorder: "oklch(0.74 0.26 340)",
  badgeBg: "oklch(0.3 0.16 320 / 0.5)",
  badgeBorder: "oklch(0.74 0.24 340 / 0.55)",
  /** Neon trio for the tricolor ribbon */
  vegasMagenta: "oklch(0.64 0.28 338)",
  vegasGold: "oklch(0.84 0.18 86)",
  vegasCyan: "oklch(0.82 0.16 198)",
} as const;

/** Neon speed lines — the fastest, most electric of the season */
export const VEGAS_SPEED_LINES = [
  { top: 5, width: 82, dur: 2.2, delay: 0.0, opacity: 0.46, color: VEGAS_PALETTE.neonPink, height: 3 },
  { top: 14, width: 58, dur: 2.9, delay: 0.8, opacity: 0.34, color: VEGAS_PALETTE.neonCyan, height: 2 },
  { top: 24, width: 88, dur: 2.0, delay: 1.9, opacity: 0.44, color: VEGAS_PALETTE.neonGold, height: 3 },
  { top: 35, width: 62, dur: 3.3, delay: 0.4, opacity: 0.32, color: VEGAS_PALETTE.hotMagenta, height: 2 },
  { top: 47, width: 84, dur: 2.2, delay: 1.5, opacity: 0.46, color: VEGAS_PALETTE.electricCyan, height: 3 },
  { top: 59, width: 52, dur: 2.7, delay: 1.1, opacity: 0.32, color: VEGAS_PALETTE.neonPurple, height: 2 },
  { top: 70, width: 78, dur: 2.5, delay: 2.6, opacity: 0.42, color: VEGAS_PALETTE.neonGold, height: 3 },
  { top: 81, width: 60, dur: 3.0, delay: 0.2, opacity: 0.32, color: VEGAS_PALETTE.neonPink, height: 2 },
  { top: 92, width: 74, dur: 2.4, delay: 2.1, opacity: 0.42, color: VEGAS_PALETTE.neonCyan, height: 3 },
] as const;

/** Chasing marquee bulbs around the jackpot sign — staggered so they run a loop */
const MARQUEE_BULBS = (() => {
  const bulbs: { x: number; y: number; i: number }[] = [];
  const left = 318;
  const right = 482;
  const top = 44;
  const bottom = 150;
  const stepX = 16;
  const stepY = 18;
  let i = 0;
  for (let x = left; x <= right; x += stepX) bulbs.push({ x, y: top, i: i++ });
  for (let y = top + stepY; y <= bottom; y += stepY) bulbs.push({ x: right, y, i: i++ });
  for (let x = right - stepX; x >= left; x -= stepX) bulbs.push({ x, y: bottom, i: i++ });
  for (let y = bottom - stepY; y > top; y -= stepY) bulbs.push({ x: left, y, i: i++ });
  return bulbs;
})();

/** Searchlight beams sweeping the night sky from behind the skyline */
type Beam = { x: number; color: string; dur: number; delay: number; origin: number };
const BEAMS: readonly Beam[] = [
  { x: 150, color: VEGAS_PALETTE.neonCyan, dur: 7, delay: 0, origin: 8 },
  { x: 300, color: VEGAS_PALETTE.neonPink, dur: 9, delay: 1.5, origin: -6 },
  { x: 520, color: VEGAS_PALETTE.neonGold, dur: 8, delay: 3, origin: 7 },
  { x: 660, color: VEGAS_PALETTE.neonPurple, dur: 10, delay: 0.8, origin: -9 },
];

/** Glittering Strip sparkles — deterministic so SSR and client match */
const SPARKLES = Array.from({ length: 34 }, (_, i) => {
  const x = ((i * 137) % 800);
  const y = 20 + ((i * 53) % 230);
  const r = 1 + (i % 3) * 0.7;
  const delay = ((i * 7) % 11) * 0.28;
  const dur = 2 + (i % 4) * 0.5;
  const color =
    i % 3 === 0 ? VEGAS_PALETTE.neonGold : i % 3 === 1 ? VEGAS_PALETTE.neonCyan : VEGAS_PALETTE.white;
  return { x, y, r, delay, dur, color, key: i };
});

/** A lit skyline tower with glowing windows */
function Tower({ x, w, h, color }: { x: number; w: number; h: number; color: string }) {
  const base = 300;
  const cols = Math.max(2, Math.floor(w / 10));
  const rows = Math.max(3, Math.floor(h / 14));
  const windows: { wx: number; wy: number; lit: boolean }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c + Math.round(x);
      windows.push({
        wx: x + 4 + c * ((w - 8) / cols),
        wy: base - h + 8 + r * ((h - 12) / rows),
        lit: idx % 3 !== 0,
      });
    }
  }
  return (
    <g>
      <rect x={x} y={base - h} width={w} height={h} fill="oklch(0.1 0.05 310)" opacity="0.95" />
      <rect x={x} y={base - h} width={w} height="2" fill={color} opacity="0.8" />
      {windows.map((win, i) => (
        <rect
          key={i}
          x={+win.wx.toFixed(2)}
          y={+win.wy.toFixed(2)}
          width="3.5"
          height="4.5"
          fill={win.lit ? color : "oklch(0.2 0.03 300)"}
          opacity={win.lit ? 0.75 : 0.3}
        />
      ))}
    </g>
  );
}

/**
 * Las Vegas Strip at night, going full-send: sweeping searchlights, the glowing
 * Sphere, a neon skyline, a chasing-bulb JACKPOT marquee flashing 7-7-7, tumbling
 * dice, a casino chip, and a river of glitter over the floodlit Strip straight.
 * Pure SVG/CSS — no external assets.
 */
export default function VegasHeroScene() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(
          180deg,
          ${VEGAS_PALETTE.nightPurple} 0%,
          ${VEGAS_PALETTE.deepMagenta} 55%,
          ${VEGAS_PALETTE.horizonGlow} 100%
        )`,
      }}
    >
      {/* Searchlight beams raking the sky */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", mixBlendMode: "screen" }}
      >
        <defs>
          {BEAMS.map((b, i) => (
            <linearGradient key={i} id={`vegas-beam-${i}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={b.color} stopOpacity="0.55" />
              <stop offset="60%" stopColor={b.color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={b.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {BEAMS.map((b, i) => (
          <g
            key={i}
            style={{
              transformOrigin: `${b.x}px 300px`,
              animation: `vegas-searchlight ${b.dur}s ease-in-out ${b.delay}s infinite`,
            }}
          >
            <polygon
              points={`${b.x},300 ${b.x - 26},-40 ${b.x + 26},-40`}
              fill={`url(#vegas-beam-${i})`}
              transform={`rotate(${b.origin} ${b.x} 300)`}
            />
          </g>
        ))}
      </svg>

      {/* The Sphere — pulsing, hue-shifting orb */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <radialGradient id="vegas-sphere" cx="42%" cy="40%" r="62%">
            <stop offset="0%" stopColor={VEGAS_PALETTE.white} stopOpacity="0.95" />
            <stop offset="35%" stopColor={VEGAS_PALETTE.sphereCore} stopOpacity="0.9" />
            <stop offset="75%" stopColor={VEGAS_PALETTE.hotMagenta} stopOpacity="0.85" />
            <stop offset="100%" stopColor={VEGAS_PALETTE.neonPurple} stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id="vegas-sphere-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={VEGAS_PALETTE.hotMagenta} stopOpacity="0.5" />
            <stop offset="100%" stopColor={VEGAS_PALETTE.hotMagenta} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g
          style={{
            transformOrigin: "120px 232px",
            animation: "vegas-sphere 6s ease-in-out infinite",
          }}
        >
          <circle cx="120" cy="232" r="96" fill="url(#vegas-sphere-glow)" />
          <circle cx="120" cy="232" r="58" fill="url(#vegas-sphere)" />
          {/* latitude/longitude grid lines */}
          {[0.35, 0.62, 0.85].map((f, i) => (
            <ellipse
              key={`lat-${i}`}
              cx="120"
              cy="232"
              rx="58"
              ry={+(58 * f).toFixed(1)}
              fill="none"
              stroke={VEGAS_PALETTE.white}
              strokeWidth="0.6"
              opacity="0.25"
            />
          ))}
          {[0.4, 0.72].map((f, i) => (
            <ellipse
              key={`lon-${i}`}
              cx="120"
              cy="232"
              rx={+(58 * f).toFixed(1)}
              ry="58"
              fill="none"
              stroke={VEGAS_PALETTE.white}
              strokeWidth="0.6"
              opacity="0.22"
            />
          ))}
        </g>
      </svg>

      {/* Neon skyline silhouette with lit towers */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <Tower x={210} w={46} h={132} color={VEGAS_PALETTE.neonCyan} />
        <Tower x={262} w={30} h={96} color={VEGAS_PALETTE.neonGold} />
        {/* A pin-thin landmark spire */}
        <g>
          <rect x={300} y={158} width={10} height={142} fill="oklch(0.1 0.05 310)" />
          <polygon points="305,120 300,160 310,160" fill="oklch(0.1 0.05 310)" />
          <circle
            cx="305"
            cy="118"
            r="4"
            fill={VEGAS_PALETTE.neonPink}
            style={{ animation: "vegas-flicker 1.3s steps(1) infinite" }}
          />
        </g>
        <Tower x={560} w={40} h={118} color={VEGAS_PALETTE.hotMagenta} />
        <Tower x={606} w={52} h={150} color={VEGAS_PALETTE.neonGold} />
        <Tower x={666} w={34} h={104} color={VEGAS_PALETTE.electricCyan} />
        <Tower x={706} w={44} h={126} color={VEGAS_PALETTE.neonPurple} />
      </svg>

      {/* Glitter sparkles */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMin slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {SPARKLES.map((s) => (
          <circle
            key={s.key}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={s.color}
            style={{
              transformOrigin: `${s.x}px ${s.y}px`,
              animation: `vegas-sparkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </svg>

      {/* Center stage: JACKPOT marquee, 777 reels, dice & chip */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          filter: "drop-shadow(0 0 10px oklch(0.7 0.25 340 / 0.5))",
        }}
      >
        {/* Marquee frame */}
        <rect
          x="316"
          y="42"
          width="168"
          height="110"
          rx="10"
          fill="oklch(0.16 0.08 320 / 0.72)"
          stroke={VEGAS_PALETTE.neonGold}
          strokeWidth="2"
        />
        {/* Chasing bulbs */}
        {MARQUEE_BULBS.map((b) => (
          <circle
            key={b.i}
            cx={b.x}
            cy={b.y}
            r="3"
            fill={VEGAS_PALETTE.neonGold}
            style={{
              animation: `vegas-bulb 1s steps(1) ${((b.i % 6) * 1) / 6}s infinite`,
            }}
          />
        ))}

        {/* Three 7 reels */}
        {[352, 400, 448].map((cx, i) => (
          <g key={cx}>
            <rect x={cx - 18} y="62" width="36" height="52" rx="5" fill={VEGAS_PALETTE.white} opacity="0.92" />
            <text
              x={cx}
              y="104"
              textAnchor="middle"
              fontSize="42"
              fontWeight="900"
              fontFamily="Arial, sans-serif"
              fill={VEGAS_PALETTE.neonPink}
              style={{ animation: `vegas-flicker 1.6s steps(1) ${i * 0.18}s infinite` }}
            >
              7
            </text>
          </g>
        ))}

        {/* JACKPOT wordmark */}
        <text
          x="400"
          y="140"
          textAnchor="middle"
          fontSize="20"
          fontWeight="900"
          letterSpacing="3"
          fontFamily="Arial, sans-serif"
          fill={VEGAS_PALETTE.neonGold}
          style={{ animation: "vegas-flicker 2.3s steps(1) infinite" }}
        >
          JACKPOT
        </text>

        {/* Tumbling dice, bottom-left of stage */}
        <g
          style={{
            transformOrigin: "250px 232px",
            animation: "vegas-sphere 5s ease-in-out infinite",
          }}
        >
          <rect x="226" y="208" width="44" height="44" rx="9" fill={VEGAS_PALETTE.white} transform="rotate(-12 248 230)" />
          {[
            [236, 218],
            [260, 218],
            [248, 230],
            [236, 242],
            [260, 242],
          ].map(([dx, dy], i) => (
            <circle key={i} cx={dx} cy={dy} r="3.4" fill={VEGAS_PALETTE.nightPurple} transform="rotate(-12 248 230)" />
          ))}
        </g>

        {/* Casino chip, bottom-right of stage */}
        <g style={{ transformOrigin: "556px 230px", animation: "vegas-sparkle 3.4s ease-in-out infinite" }}>
          <circle cx="556" cy="230" r="26" fill={VEGAS_PALETTE.hotMagenta} />
          <circle cx="556" cy="230" r="26" fill="none" stroke={VEGAS_PALETTE.white} strokeWidth="3" strokeDasharray="7 7" />
          <circle cx="556" cy="230" r="15" fill="none" stroke={VEGAS_PALETTE.white} strokeWidth="2" opacity="0.8" />
          <text x="556" y="236" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="Arial, sans-serif" fill={VEGAS_PALETTE.white}>
            21
          </text>
        </g>
      </svg>

      {/* Floodlit Strip straight — neon track ribbon */}
      <svg
        viewBox="0 0 800 400"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <path
          d="M -20 392 C 180 380, 300 352, 400 352 C 500 352, 620 380, 820 392"
          fill="none"
          stroke={VEGAS_PALETTE.hotMagenta}
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.22"
        />
        <path
          d="M -20 392 C 180 380, 300 352, 400 352 C 500 352, 620 380, 820 392"
          fill="none"
          stroke={VEGAS_PALETTE.neonCyan}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="7 9"
          opacity="0.9"
          style={{ animation: "vegas-flicker 2s steps(1) infinite" }}
        />
      </svg>

      {/* Neon tricolor light-strip along the top */}
      <svg
        viewBox="0 0 800 6"
        preserveAspectRatio="none"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "10px", opacity: 0.85 }}
      >
        <rect x="0" y="0" width="800" height="2" fill={VEGAS_PALETTE.vegasMagenta} />
        <rect x="0" y="2" width="800" height="2" fill={VEGAS_PALETTE.vegasGold} />
        <rect x="0" y="4" width="800" height="2" fill={VEGAS_PALETTE.vegasCyan} />
      </svg>

      {/* Soft top vignette so badges stay readable */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, oklch(0.12 0.06 315 / 0.42) 0%, transparent 26%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
