// Contextual messages per page — shown on route change
export const PAGE_MESSAGES: Record<string, string[]> = {
  "/": [
    "Welcome to the pits! 🏁",
    "Home sweet home. Ready to race?",
    "Back at base. Let's check the standings!",
  ],
  "/predictions": [
    "Time to make your picks! Who's taking P1?",
    "Crystal ball time — predict the podium! 🔮",
    "Bold strategy, let's see if it pays off.",
  ],
  "/predictions/race/[round]": [
    "Lock in your prediction before the lights go out!",
    "No pressure, but everyone's watching your pick. 😅",
    "This race could change everything — choose wisely.",
  ],
  "/members": [
    "Check out the competition! 👀",
    "Scouting the enemy paddock, are we?",
    "See how your rivals are lining up.",
  ],
  "/profile": [
    "Time to tweak your setup!",
    "Fine-tuning your driver profile? Smart.",
    "A good mechanic always checks the settings.",
  ],
  "/settings": [
    "Adjusting the car setup? Good call.",
    "Every tenth counts — get your settings right.",
  ],
  "/notifications": [
    "Checking for messages from the pit wall!",
    "Any @mentions from your group? Let's find out.",
  ],
};

// One contextual help string per page
export const PAGE_HELP: Record<string, string> = {
  "/": "Welcome to the pit wall! 🏎️ Tap the track buttons to navigate the app, and use the race schedule to jump straight to any race prediction. The race highlighted in red is up next — don't miss it!",
  "/predictions": "This is your season predictions hub! 🏁 Set your overall season picks at the top, then tap any race to lock in your podium prediction. Picks close the moment the lights go out — get in early!",
  "/predictions/race/[round]": "Pick who you think will finish P1, P2, and P3. You can update your picks right up until the race starts — after that, they're locked in for good. Exact position = 3 pts, podium placement = 1 pt. Choose wisely! 🎯",
  "/members": "Your league's fan cards are all here! 👥 See everyone's favourite teams and drivers, and leave comments on their cards. Use @name in a comment to send someone a direct notification — great for a bit of trash talk. 😄",
  "/profile": "This is your driver profile! Set your display name, then rank your favourite teams and drivers. Your top team pick sets the colour theme across the whole app — so choose your true colours! 🎨",
  "/settings": "Here you can update your display name, toggle push notifications for @mentions, and manage your account. Turn on notifications so you never miss when someone calls you out on the Members page! 🔔",
  "/notifications": "These are your @mention alerts — when someone tags you in a comment on the Members page, it lands here. Tap any notification to jump straight to the conversation. 💬",
};

// F1-themed jokes
export const JOKES: string[] = [
  "Why did the F1 driver get lost? He kept taking the wrong turns! 🔄",
  "What do you call a sleeping F1 mechanic? A pit stopper! 💤",
  "Why don't F1 drivers get lonely? Because they always have a tailgater! 🏎️",
  "I tried to write a book about F1. It had too many turns! 📖",
  "Why did the F1 car stop working? It ran out of drive! ⚙️",
  "What's an F1 driver's favourite subject? Lap-ography! 🗺️",
  "Why do F1 teams hate summer? Too many pit stops at the beach! 🏖️",
  "What did the F1 car say to the corner? I'll be right around! ↩️",
  "Why did the rookie cry at the race? He couldn't handle the pressure! 😅",
];

// Hype messages — support {name}, {team}, {driver} tokens
export const HYPE_MESSAGES: string[] = [
  "Let's go, {name}! {team} fans don't quit! 🔥",
  "{name}, you've got the eyes of a race strategist. Back yourself!",
  "If {driver} can do it on cold tyres, you can nail this prediction! 💪",
  "{team}'s doing great this season — your loyalty will be rewarded! 🏆",
  "{name}, champions make bold calls. Be bold! 🚀",
  "Trust the data, trust your gut, trust yourself, {name}. 📊",
  "{driver} wouldn't second-guess a podium pick — and neither should you!",
];

// Idle messages — shown after 2 min no interaction
export const IDLE_MESSAGES: string[] = [
  "Still here? Just warming up the tyres… 🔥",
  "Pit wall to driver: are you receiving? 📻",
  "I haven't heard from you in a while. Everything okay out there?",
  "The session is live but the driver is quiet… tap me if you need anything!",
  "Box, box, box? No? Okay, I'll keep waiting. 😅",
];

// Random rotation messages — shown every 60 s
export const RANDOM_MESSAGES: string[] = [
  "Did you know? The fastest pit stop in F1 history was 1.80 seconds by Red Bull! ⚡",
  "Fun fact: F1 cars can reach 0–100 mph in about 2.6 seconds. Faster than a blink! 👀",
  "The Monaco circuit hasn't changed much since 1929. Old school is best school. 🏰",
  "F1 tyres lose up to 0.5 kg of rubber per lap at full attack. 😬",
  "A modern F1 car generates enough downforce to drive upside-down on a ceiling at 120 mph. 🙃",
  "The steering wheel alone costs around £50,000. Don't drop it! 💸",
  "F1 drivers can lose up to 3 kg in sweat during a single race. Respect. 💦",
  "Have you checked the latest race predictions from your group? Might be time to scout the competition! 👀",
];

// 2026 season facts — regulations, drivers, tracks
export const SEASON_FACTS: string[] = [
  // Regulations
  "2026 brings the biggest technical overhaul in a decade — cars are smaller, lighter, and produce around 30% less downforce. Expect closer racing! 🏎️",
  "The MGU-H is gone in 2026! The complex heat recovery system is scrapped in favour of a much more powerful MGU-K. Simpler, louder, faster. 🔊",
  "F1 is half-electric in 2026 — power units produce roughly a 50/50 split between combustion and electric power. The sport has never been this electrified! ⚡",
  "Active aero is back! For the first time since the early 2010s, drivers can manually adjust their bodywork — low drag on straights, high downforce in corners. 🪽",
  "2026 cars are designed to follow each other more closely, with cleaner aerodynamic wakes. The goal? More overtakes, less 'dirty air' frustration. 🌬️",
  // New manufacturers
  "Audi officially enters F1 in 2026 — the first German manufacturer since BMW departed in 2009. They've taken over the Sauber entry to do it. 🇩🇪",
  "Ford is back in Formula 1 as a power unit partner with Red Bull and RB — their first serious F1 involvement in over 20 years. The Blue Oval returns! 🇺🇸",
  "Honda is partnering with Aston Martin in 2026 for a full works relationship — their biggest F1 commitment since leaving McLaren after the 2021 season. 🍀",
  "General Motors enters F1 in 2026 through the Andretti team — the first American constructor on the grid in decades. Stars and stripes on the starting grid! 🇺🇸",
  // Rookie drivers
  "Arvid Lindblad is one of the most hyped rookies in years — the British-Swedish prodigy dominated junior categories and is considered by many scouts as a generational talent. Watch this space. 🌟",
  "Oliver Bearman became one of the youngest ever points scorers when he stepped in for Ferrari at just 18 in 2024. Now he's a full-time F1 driver — and he's only just getting started. 💪",
  "Kimi Antonelli stepped into Lewis Hamilton's seat at Mercedes — one of the most high-pressure rookie debuts in F1 history. No pressure, kid! 😅",
  "Isack Hadjar is another rookie to watch — the French-Algerian driver starred in Formula 2 and joins a team with serious ambitions for 2026. 🇫🇷",
  // Tracks
  "The Las Vegas Strip Circuit is one of the fastest on the 2026 calendar — cars hit over 210 mph on the main straight past the hotels and casinos. Only in Vegas! 🎰",
  "The Miami International Autodrome is built around Hard Rock Stadium — home of the Miami Dolphins NFL team. F1 quite literally surrounds an American football stadium. 🏈",
  "The São Paulo GP at Interlagos has been on the F1 calendar since 1973 — one of the most beloved circuits in the world, famous for dramatic weather and even more dramatic racing. ⛈️",
  "The Circuit de Monaco hasn't changed significantly since 1929. F1 cars in 2026 are the most advanced machines ever built — racing on a layout older than most grandparents. 🏰",
  "The Jeddah Corniche Circuit is the second longest lap on the calendar and one of the fastest street circuits ever built. Average speeds above 155 mph — on a street circuit! 🇸🇦",
  "Spa-Francorchamps has one of the most iconic corners in motorsport — Eau Rouge/Raidillon. Drivers take it nearly flat out in modern F1 cars. Absolutely wild. 🌧️",
  "The Circuit Gilles Villeneuve in Montreal is built on an artificial island in the St. Lawrence River. The hairpin at the end of the pit straight is nicknamed the 'Wall of Champions' — it's claimed some very famous victims. 🍁",
  "Suzuka is one of the most technically demanding circuits on the calendar — and it's owned by Honda. The figure-of-eight layout with its sweeping S-curves is considered a true driver's circuit. 🇯🇵",
  "Monza is known as the 'Temple of Speed' — the oldest circuit still in active use, and consistently the fastest race on the calendar. Average race speeds above 160 mph. 🏛️",
  "The Hungaroring is nicknamed the 'Monaco of Hungary' — a tight, twisty circuit with almost no overtaking spots. Strategy and qualifying position are everything there. 🇭🇺",
  "Zandvoort was absent from the F1 calendar for 35 years before returning in 2021. The Dutch crowd for Max Verstappen is unlike anything else in F1 — the place turns completely orange. 🧡",
  "The Baku City Circuit has the longest straight in Formula 1 — over 2 km along the Azerbaijani coastline. Top speeds there regularly exceed 220 mph. 🇦🇿",
  "Singapore's Marina Bay Circuit is one of the few true night races in F1. Over 1,500 lights illuminate the track — the race runs under what feels like permanent floodlight. 🌃",
  "The Mexican GP at Autodromo Hermanos Rodriguez sits at 2,285 metres above sea level — the altitude affects engine performance and tyre behaviour in ways teams have to carefully manage. 🇲🇽",
  "Silverstone hosted the very first Formula 1 World Championship race in 1950. It's the birthplace of the modern F1 era — and still one of the best circuits on the calendar. 🇬🇧",
  // More drivers
  "Lewis Hamilton moved to Ferrari for 2025 — one of the most seismic driver moves in the sport's history. The 7-time champion swapped the team he dominated with for F1's most iconic brand. 🔴",
  "Fernando Alonso made his F1 debut in 2001. He's still racing in 2026 — that's a career spanning a quarter of a century. Absolute iron man. 🇪🇸",
  "Max Verstappen set the record for most wins in a single season — 19 victories in 2023. A record that may stand for a very long time. 👑",
  "Lando Norris scored his first F1 race win at Miami in 2024, ending years of near-misses. McLaren's resurgence and Lando's evolution into a title contender was one of the stories of the era. 🍋",
  "Oscar Piastri went from Formula 2 champion to F1 race winner within two seasons. The quiet Australian is widely regarded as one of the most complete young drivers in the paddock. 🦘",
  "Arvid Lindblad is considered by many scouts and team principals to have the kind of raw pace that comes along once in a generation. Some comparisons to a young Max Verstappen have already been made — no pressure! ⭐",
  // More regulation/technical
  "2026 cars target a weight of around 768 kg — significantly lighter than recent generations. Less mass means more agile cars and harder braking zones. 🪶",
  "The 2026 power unit regulations were specifically designed to attract new manufacturers — and it worked. Audi, Ford, Honda, and GM all committed. That hasn't happened in F1 for decades. 🏭",
  "F1 switched to 100% sustainable fuels in 2026 — every drop of fuel burned at a Grand Prix this season is carbon-neutral. The sport is serious about its environmental goals. 🌱",
  "The 2026 cars use a 'manual override' system for the active aerodynamics — drivers press a button to switch between high-downforce and low-drag modes. It's a new tactical layer for overtaking. 🕹️",
  "With the 2026 regulation reset, every team starts from a cleaner slate than usual. New regs have historically reshuffled the order dramatically — expect the unexpected this season! 🎲",
  // Team facts
  "McLaren won the Constructors' Championship in 2024 — their first since 1998. A 26-year wait finally ended. The Woking team's rebuild is one of F1's great comeback stories. 🧡",
  "Ferrari's last Constructors' Championship was in 2008. The Scuderia have the most wins and championships in F1 history — but the wait for another title has been long and painful. 🐴",
  "Williams holds the record for most Constructors' Championships by a private (non-manufacturer) team — seven titles, all between 1980 and 1997. A legendary era. 💙",
  "Red Bull Racing only entered F1 in 2005 — and have already won six Constructors' Championships. One of the fastest rises in the sport's history. 🐂",
  "The Haas F1 team is the only American constructor currently on the grid — founded in 2016 and based in Kannapolis, North Carolina. Gene Haas brought F1 back to the USA. 🇺🇸",
];

// One-time strings
export const INTRO_STEP_1 =
  "Hey! I'm your pit crew companion. 🏎️ Before we hit the track — what should I call you?";

export function INTRO_STEP_2(name: string): string {
  return `Nice to meet you, ${name}! I'll follow you around the app, drop hints, crack jokes, and keep you hyped. Ready to race? 🏁`;
}

export const FIRST_DISMISS_MESSAGE =
  "I'll wait for you at home! 🏠 Tap the 🏎️ on the home page to bring me back.";

export const WAKE_UP_MESSAGE =
  "Welcome home! 🏁 Tap me to bring me back to full speed!";

// Helpers
export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function resolvePageKey(pathname: string): string {
  // Normalise dynamic segments
  if (/^\/predictions\/race\/\d+/.test(pathname)) {
    return "/predictions/race/[round]";
  }
  // Strip trailing slash
  const clean = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  return clean;
}

export function replaceTokens(
  msg: string,
  p: { displayName?: string | null; favTeam?: string | null; favDriver?: string | null }
): string {
  return msg
    .replace(/\{name\}/g, p.displayName ?? "Champion")
    .replace(/\{team\}/g, p.favTeam ?? "your team")
    .replace(/\{driver\}/g, p.favDriver ?? "your driver");
}
