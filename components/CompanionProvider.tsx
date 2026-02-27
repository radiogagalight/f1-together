"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  PAGE_MESSAGES,
  PAGE_HELP,
  JOKES,
  HYPE_MESSAGES,
  IDLE_MESSAGES,
  RANDOM_MESSAGES,
  INTRO_STEP_1,
  INTRO_STEP_2,
  FIRST_DISMISS_MESSAGE,
  WAKE_UP_MESSAGE,
  pickRandom,
  resolvePageKey,
  replaceTokens,
} from "@/lib/companionContent";

export type CompanionPhase =
  | "hidden"
  | "intro-step-1"
  | "intro-step-2"
  | "active"
  | "dismissed"
  | "waiting-home";

interface CompanionContextValue {
  phase: CompanionPhase;
  message: string;
  showBubble: boolean;
  showMenu: boolean;
  introNameInput: string;
  setIntroNameInput: (v: string) => void;
  confirmIntroName: () => void;
  confirmIntroStep2: () => void;
  openMenu: () => void;
  closeMenu: () => void;
  handleMenuAction: (action: "help" | "joke" | "hype" | "scoring" | "dismiss") => void;
  dismiss: () => void;
  wakeUp: () => void;
}

const CompanionContext = createContext<CompanionContextValue>({
  phase: "hidden",
  message: "",
  showBubble: false,
  showMenu: false,
  introNameInput: "",
  setIntroNameInput: () => {},
  confirmIntroName: () => {},
  confirmIntroStep2: () => {},
  openMenu: () => {},
  closeMenu: () => {},
  handleMenuAction: () => {},
  dismiss: () => {},
  wakeUp: () => {},
});

export function useCompanion() {
  return useContext(CompanionContext);
}

export function CompanionProvider({ children }: { children: React.ReactNode }) {
  const {
    user,
    authReady,
    displayName,
    favTeams,
    favDrivers,
    companionDismissed,
    companionIntroDone,
    companionFirstDismissSeen,
    updateCompanion,
  } = useAuth();

  const pathname = usePathname();

  const [phase, setPhase] = useState<CompanionPhase>("hidden");
  const [message, setMessage] = useState("");
  const [showBubble, setShowBubble] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [introNameInput, setIntroNameInput] = useState("");
  const [lastInteraction, setLastInteraction] = useState(Date.now());

  const bubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether we've done the initial phase setup for the current user.
  // Prevents re-running the init logic on every pathname change.
  const initializedForUser = useRef<string | null>(null);

  // Show a message with auto-dismiss
  const showMessage = useCallback((msg: string, durationMs = 8000) => {
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    setMessage(msg);
    setShowBubble(true);
    bubbleTimeoutRef.current = setTimeout(() => {
      setShowBubble(false);
    }, durationMs);
  }, []);

  // Bump last interaction timestamp
  const bumpInteraction = useCallback(() => {
    setLastInteraction(Date.now());
  }, []);

  // ── Initialization ────────────────────────────────────────────────────────
  // Runs whenever auth state or pathname changes. Uses a ref to ensure the
  // phase setup only happens once per user session (subsequent pathname changes
  // are handled by the effects below). pathname is in deps so the effect
  // retries if auth resolved while still on an /auth/ page.
  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setPhase("hidden");
      initializedForUser.current = null;
      return;
    }

    // Wait until the user is on a real page before initialising
    if (pathname?.startsWith("/auth/")) return;

    // Already set up for this user — let other effects handle phase changes
    if (initializedForUser.current === user.id) return;
    initializedForUser.current = user.id;

    if (!companionIntroDone) {
      setPhase("intro-step-1");
      setMessage(INTRO_STEP_1);
      setShowBubble(true);
      return;
    }

    if (companionDismissed) {
      if (pathname === "/") {
        setPhase("waiting-home");
        showMessage(WAKE_UP_MESSAGE, 10000);
      } else {
        setPhase("dismissed");
      }
      return;
    }

    setPhase("active");
  }, [authReady, user, pathname, companionIntroDone, companionDismissed, showMessage]);

  // ── Page-change messages (active only) ───────────────────────────────────
  useEffect(() => {
    if (phase !== "active") return;
    if (pathname.startsWith("/auth/")) {
      setPhase("hidden");
      return;
    }

    if (pageMessageTimeoutRef.current) clearTimeout(pageMessageTimeoutRef.current);
    pageMessageTimeoutRef.current = setTimeout(() => {
      const key = resolvePageKey(pathname);
      const msgs = PAGE_MESSAGES[key];
      if (msgs?.length) showMessage(pickRandom(msgs));
    }, 1000);

    return () => {
      if (pageMessageTimeoutRef.current) clearTimeout(pageMessageTimeoutRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, phase]);

  // ── Dismissed ↔ waiting-home ─────────────────────────────────────────────
  useEffect(() => {
    if (phase === "dismissed" && pathname === "/") {
      setPhase("waiting-home");
      showMessage(WAKE_UP_MESSAGE, 10000);
    } else if (phase === "waiting-home" && pathname !== "/") {
      setPhase("dismissed");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, phase]);

  // ── Idle + random timers ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "active") return;

    const idleInterval = setInterval(() => {
      if (Date.now() - lastInteraction > 120_000) {
        showMessage(pickRandom(IDLE_MESSAGES), 10000);
      }
    }, 10_000);

    const randomInterval = setInterval(() => {
      if (!showMenu) {
        showMessage(pickRandom(RANDOM_MESSAGES), 8000);
      }
    }, 60_000);

    return () => {
      clearInterval(idleInterval);
      clearInterval(randomInterval);
    };
  }, [phase, lastInteraction, showMenu, showMessage]);

  // ── CustomEvent listener ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "active") return;

    function handleCustom(e: Event) {
      const msg = (e as CustomEvent<string>).detail;
      if (msg) showMessage(msg, 10000);
    }
    window.addEventListener("companion-message", handleCustom);
    return () => window.removeEventListener("companion-message", handleCustom);
  }, [phase, showMessage]);

  // ── Intro actions ─────────────────────────────────────────────────────────
  const confirmIntroName = useCallback(async () => {
    const name = introNameInput.trim() || "Champion";
    await updateCompanion({ companion_name_pref: name });
    setPhase("intro-step-2");
    setMessage(INTRO_STEP_2(name));
    setShowBubble(true);
  }, [introNameInput, updateCompanion]);

  const confirmIntroStep2 = useCallback(async () => {
    await updateCompanion({ companion_intro_done: true });
    setPhase("active");
    setShowBubble(false);
    bumpInteraction();
  }, [updateCompanion, bumpInteraction]);

  // ── Menu actions ──────────────────────────────────────────────────────────
  const openMenu = useCallback(() => {
    setShowMenu(true);
    setShowBubble(false);
    bumpInteraction();
  }, [bumpInteraction]);

  const closeMenu = useCallback(() => {
    setShowMenu(false);
  }, []);

  const handleMenuAction = useCallback(
    (action: "help" | "joke" | "hype" | "scoring" | "dismiss") => {
      setShowMenu(false);
      bumpInteraction();

      if (action === "help") {
        const key = resolvePageKey(pathname);
        const help = PAGE_HELP[key] ?? "Navigate using the bottom bar!";
        showMessage(help, 12000);
      } else if (action === "joke") {
        showMessage(pickRandom(JOKES), 10000);
      } else if (action === "hype") {
        const msg = replaceTokens(pickRandom(HYPE_MESSAGES), {
          displayName,
          favTeam: favTeams[0],
          favDriver: favDrivers[0],
        });
        showMessage(msg, 10000);
      } else if (action === "scoring") {
        showMessage(
          "Scoring: 3 pts for exact position, 1 pt for podium placement, 0 pts otherwise. Most points at season end wins! 🏆",
          14000
        );
      } else if (action === "dismiss") {
        dismiss();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname, displayName, favTeams, favDrivers, bumpInteraction, showMessage]
  );

  // ── Dismiss / wake up ─────────────────────────────────────────────────────
  const dismiss = useCallback(async () => {
    if (!companionFirstDismissSeen) {
      showMessage(FIRST_DISMISS_MESSAGE, 4000);
      await updateCompanion({ companion_first_dismiss_seen: true });
      setTimeout(async () => {
        setPhase("dismissed");
        await updateCompanion({ companion_dismissed: true });
      }, 4200);
    } else {
      setPhase("dismissed");
      await updateCompanion({ companion_dismissed: true });
    }
  }, [companionFirstDismissSeen, showMessage, updateCompanion]);

  const wakeUp = useCallback(async () => {
    setPhase("active");
    await updateCompanion({ companion_dismissed: false });
    showMessage("I'm back! Let's do this! 🏎️", 6000);
    bumpInteraction();
  }, [updateCompanion, showMessage, bumpInteraction]);

  return (
    <CompanionContext.Provider
      value={{
        phase,
        message,
        showBubble,
        showMenu,
        introNameInput,
        setIntroNameInput,
        confirmIntroName,
        confirmIntroStep2,
        openMenu,
        closeMenu,
        handleMenuAction,
        dismiss,
        wakeUp,
      }}
    >
      {children}
    </CompanionContext.Provider>
  );
}
