export interface RaceFact {
  label: string;
  value: string;
}

export interface RacePageData {
  heroImage?: string;
  facts: RaceFact[];
}

export const RACE_FACTS: Record<number, RacePageData> = {
  1: {
    heroImage: "/images/au-flag.webp",
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
        value: "58 laps of the 5.278 km circuit — approximately 307 km total",
      },
      {
        label: "Did you know?",
        value:
          "Albert Park is a temporary circuit. The roads around the lake are open to the public for the rest of the year — locals jog, cycle and walk here every other weekend of the year.",
      },
    ],
  },
};
