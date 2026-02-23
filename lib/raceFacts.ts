export interface RaceFact {
  label: string;
  value: string;
}

export interface RaceSession {
  name: string;
  utc: string; // ISO UTC datetime string
}

export interface RacePageData {
  heroImage?: string;
  trackImage?: string;
  facts: RaceFact[];
  sessions?: RaceSession[];
}

export const RACE_FACTS: Record<number, RacePageData> = {
  2: {
    heroImage: "/images/china-flag.png",
    trackImage: "/images/china-gp-track.webp",
    facts: [
      {
        label: "First F1 race",
        value: "2004 — Rubens Barrichello won the inaugural Chinese Grand Prix at Shanghai International Circuit.",
      },
      {
        label: "Most wins",
        value: "Lewis Hamilton — 6 victories (2008, 2011, 2014, 2015, 2017, 2019)",
      },
      {
        label: "Best known for",
        value: "The long, sweeping Turn 6-7 complex and the hairpin at Turn 14 — one of the best overtaking spots on the calendar.",
      },
      {
        label: "Qualifying record",
        value: "Max Verstappen — 1:12.930 (2024)",
      },
      {
        label: "Race lap record",
        value: "Michael Schumacher — 1:32.238 (2004)",
      },
      {
        label: "Race distance",
        value: "56 laps × 5.451 km = 305.066 km total",
      },
      {
        label: "Sprint weekend",
        value: "China hosts a Sprint race in 2026 — the only format where Saturday features a Sprint Shootout and Sprint race instead of regular qualifying.",
      },
      {
        label: "Did you know?",
        value: "Shanghai International Circuit was purpose-built for Formula 1 and opened in 2004. Its layout was inspired by the Chinese character 上 (shàng), meaning 'above' or 'upper'.",
      },
    ],
  },
  1: {
    heroImage: "/images/aus-gp-track.avif",
    trackImage: "/images/aus-gp-track-2.jpg",
    sessions: [
      { name: "Practice 1",  utc: "2026-03-06T01:30:00Z" },
      { name: "Practice 2",  utc: "2026-03-06T05:00:00Z" },
      { name: "Practice 3",  utc: "2026-03-07T01:30:00Z" },
      { name: "Qualifying",  utc: "2026-03-07T05:00:00Z" },
      { name: "Race",        utc: "2026-03-08T04:00:00Z" },
    ],
    facts: [
      {
        label: "First F1 race",
        value:
          "1996 — Damon Hill won the inaugural Albert Park Grand Prix by 38 seconds, the largest winning margin in the circuit's history.",
      },
      {
        label: "Most wins",
        value: "Michael Schumacher — 4 victories (2000, 2001, 2002, 2004)",
      },
      {
        label: "Best known for",
        value:
          "The traditional season opener. Albert Park has hosted the first race of the year more than any other circuit on the calendar.",
      },
      {
        label: "Qualifying record",
        value: "Lando Norris — 1:15.096 (2025)",
      },
      {
        label: "Race lap record",
        value: "Charles Leclerc — 1:19.813 (2024)",
      },
      {
        label: "Race distance",
        value: "58 laps × 5.278 km = 306.124 km total",
      },
      {
        label: "Average speed",
        value: "Qualifying average exceeds 250 km/h — one of the faster street circuits on the calendar",
      },
      {
        label: "Did you know?",
        value:
          "Albert Park is a temporary circuit. The roads around the lake are open to the public for the rest of the year — locals jog, cycle and walk here every other weekend of the year.",
      },
    ],
  },
};
