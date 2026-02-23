import type { Driver, Constructor, Category } from "./types";

export const DRIVERS: Driver[] = [
  { id: "max-verstappen", name: "Max Verstappen", team: "Red Bull" },
  { id: "liam-lawson", name: "Liam Lawson", team: "Red Bull" },
  { id: "lewis-hamilton", name: "Lewis Hamilton", team: "Ferrari" },
  { id: "charles-leclerc", name: "Charles Leclerc", team: "Ferrari" },
  { id: "george-russell", name: "George Russell", team: "Mercedes" },
  { id: "kimi-antonelli", name: "Kimi Antonelli", team: "Mercedes" },
  { id: "lando-norris", name: "Lando Norris", team: "McLaren" },
  { id: "oscar-piastri", name: "Oscar Piastri", team: "McLaren" },
  { id: "fernando-alonso", name: "Fernando Alonso", team: "Aston Martin" },
  { id: "lance-stroll", name: "Lance Stroll", team: "Aston Martin" },
  { id: "pierre-gasly", name: "Pierre Gasly", team: "Alpine" },
  { id: "jack-doohan", name: "Jack Doohan", team: "Alpine" },
  { id: "carlos-sainz", name: "Carlos Sainz", team: "Williams" },
  { id: "alexander-albon", name: "Alexander Albon", team: "Williams" },
  { id: "nico-hulkenberg", name: "Nico Hülkenberg", team: "Sauber" },
  { id: "gabriel-bortoleto", name: "Gabriel Bortoleto", team: "Sauber" },
  { id: "yuki-tsunoda", name: "Yuki Tsunoda", team: "Racing Bulls" },
  { id: "isack-hadjar", name: "Isack Hadjar", team: "Racing Bulls" },
  { id: "oliver-bearman", name: "Oliver Bearman", team: "Haas" },
  { id: "esteban-ocon", name: "Esteban Ocon", team: "Haas" },
  { id: "valtteri-bottas", name: "Valtteri Bottas", team: "Cadillac" },
  { id: "sergio-perez", name: "Sergio Pérez", team: "Cadillac" },
];

export const CONSTRUCTORS: Constructor[] = [
  { id: "red-bull", name: "Red Bull" },
  { id: "ferrari", name: "Ferrari" },
  { id: "mercedes", name: "Mercedes" },
  { id: "mclaren", name: "McLaren" },
  { id: "aston-martin", name: "Aston Martin" },
  { id: "alpine", name: "Alpine" },
  { id: "williams", name: "Williams" },
  { id: "sauber", name: "Sauber" },
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
  sprint: boolean;
}

export const RACES: Race[] = [
  { r:  1, name: "Australian Grand Prix",          circuit: "Albert Park Circuit",             flag: "🇦🇺", date: "2026-03-08", sprint: false },
  { r:  2, name: "Chinese Grand Prix",              circuit: "Shanghai International Circuit",  flag: "🇨🇳", date: "2026-03-15", sprint: true  },
  { r:  3, name: "Japanese Grand Prix",             circuit: "Suzuka Circuit",                  flag: "🇯🇵", date: "2026-03-29", sprint: false },
  { r:  4, name: "Bahrain Grand Prix",              circuit: "Bahrain International Circuit",   flag: "🇧🇭", date: "2026-04-12", sprint: false },
  { r:  5, name: "Saudi Arabian Grand Prix",        circuit: "Jeddah Corniche Circuit",         flag: "🇸🇦", date: "2026-04-19", sprint: false },
  { r:  6, name: "Miami Grand Prix",                circuit: "Miami International Autodrome",   flag: "🇺🇸", date: "2026-05-03", sprint: true  },
  { r:  7, name: "Canadian Grand Prix",             circuit: "Circuit Gilles Villeneuve",       flag: "🇨🇦", date: "2026-05-24", sprint: true  },
  { r:  8, name: "Monaco Grand Prix",               circuit: "Circuit de Monaco",               flag: "🇲🇨", date: "2026-06-07", sprint: false },
  { r:  9, name: "Barcelona-Catalunya Grand Prix",  circuit: "Circuit de Barcelona-Catalunya",  flag: "🇪🇸", date: "2026-06-14", sprint: false },
  { r: 10, name: "Austrian Grand Prix",             circuit: "Red Bull Ring",                   flag: "🇦🇹", date: "2026-06-28", sprint: false },
  { r: 11, name: "British Grand Prix",              circuit: "Silverstone Circuit",             flag: "🇬🇧", date: "2026-07-05", sprint: true  },
  { r: 12, name: "Belgian Grand Prix",              circuit: "Circuit de Spa-Francorchamps",    flag: "🇧🇪", date: "2026-07-19", sprint: false },
  { r: 13, name: "Hungarian Grand Prix",            circuit: "Hungaroring",                     flag: "🇭🇺", date: "2026-07-26", sprint: false },
  { r: 14, name: "Dutch Grand Prix",               circuit: "Circuit Zandvoort",               flag: "🇳🇱", date: "2026-08-23", sprint: true  },
  { r: 15, name: "Italian Grand Prix",              circuit: "Autodromo Nazionale Monza",       flag: "🇮🇹", date: "2026-09-06", sprint: false },
  { r: 16, name: "Spanish Grand Prix",              circuit: "Madring, Madrid",                 flag: "🇪🇸", date: "2026-09-13", sprint: false },
  { r: 17, name: "Azerbaijan Grand Prix",           circuit: "Baku City Circuit",               flag: "🇦🇿", date: "2026-09-27", sprint: false },
  { r: 18, name: "Singapore Grand Prix",            circuit: "Marina Bay Street Circuit",       flag: "🇸🇬", date: "2026-10-11", sprint: true  },
  { r: 19, name: "United States Grand Prix",        circuit: "Circuit of the Americas",         flag: "🇺🇸", date: "2026-10-25", sprint: false },
  { r: 20, name: "Mexico City Grand Prix",          circuit: "Autódromo Hermanos Rodríguez",    flag: "🇲🇽", date: "2026-11-01", sprint: false },
  { r: 21, name: "Brazilian Grand Prix",            circuit: "Autódromo José Carlos Pace",      flag: "🇧🇷", date: "2026-11-08", sprint: false },
  { r: 22, name: "Las Vegas Grand Prix",            circuit: "Las Vegas Strip Circuit",         flag: "🇺🇸", date: "2026-11-21", sprint: false },
  { r: 23, name: "Qatar Grand Prix",                circuit: "Lusail International Circuit",    flag: "🇶🇦", date: "2026-11-29", sprint: false },
  { r: 24, name: "Abu Dhabi Grand Prix",            circuit: "Yas Marina Circuit",              flag: "🇦🇪", date: "2026-12-06", sprint: false },
];

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
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
