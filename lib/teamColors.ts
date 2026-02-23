export const TEAM_COLORS: Record<string, string> = {
  "red-bull":     "#3671C6",
  "ferrari":      "#E8002D",
  "mercedes":     "#27F4D2",
  "mclaren":      "#FF8000",
  "aston-martin": "#229971",
  "alpine":       "#0090FF",
  "williams":     "#64C4FF",
  "audi":         "#C0C0C0",
  "racing-bulls": "#6692FF",
  "haas":         "#E8002D",
  "cadillac":     "#C8A84B",
};

export function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
