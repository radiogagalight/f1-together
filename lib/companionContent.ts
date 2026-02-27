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
  "/": "From here you can navigate to Predictions, Members, Profile, and Settings via the bottom bar.",
  "/predictions": "Pick your podium for each race. Tap a race to open it and lock in your prediction before it starts.",
  "/predictions/race/[round]": "Choose P1, P2, and P3. You can change your picks until the race begins.",
  "/members": "See everyone in your group and their favourite teams and drivers.",
  "/profile": "Set your display name, favourite teams, and favourite drivers here.",
  "/settings": "Manage your account, notifications, and display preferences.",
  "/notifications": "All your @mention alerts live here. Tap one to jump to the comment.",
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
