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
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      unsubNotif?.();
      unsubNotif = undefined;
      setUser(u);
      setAuthReady(true);
      void syncServerSession(u);
      if (u?.uid) {
        void loadFavorites(u.uid);
        void fetchUnreadCount(u.uid);
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
      }
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
