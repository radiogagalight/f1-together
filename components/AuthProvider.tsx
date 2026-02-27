"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { TEAM_COLORS } from "@/lib/teamColors";

export interface CompanionProfile {
  companion_name_pref?: string | null;
  companion_dismissed?: boolean;
  companion_intro_done?: boolean;
  companion_first_dismiss_seen?: boolean;
}

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  signOut: () => Promise<void>;
  displayName: string | null;
  favTeams: [string | null, string | null, string | null];
  favDrivers: [string | null, string | null, string | null];
  teamAccent: string;
  timezoneOffset: number;
  refreshFavorites: () => Promise<void>;
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  companionNamePref: string | null;
  companionDismissed: boolean;
  companionIntroDone: boolean;
  companionFirstDismissSeen: boolean;
  updateCompanion: (patch: CompanionProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  authReady: false,
  signOut: async () => {},
  displayName: null,
  favTeams: [null, null, null],
  favDrivers: [null, null, null],
  teamAccent: "#e10600",
  timezoneOffset: 0,
  refreshFavorites: async () => {},
  unreadCount: 0,
  refreshNotifications: async () => {},
  companionNamePref: null,
  companionDismissed: false,
  companionIntroDone: false,
  companionFirstDismissSeen: false,
  updateCompanion: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [favTeams, setFavTeams] = useState<[string | null, string | null, string | null]>([null, null, null]);
  const [favDrivers, setFavDrivers] = useState<[string | null, string | null, string | null]>([null, null, null]);
  const [teamAccent, setTeamAccent] = useState("#e10600");
  const [timezoneOffset, setTimezoneOffset] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [companionNamePref, setCompanionNamePref] = useState<string | null>(null);
  const [companionDismissed, setCompanionDismissed] = useState(false);
  const [companionIntroDone, setCompanionIntroDone] = useState(false);
  const [companionFirstDismissSeen, setCompanionFirstDismissSeen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function loadFavorites(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select(
        "display_name,fav_team_1,fav_team_2,fav_team_3,fav_driver_1,fav_driver_2,fav_driver_3,timezone_offset,companion_name_pref,companion_dismissed,companion_intro_done,companion_first_dismiss_seen"
      )
      .eq("id", userId)
      .maybeSingle();
    const t1 = data?.fav_team_1 ?? null;
    const t2 = data?.fav_team_2 ?? null;
    const t3 = data?.fav_team_3 ?? null;
    setDisplayName(data?.display_name ?? null);
    setFavTeams([t1, t2, t3]);
    setFavDrivers([
      data?.fav_driver_1 ?? null,
      data?.fav_driver_2 ?? null,
      data?.fav_driver_3 ?? null,
    ]);
    setTeamAccent(TEAM_COLORS[t1 ?? ""] ?? "#e10600");
    setTimezoneOffset(data?.timezone_offset ?? 0);
    setCompanionNamePref(data?.companion_name_pref ?? null);
    setCompanionDismissed(data?.companion_dismissed ?? false);
    setCompanionIntroDone(data?.companion_intro_done ?? false);
    setCompanionFirstDismissSeen(data?.companion_first_dismiss_seen ?? false);
  }

  async function refreshFavorites() {
    if (!user?.id) return;
    await loadFavorites(user.id);
  }

  async function fetchUnreadCount(userId: string) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    setUnreadCount(count ?? 0);
  }

  async function refreshNotifications() {
    if (!user?.id) return;
    await fetchUnreadCount(user.id);
  }

  async function updateCompanion(patch: CompanionProfile) {
    if (!user?.id) return;
    // Optimistic local update
    if ("companion_name_pref" in patch) setCompanionNamePref(patch.companion_name_pref ?? null);
    if ("companion_dismissed" in patch) setCompanionDismissed(patch.companion_dismissed ?? false);
    if ("companion_intro_done" in patch) setCompanionIntroDone(patch.companion_intro_done ?? false);
    if ("companion_first_dismiss_seen" in patch) setCompanionFirstDismissSeen(patch.companion_first_dismiss_seen ?? false);
    await supabase.from("profiles").upsert({ id: user.id, ...patch });
  }

  useEffect(() => {
    document.documentElement.style.setProperty("--team-accent", teamAccent);
  }, [teamAccent]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user?.id) {
        await Promise.all([loadFavorites(user.id), fetchUnreadCount(user.id)]);
      }
      setAuthReady(true);
    });

    // Keep in sync with auth state changes (handles OAuth redirects)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser?.id) {
        loadFavorites(newUser.id);
        fetchUnreadCount(newUser.id);
      } else {
        setDisplayName(null);
        setFavTeams([null, null, null]);
        setFavDrivers([null, null, null]);
        setTeamAccent("#e10600");
        setTimezoneOffset(0);
        setUnreadCount(0);
        setCompanionNamePref(null);
        setCompanionDismissed(false);
        setCompanionIntroDone(false);
        setCompanionFirstDismissSeen(false);
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        signOut,
        displayName,
        favTeams,
        favDrivers,
        teamAccent,
        timezoneOffset,
        refreshFavorites,
        unreadCount,
        refreshNotifications,
        companionNamePref,
        companionDismissed,
        companionIntroDone,
        companionFirstDismissSeen,
        updateCompanion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
