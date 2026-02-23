import type { Driver, Constructor, Category } from "./types";

export const DRIVERS: Driver[] = [
  { id: "max-verstappen",    name: "Max Verstappen",    team: "Red Bull"      },
  { id: "isack-hadjar",      name: "Isack Hadjar",      team: "Red Bull"      },
  { id: "lewis-hamilton",    name: "Lewis Hamilton",    team: "Ferrari"       },
  { id: "charles-leclerc",   name: "Charles Leclerc",   team: "Ferrari"       },
  { id: "george-russell",    name: "George Russell",    team: "Mercedes"      },
  { id: "kimi-antonelli",    name: "Kimi Antonelli",    team: "Mercedes"      },
  { id: "lando-norris",      name: "Lando Norris",      team: "McLaren"       },
  { id: "oscar-piastri",     name: "Oscar Piastri",     team: "McLaren"       },
  { id: "fernando-alonso",   name: "Fernando Alonso",   team: "Aston Martin"  },
  { id: "lance-stroll",      name: "Lance Stroll",      team: "Aston Martin"  },
  { id: "pierre-gasly",      name: "Pierre Gasly",      team: "Alpine"        },
  { id: "franco-colapinto",  name: "Franco Colapinto",  team: "Alpine"        },
  { id: "carlos-sainz",      name: "Carlos Sainz",      team: "Williams"      },
  { id: "alexander-albon",   name: "Alexander Albon",   team: "Williams"      },
  { id: "nico-hulkenberg",   name: "Nico Hülkenberg",   team: "Audi"          },
  { id: "gabriel-bortoleto", name: "Gabriel Bortoleto", team: "Audi"          },
  { id: "liam-lawson",       name: "Liam Lawson",       team: "Racing Bulls"  },
  { id: "arvid-lindblad",    name: "Arvid Lindblad",    team: "Racing Bulls"  },
  { id: "oliver-bearman",    name: "Oliver Bearman",    team: "Haas"          },
  { id: "esteban-ocon",      name: "Esteban Ocon",      team: "Haas"          },
  { id: "valtteri-bottas",   name: "Valtteri Bottas",   team: "Cadillac"      },
  { id: "sergio-perez",      name: "Sergio Pérez",      team: "Cadillac"      },
];

export const CONSTRUCTORS: Constructor[] = [
  { id: "red-bull", name: "Red Bull" },
  { id: "ferrari", name: "Ferrari" },
  { id: "mercedes", name: "Mercedes" },
  { id: "mclaren", name: "McLaren" },
  { id: "aston-martin", name: "Aston Martin" },
  { id: "alpine", name: "Alpine" },
  { id: "williams", name: "Williams" },
  { id: "audi", name: "Audi" },
  { id: "racing-bulls", name: "Racing Bulls" },
  { id: "haas", name: "Haas" },
  { id: "cadillac", name: "Cadillac" },
];

export interface Race {
  r: number;
  name: string;
  circuit: string;
  flag: string;
  date: string;
  /** Approximate UTC race start time. Used for timezone-aware date display. */
  startUtc: string;
  /** UTC start of FP1 — enables the race weekend countdown card when present. */
  weekendStartUtc?: string;
  sprint: boolean;
}

// startUtc: approximate UTC race start time (based on historical patterns per circuit).
// Used only for timezone-aware date display — the date field remains the circuit-local date.
export const RACES: Race[] = [
  { r:  1, name: "Australian Grand Prix",          circuit: "Albert Park Circuit",             flag: "🇦🇺", date: "2026-03-08", startUtc: "2026-03-08T04:00:00Z", weekendStartUtc: "2026-03-06T01:30:00Z", sprint: false },
  { r:  2, name: "Chinese Grand Prix",              circuit: "Shanghai International Circuit",  flag: "🇨🇳", date: "2026-03-15", startUtc: "2026-03-15T07:00:00Z", weekendStartUtc: "2026-03-13T03:30:00Z", sprint: true  },
  { r:  3, name: "Japanese Grand Prix",             circuit: "Suzuka Circuit",                  flag: "🇯🇵", date: "2026-03-29", startUtc: "2026-03-29T05:00:00Z", sprint: false },
  { r:  4, name: "Bahrain Grand Prix",              circuit: "Bahrain International Circuit",   flag: "🇧🇭", date: "2026-04-12", startUtc: "2026-04-12T15:00:00Z", sprint: false },
  { r:  5, name: "Saudi Arabian Grand Prix",        circuit: "Jeddah Corniche Circuit",         flag: "🇸🇦", date: "2026-04-19", startUtc: "2026-04-19T17:00:00Z", sprint: false },
  { r:  6, name: "Miami Grand Prix",                circuit: "Miami International Autodrome",   flag: "🇺🇸", date: "2026-05-03", startUtc: "2026-05-03T20:00:00Z", sprint: true  },
  { r:  7, name: "Canadian Grand Prix",             circuit: "Circuit Gilles Villeneuve",       flag: "🇨🇦", date: "2026-05-24", startUtc: "2026-05-24T18:00:00Z", sprint: true  },
  { r:  8, name: "Monaco Grand Prix",               circuit: "Circuit de Monaco",               flag: "🇲🇨", date: "2026-06-07", startUtc: "2026-06-07T13:00:00Z", sprint: false },
  { r:  9, name: "Barcelona-Catalunya Grand Prix",  circuit: "Circuit de Barcelona-Catalunya",  flag: "🇪🇸", date: "2026-06-14", startUtc: "2026-06-14T13:00:00Z", sprint: false },
  { r: 10, name: "Austrian Grand Prix",             circuit: "Red Bull Ring",                   flag: "🇦🇹", date: "2026-06-28", startUtc: "2026-06-28T13:00:00Z", sprint: false },
  { r: 11, name: "British Grand Prix",              circuit: "Silverstone Circuit",             flag: "🇬🇧", date: "2026-07-05", startUtc: "2026-07-05T14:00:00Z", sprint: true  },
  { r: 12, name: "Belgian Grand Prix",              circuit: "Circuit de Spa-Francorchamps",    flag: "🇧🇪", date: "2026-07-19", startUtc: "2026-07-19T13:00:00Z", sprint: false },
  { r: 13, name: "Hungarian Grand Prix",            circuit: "Hungaroring",                     flag: "🇭🇺", date: "2026-07-26", startUtc: "2026-07-26T13:00:00Z", sprint: false },
  { r: 14, name: "Dutch Grand Prix",                circuit: "Circuit Zandvoort",               flag: "🇳🇱", date: "2026-08-23", startUtc: "2026-08-23T13:00:00Z", sprint: true  },
  { r: 15, name: "Italian Grand Prix",              circuit: "Autodromo Nazionale Monza",       flag: "🇮🇹", date: "2026-09-06", startUtc: "2026-09-06T13:00:00Z", sprint: false },
  { r: 16, name: "Spanish Grand Prix",              circuit: "Madring, Madrid",                 flag: "🇪🇸", date: "2026-09-13", startUtc: "2026-09-13T13:00:00Z", sprint: false },
  { r: 17, name: "Azerbaijan Grand Prix",           circuit: "Baku City Circuit",               flag: "🇦🇿", date: "2026-09-27", startUtc: "2026-09-27T11:00:00Z", sprint: false },
  { r: 18, name: "Singapore Grand Prix",            circuit: "Marina Bay Street Circuit",       flag: "🇸🇬", date: "2026-10-11", startUtc: "2026-10-11T12:00:00Z", sprint: true  },
  { r: 19, name: "United States Grand Prix",        circuit: "Circuit of the Americas",         flag: "🇺🇸", date: "2026-10-25", startUtc: "2026-10-25T19:00:00Z", sprint: false },
  { r: 20, name: "Mexico City Grand Prix",          circuit: "Autódromo Hermanos Rodríguez",    flag: "🇲🇽", date: "2026-11-01", startUtc: "2026-11-01T20:00:00Z", sprint: false },
  { r: 21, name: "Brazilian Grand Prix",            circuit: "Autódromo José Carlos Pace",      flag: "🇧🇷", date: "2026-11-08", startUtc: "2026-11-08T17:00:00Z", sprint: false },
  { r: 22, name: "Las Vegas Grand Prix",            circuit: "Las Vegas Strip Circuit",         flag: "🇺🇸", date: "2026-11-21", startUtc: "2026-11-22T06:00:00Z", sprint: false },
  { r: 23, name: "Qatar Grand Prix",                circuit: "Lusail International Circuit",    flag: "🇶🇦", date: "2026-11-29", startUtc: "2026-11-29T16:00:00Z", sprint: false },
  { r: 24, name: "Abu Dhabi Grand Prix",            circuit: "Yas Marina Circuit",              flag: "🇦🇪", date: "2026-12-06", startUtc: "2026-12-06T13:00:00Z", sprint: false },
];

/** Converts a flag emoji (e.g. 🇦🇺) to a lowercase ISO country code (e.g. "au") */
export function flagToCC(flag: string): string {
  return [...flag]
    .map((c) => String.fromCharCode((c.codePointAt(0) ?? 0) - 0x1f1e6 + 65))
    .join("")
    .toLowerCase();
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * Format a race date adjusted to the user's UTC offset.
 * offsetHours: integer, e.g. -5 for UTC-5, +11 for UTC+11.
 */
export function formatRaceDate(race: Race, offsetHours: number = 0): string {
  const utc = new Date(race.startUtc);
  const local = new Date(utc.getTime() + offsetHours * 3_600_000);
  return local.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export const CATEGORIES: Category[] = [
  {
    key: "wdcWinner",
    label: "World Drivers' Champion",
    description: "Who wins the 2026 WDC?",
    type: "driver",
  },
  {
    key: "wccWinner",
    label: "World Constructors' Champion",
    description: "Which team wins the 2026 WCC?",
    type: "constructor",
  },
  {
    key: "mostWins",
    label: "Most Race Wins",
    description: "Which driver wins the most races?",
    type: "driver",
  },
  {
    key: "mostPoles",
    label: "Most Pole Positions",
    description: "Which driver takes the most poles?",
    type: "driver",
  },
  {
    key: "mostPodiums",
    label: "Most Podiums",
    description: "Which driver finishes on the podium most?",
    type: "driver",
  },
  {
    key: "firstDnfDriver",
    label: "First DNF — Driver",
    description: "Which driver gets the first DNF of the season?",
    type: "driver",
  },
  {
    key: "firstDnfConstructor",
    label: "First DNF — Constructor",
    description: "Which team has the first DNF of the season?",
    type: "constructor",
  },
];
