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
  facts?: RaceFact[];
  sessions?: RaceSession[];
}

export const RACE_FACTS: Record<number, RacePageData> = {
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
      { label: "First F1 race",      value: "1996 — Damon Hill won the inaugural Albert Park Grand Prix by 38 seconds, the largest winning margin in the circuit’s history." },
      { label: "Most wins",          value: "Michael Schumacher — 4 victories (2000, 2001, 2002, 2004)" },
      { label: "Best known for",     value: "The traditional season opener. Albert Park has hosted the first race of the year more than any other circuit on the calendar." },
      { label: "Qualifying record",  value: "Lando Norris — 1:15.096 (2025)" },
      { label: "Race lap record",    value: "Charles Leclerc — 1:19.813 (2024)" },
      { label: "Race distance",      value: "58 laps × 5.278 km = 306.124 km total" },
      { label: "Most recent winner", value: "Carlos Sainz (Ferrari) — 2024" },
      { label: "Did you know?",      value: "Albert Park is a temporary circuit. The roads around the lake are open to the public for the rest of the year — locals jog, cycle and walk here every other weekend of the year." },
    ],
  },
  2: {
    heroImage: "/images/china-flag.png",
    trackImage: "/images/china-gp-track.webp",
    sessions: [
      { name: "Practice 1",        utc: "2026-03-13T03:30:00Z" },
      { name: "Sprint Qualifying", utc: "2026-03-13T07:30:00Z" },
      { name: "Sprint Race",       utc: "2026-03-14T03:00:00Z" },
      { name: "Qualifying",        utc: "2026-03-14T07:00:00Z" },
      { name: "Race",              utc: "2026-03-15T07:00:00Z" },
    ],
    facts: [
      { label: "First F1 race",      value: "2004 — Rubens Barrichello won the inaugural Chinese Grand Prix at Shanghai International Circuit." },
      { label: "Most wins",          value: "Lewis Hamilton — 6 victories (2008, 2011, 2014, 2015, 2017, 2019)" },
      { label: "Best known for",     value: "The long, sweeping Turn 6-7 complex and the hairpin at Turn 14 — one of the best overtaking spots on the calendar." },
      { label: "Qualifying record",  value: "Max Verstappen — 1:12.930 (2024)" },
      { label: "Race lap record",    value: "Michael Schumacher — 1:32.238 (2004)" },
      { label: "Race distance",      value: "56 laps × 5.451 km = 305.066 km total" },
      { label: "Most recent winner", value: "Max Verstappen (Red Bull) — 2024" },
      { label: "Did you know?",      value: "Shanghai International Circuit was purpose-built for Formula 1 and opened in 2004. Its layout was inspired by the Chinese character 上 (shàng), meaning ‘above’ or ‘upper’." },
    ],
  },
  3: {
    sessions: [
      { name: "Practice 1",     utc: "2026-03-27T02:30:00Z" },
      { name: "Practice 2",     utc: "2026-03-27T06:00:00Z" },
      { name: "Practice 3",     utc: "2026-03-28T02:30:00Z" },
      { name: "Qualifying",     utc: "2026-03-28T06:00:00Z" },
      { name: "Race",           utc: "2026-03-29T05:00:00Z" },
    ],
  },
  4: {
    sessions: [
      { name: "Practice 1",     utc: "2026-04-10T11:30:00Z" },
      { name: "Practice 2",     utc: "2026-04-10T15:00:00Z" },
      { name: "Practice 3",     utc: "2026-04-11T12:30:00Z" },
      { name: "Qualifying",     utc: "2026-04-11T16:00:00Z" },
      { name: "Race",           utc: "2026-04-12T15:00:00Z" },
    ],
  },
  5: {
    sessions: [
      { name: "Practice 1",     utc: "2026-04-17T13:30:00Z" },
      { name: "Practice 2",     utc: "2026-04-17T17:00:00Z" },
      { name: "Practice 3",     utc: "2026-04-18T13:30:00Z" },
      { name: "Qualifying",     utc: "2026-04-18T17:00:00Z" },
      { name: "Race",           utc: "2026-04-19T17:00:00Z" },
    ],
  },
  6: {
    sessions: [
      { name: "Practice 1",     utc: "2026-05-01T16:30:00Z" },
      { name: "Sprint Qualifying",utc: "2026-05-01T20:30:00Z" },
      { name: "Sprint Race",    utc: "2026-05-02T16:00:00Z" },
      { name: "Qualifying",     utc: "2026-05-02T20:00:00Z" },
      { name: "Race",           utc: "2026-05-03T20:00:00Z" },
    ],
  },
  7: {
    sessions: [
      { name: "Practice 1",     utc: "2026-05-22T16:30:00Z" },
      { name: "Sprint Qualifying",utc: "2026-05-22T20:30:00Z" },
      { name: "Sprint Race",    utc: "2026-05-23T16:00:00Z" },
      { name: "Qualifying",     utc: "2026-05-23T20:00:00Z" },
      { name: "Race",           utc: "2026-05-24T20:00:00Z" },
    ],
  },
  8: {
    sessions: [
      { name: "Practice 1",     utc: "2026-06-05T11:30:00Z" },
      { name: "Practice 2",     utc: "2026-06-05T15:00:00Z" },
      { name: "Practice 3",     utc: "2026-06-06T10:30:00Z" },
      { name: "Qualifying",     utc: "2026-06-06T14:00:00Z" },
      { name: "Race",           utc: "2026-06-07T13:00:00Z" },
    ],
  },
  9: {
    sessions: [
      { name: "Practice 1",     utc: "2026-06-12T11:30:00Z" },
      { name: "Practice 2",     utc: "2026-06-12T15:00:00Z" },
      { name: "Practice 3",     utc: "2026-06-13T10:30:00Z" },
      { name: "Qualifying",     utc: "2026-06-13T14:00:00Z" },
      { name: "Race",           utc: "2026-06-14T13:00:00Z" },
    ],
  },
  10: {
    sessions: [
      { name: "Practice 1",     utc: "2026-06-26T11:30:00Z" },
      { name: "Practice 2",     utc: "2026-06-26T15:00:00Z" },
      { name: "Practice 3",     utc: "2026-06-27T10:30:00Z" },
      { name: "Qualifying",     utc: "2026-06-27T14:00:00Z" },
      { name: "Race",           utc: "2026-06-28T13:00:00Z" },
    ],
  },
  11: {
    sessions: [
      { name: "Practice 1",     utc: "2026-07-03T11:30:00Z" },
      { name: "Sprint Qualifying",utc: "2026-07-03T15:30:00Z" },
      { name: "Sprint Race",    utc: "2026-07-04T11:00:00Z" },
      { name: "Qualifying",     utc: "2026-07-04T15:00:00Z" },
      { name: "Race",           utc: "2026-07-05T14:00:00Z" },
    ],
  },
  12: {
    sessions: [
      { name: "Practice 1",     utc: "2026-07-17T11:30:00Z" },
      { name: "Practice 2",     utc: "2026-07-17T15:00:00Z" },
      { name: "Practice 3",     utc: "2026-07-18T10:30:00Z" },
      { name: "Qualifying",     utc: "2026-07-18T14:00:00Z" },
      { name: "Race",           utc: "2026-07-19T13:00:00Z" },
    ],
  },
  13: {
    sessions: [
      { name: "Practice 1",     utc: "2026-07-24T11:30:00Z" },
      { name: "Practice 2",     utc: "2026-07-24T15:00:00Z" },
      { name: "Practice 3",     utc: "2026-07-25T10:30:00Z" },
      { name: "Qualifying",     utc: "2026-07-25T14:00:00Z" },
      { name: "Race",           utc: "2026-07-26T13:00:00Z" },
    ],
  },
  14: {
    sessions: [
      { name: "Practice 1",     utc: "2026-08-21T10:30:00Z" },
      { name: "Sprint Qualifying",utc: "2026-08-21T14:30:00Z" },
      { name: "Sprint Race",    utc: "2026-08-22T10:00:00Z" },
      { name: "Qualifying",     utc: "2026-08-22T14:00:00Z" },
      { name: "Race",           utc: "2026-08-23T13:00:00Z" },
    ],
  },
  15: {
    sessions: [
      { name: "Practice 1",     utc: "2026-09-04T10:30:00Z" },
      { name: "Practice 2",     utc: "2026-09-04T14:00:00Z" },
      { name: "Practice 3",     utc: "2026-09-05T10:30:00Z" },
      { name: "Qualifying",     utc: "2026-09-05T14:00:00Z" },
      { name: "Race",           utc: "2026-09-06T13:00:00Z" },
    ],
  },
  16: {
    sessions: [
      { name: "Practice 1",     utc: "2026-09-11T11:30:00Z" },
      { name: "Practice 2",     utc: "2026-09-11T15:00:00Z" },
      { name: "Practice 3",     utc: "2026-09-12T10:30:00Z" },
      { name: "Qualifying",     utc: "2026-09-12T14:00:00Z" },
      { name: "Race",           utc: "2026-09-13T13:00:00Z" },
    ],
  },
  17: {
    sessions: [
      { name: "Practice 1",     utc: "2026-09-24T08:30:00Z" },
      { name: "Practice 2",     utc: "2026-09-24T12:00:00Z" },
      { name: "Practice 3",     utc: "2026-09-25T08:30:00Z" },
      { name: "Qualifying",     utc: "2026-09-25T12:00:00Z" },
      { name: "Race",           utc: "2026-09-26T11:00:00Z" },
    ],
  },
  18: {
    sessions: [
      { name: "Practice 1",     utc: "2026-10-09T08:30:00Z" },
      { name: "Sprint Qualifying",utc: "2026-10-09T12:30:00Z" },
      { name: "Sprint Race",    utc: "2026-10-10T09:00:00Z" },
      { name: "Qualifying",     utc: "2026-10-10T13:00:00Z" },
      { name: "Race",           utc: "2026-10-11T12:00:00Z" },
    ],
  },
  19: {
    sessions: [
      { name: "Practice 1",     utc: "2026-10-23T17:30:00Z" },
      { name: "Practice 2",     utc: "2026-10-23T21:00:00Z" },
      { name: "Practice 3",     utc: "2026-10-24T17:30:00Z" },
      { name: "Qualifying",     utc: "2026-10-24T21:00:00Z" },
      { name: "Race",           utc: "2026-10-25T20:00:00Z" },
    ],
  },
  20: {
    sessions: [
      { name: "Practice 1",     utc: "2026-10-30T18:30:00Z" },
      { name: "Practice 2",     utc: "2026-10-30T22:00:00Z" },
      { name: "Practice 3",     utc: "2026-10-31T17:30:00Z" },
      { name: "Qualifying",     utc: "2026-10-31T21:00:00Z" },
      { name: "Race",           utc: "2026-11-01T20:00:00Z" },
    ],
  },
  21: {
    sessions: [
      { name: "Practice 1",     utc: "2026-11-06T15:30:00Z" },
      { name: "Practice 2",     utc: "2026-11-06T19:00:00Z" },
      { name: "Practice 3",     utc: "2026-11-07T14:30:00Z" },
      { name: "Qualifying",     utc: "2026-11-07T18:00:00Z" },
      { name: "Race",           utc: "2026-11-08T17:00:00Z" },
    ],
  },
  22: {
    sessions: [
      { name: "Practice 1",     utc: "2026-11-20T00:30:00Z" },
      { name: "Practice 2",     utc: "2026-11-20T04:00:00Z" },
      { name: "Practice 3",     utc: "2026-11-21T00:30:00Z" },
      { name: "Qualifying",     utc: "2026-11-21T04:00:00Z" },
      { name: "Race",           utc: "2026-11-22T04:00:00Z" },
    ],
  },
  23: {
    sessions: [
      { name: "Practice 1",     utc: "2026-11-27T13:30:00Z" },
      { name: "Practice 2",     utc: "2026-11-27T17:00:00Z" },
      { name: "Practice 3",     utc: "2026-11-28T14:30:00Z" },
      { name: "Qualifying",     utc: "2026-11-28T18:00:00Z" },
      { name: "Race",           utc: "2026-11-29T16:00:00Z" },
    ],
  },
  24: {
    sessions: [
      { name: "Practice 1",     utc: "2026-12-04T09:30:00Z" },
      { name: "Practice 2",     utc: "2026-12-04T13:00:00Z" },
      { name: "Practice 3",     utc: "2026-12-05T10:30:00Z" },
      { name: "Qualifying",     utc: "2026-12-05T14:00:00Z" },
      { name: "Race",           utc: "2026-12-06T13:00:00Z" },
    ],
  },
};
