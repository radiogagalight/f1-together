"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { TEAM_COLORS } from "@/lib/teamColors";

interface AuthContextValue {
  user: User | null;
  signOut: () => Promise<void>;
  favTeams: [string | null, string | null, string | null];
  favDrivers: [string | null, string | null, string | null];
  teamAccent: string;
  refreshFavorites: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  signOut: async () => {},
  favTeams: [null, null, null],
  favDrivers: [null, null, null],
  teamAccent: "#e10600",
  refreshFavorites: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favTeams, setFavTeams] = useState<[string | null, string | null, string | null]>([null, null, null]);
  const [favDrivers, setFavDrivers] = useState<[string | null, string | null, string | null]>([null, null, null]);
  const [teamAccent, setTeamAccent] = useState("#e10600");
  const router = useRouter();
  const supabase = createClient();

  async function loadFavorites(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("fav_team_1,fav_team_2,fav_team_3,fav_driver_1,fav_driver_2,fav_driver_3")
      .eq("id", userId)
      .maybeSingle();
    const t1 = data?.fav_team_1 ?? null;
    const t2 = data?.fav_team_2 ?? null;
    const t3 = data?.fav_team_3 ?? null;
    setFavTeams([t1, t2, t3]);
    setFavDrivers([
      data?.fav_driver_1 ?? null,
      data?.fav_driver_2 ?? null,
      data?.fav_driver_3 ?? null,
    ]);
    setTeamAccent(TEAM_COLORS[t1 ?? ""] ?? "#e10600");
  }

  async function refreshFavorites() {
    if (!user?.id) return;
    await loadFavorites(user.id);
  }

  useEffect(() => {
    document.documentElement.style.setProperty("--team-accent", teamAccent);
  }, [teamAccent]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user?.id) loadFavorites(user.id);
    });

    // Keep in sync with auth state changes (handles OAuth redirects)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser?.id) {
        loadFavorites(newUser.id);
      } else {
        setFavTeams([null, null, null]);
        setFavDrivers([null, null, null]);
        setTeamAccent("#e10600");
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
    <AuthContext.Provider value={{ user, signOut, favTeams, favDrivers, teamAccent, refreshFavorites }}>
      {children}
    </AuthContext.Provider>
  );
}
