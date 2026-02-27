"use client";

// Sprite sheet: 1536×1024px, 2 cols × 4 rows — each cell 768×256px
// Displayed at 96×32px per cell (3:1 ratio preserved)
// background-size: 192×128px (2×96 by 4×32)

export type CarPose =
  | "front"           // row 1 col 1 — head-on, waiting
  | "side-right"      // row 1 col 2 — racing right
  | "side-left"       // row 2 col 2 — driving away left
  | "quarter-front"   // row 4 col 1 — dramatic 3/4 intro angle
  | "top-down"        // row 3 col 2 — bird's eye
  | "single";         // standalone f1-companion.png (full image)

const W = 192; // display width per cell
const H = 64;  // display height per cell

// background-position for each sprite cell
const SPRITE_POS: Record<Exclude<CarPose, "single">, string> = {
  "front":         `0px 0px`,
  "side-right":    `-${W}px 0px`,
  "side-left":     `-${W}px -${H}px`,
  "quarter-front": `0px -${H * 3}px`,
  "top-down":      `-${W}px -${H * 2}px`,
};

interface CompanionCarProps {
  pose: CarPose;
  style?: React.CSSProperties;
}

export default function CompanionCar({ pose, style }: CompanionCarProps) {
  if (pose === "single") {
    return (
      <img
        src="/images/f1-companion.png"
        alt="F1 companion car"
        style={{
          width: "96px",
          height: "auto",
          display: "block",
          ...style,
        }}
        draggable={false}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        width: `${W}px`,
        height: `${H}px`,
        backgroundImage: "url('/images/f1-companion-sheet.png')",
        backgroundSize: `${W * 2}px ${H * 4}px`,
        backgroundPosition: SPRITE_POS[pose],
        backgroundRepeat: "no-repeat",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
