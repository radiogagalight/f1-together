"use client";

export type CarPose =
  | "front"
  | "side-right"
  | "side-left"
  | "quarter-front"
  | "top-down"
  | "single";

interface CompanionCarProps {
  pose: CarPose;
  style?: React.CSSProperties;
}

export default function CompanionCar({ pose, style }: CompanionCarProps) {
  return (
    <img
      src="/images/f1car.png"
      alt="F1 companion car"
      style={{
        width: "120px",
        height: "auto",
        display: "block",
        ...style,
      }}
      draggable={false}
    />
  );
}
