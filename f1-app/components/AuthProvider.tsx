"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase/app";
import { getDb } from "@/lib/firebase/db";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
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
  timezoneName: string;
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
  timezoneName: "UTC",
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

async function syncServerSession(user: User | null) {
  try {
    if (!user) {
      await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
      return;
    }
    const idToken = await user.getIdToken();
    await fetch("/api/auth/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch (e) {
    console.error("[auth] session sync", e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [favTeams, setFavTeams] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);
  const [favDrivers, setFavDrivers] = useState<[string | null, string | null, string | null]>([
    null,
    null,
    null,
  ]);
  const [teamAccent, setTeamAccent] = useState("#e10600");
  const [timezoneName, setTimezoneName] = useState("UTC");
  const [unreadCount, setUnreadCount] = useState(0);
  const [companionNamePref, setCompanionNamePref] = useState<string | null>(null);
  const [companionDismissed, setCompanionDismissed] = useState(false);
  const [companionIntroDone, setCompanionIntroDone] = useState(false);
  const [companionFirstDismissSeen, setCompanionFirstDismissSeen] = useState(false);
  const router = useRouter();

  const auth = getAuth(getFirebaseApp());
  const db = getDb();

  async function loadFavorites(userId: string) {
    const ref = doc(db, "profiles", userId);
    const snap = await getDoc(ref);
    let data = snap.data();
    if (!data) {
      const u = auth.currentUser;
      const dn = u?.displayName ?? u?.email?.split("@")[0] ?? "Player";
      await setDoc(ref, { id: userId, display_name: dn }, { merge: true });
      const again = await getDoc(ref);
      data = again.data();
    }
    if (!data) return;
    const t1 = data.fav_team_1 ?? null;
    const t2 = data.fav_team_2 ?? null;
    const t3 = data.fav_team_3 ?? null;
    setDisplayName(data.display_name ?? null);
    setFavTeams([t1, t2, t3]);
    setFavDrivers([
      data.fav_driver_1 ?? null,
      data.fav_driver_2 ?? null,
      data.fav_driver_3 ?? null,
    ]);
    setTeamAccent(TEAM_COLORS[t1 ?? ""] ?? "#e10600");
    setTimezoneName(
      data.timezone_name ?? Intl.DateTimeFormat().resolvedOptions().timeZone
    );
    setCompanionNamePref(data.companion_name_pref ?? null);
    setCompanionDismissed(data.companion_dismissed ?? false);
    setCompanionIntroDone(data.companion_intro_done ?? false);
    setCompanionFirstDismissSeen(data.companion_first_dismiss_seen ?? false);
  }

  async function refreshFavorites() {
    if (!user?.uid) return;
    await loadFavorites(user.uid);
  }

  async function fetchUnreadCount(userId: string) {
    const q = query(
      collection(db, "notifications"),
      where("user_id", "==", userId),
      where("read_at", "==", null)
    );
    const snap = await getDocs(q);
    setUnreadCount(snap.size);
  }

  async function refreshNotifications() {
    if (!user?.uid) return;
    await fetchUnreadCount(user.uid);
  }

  async function updateCompanion(patch: CompanionProfile) {
    if (!user?.uid) return;
    if ("companion_name_pref" in patch) setCompanionNamePref(patch.companion_name_pref ?? null);
    if ("companion_dismissed" in patch) setCompanionDismissed(patch.companion_dismissed ?? false);
    if ("companion_intro_done" in patch) setCompanionIntroDone(patch.companion_intro_done ?? false);
    if ("companion_first_dismiss_seen" in patch)
      setCompanionFirstDismissSeen(patch.companion_first_dismiss_seen ?? false);
    await setDoc(doc(db, "profiles", user.uid), { id: user.uid, ...patch }, { merge: true });
  }

  useEffect(() => {
    document.documentElement.style.setProperty("--team-accent", teamAccent);
  }, [teamAccent]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  useEffect(() => {
    let unsubNotif: (() => void) | undefined;
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      unsubNotif?.();
      unsubNotif = undefined;
      setUser(u);
      await syncServerSession(u);
      if (u?.uid) {
        await Promise.all([loadFavorites(u.uid), fetchUnreadCount(u.uid)]);
        const q = query(
          collection(db, "notifications"),
          where("user_id", "==", u.uid),
          where("read_at", "==", null)
        );
        unsubNotif = onSnapshot(q, () => {
          fetchUnreadCount(u.uid);
        });
      } else {
        setDisplayName(null);
        setFavTeams([null, null, null]);
        setFavDrivers([null, null, null]);
        setTeamAccent("#e10600");
        setTimezoneName("UTC");
        setUnreadCount(0);
        setCompanionNamePref(null);
        setCompanionDismissed(false);
        setCompanionIntroDone(false);
        setCompanionFirstDismissSeen(false);
      }
      setAuthReady(true);
    });
    return () => {
      unsubAuth();
      unsubNotif?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await firebaseSignOut(auth);
    await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
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
        timezoneName,
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
