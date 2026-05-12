"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { clearPredictions } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { CONSTRUCTORS, DRIVERS } from "@/lib/data";
import { TEAM_COLORS, hexToRgb } from "@/lib/teamColors";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_LABELS = ["#1", "#2", "#3"];
const DRIVERS_BY_TEAM = CONSTRUCTORS.map((c) => ({
  team: c,
  drivers: DRIVERS.filter((d) => d.team === c.name),
}));

async function subscribeToPush(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  });
}

const TIMEZONES = [
  { value: "Pacific/Honolulu",              label: "Hawaii (UTC−10)" },
  { value: "America/Anchorage",             label: "Alaska (UTC−9/−8)" },
  { value: "America/Los_Angeles",           label: "Pacific — LA, Seattle (UTC−8/−7)" },
  { value: "America/Denver",                label: "Mountain — Denver (UTC−7/−6)" },
  { value: "America/Phoenix",               label: "Arizona — no DST (UTC−7)" },
  { value: "America/Chicago",               label: "Central — Chicago, Dallas (UTC−6/−5)" },
  { value: "America/New_York",              label: "Eastern — New York, Miami (UTC−5/−4)" },
  { value: "America/Halifax",               label: "Atlantic — Halifax (UTC−4/−3)" },
  { value: "America/Sao_Paulo",             label: "Brazil — São Paulo (UTC−3)" },
  { value: "America/Argentina/Buenos_Aires",label: "Argentina (UTC−3)" },
  { value: "Atlantic/Azores",               label: "Azores (UTC−1/0)" },
  { value: "Europe/London",                 label: "London, Dublin (UTC+0/+1)" },
  { value: "Europe/Paris",                  label: "Central Europe — Paris, Amsterdam (UTC+1/+2)" },
  { value: "Europe/Helsinki",               label: "Eastern Europe — Helsinki, Kyiv (UTC+2/+3)" },
  { value: "Europe/Moscow",                 label: "Moscow (UTC+3)" },
  { value: "Asia/Dubai",                    label: "Dubai, Abu Dhabi (UTC+4)" },
  { value: "Asia/Karachi",                  label: "Pakistan (UTC+5)" },
  { value: "Asia/Kolkata",                  label: "India (UTC+5:30)" },
  { value: "Asia/Dhaka",                    label: "Bangladesh (UTC+6)" },
  { value: "Asia/Bangkok",                  label: "Bangkok, Jakarta (UTC+7)" },
  { value: "Asia/Singapore",                label: "Singapore, Kuala Lumpur (UTC+8)" },
  { value: "Asia/Shanghai",                 label: "China (UTC+8)" },
  { value: "Asia/Tokyo",                    label: "Japan, Korea (UTC+9)" },
  { value: "Australia/Brisbane",            label: "Brisbane — no DST (UTC+10)" },
  { value: "Australia/Sydney",              label: "Sydney, Melbourne (UTC+10/+11)" },
  { value: "Pacific/Auckland",              label: "New Zealand (UTC+12/+13)" },
];

export default function SettingsPage() {
  const { user, signOut, authReady, timezoneName, refreshFavorites, displayName: ctxDisplayName, favTeams: ctxFavTeams, favDrivers: ctxFavDrivers } = useAuth();
  const [confirming, setConfirming] = useState(false);

  // ── Profile state ──
  const [displayName, setDisplayName] = useState(ctxDisplayName ?? "");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const [teams, setTeams] = useState<[string | null, string | null, string | null]>(ctxFavTeams);
  const [drivers, setDrivers] = useState<[string | null, string | null, string | null]>(ctxFavDrivers);
  const [openTeamSlot, setOpenTeamSlot] = useState<number | null>(null);
  const [openDriverSlot, setOpenDriverSlot] = useState<number | null>(null);

  useEffect(() => { setDisplayName(ctxDisplayName ?? ""); }, [ctxDisplayName]);
  useEffect(() => { setTeams(ctxFavTeams); }, [ctxFavTeams]);
  useEffect(() => { setDrivers(ctxFavDrivers); }, [ctxFavDrivers]);

  const initials = displayName
    ? displayName.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
    : (user?.email?.[0] ?? "?").toUpperCase();

  async function handleSaveName() {
    if (!user || !nameInput.trim()) return;
    await supabase.from("profiles").upsert({ id: user.id, display_name: nameInput.trim() });
    setDisplayName(nameInput.trim());
    setEditingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
    refreshFavorites();
  }

  async function selectTeam(slotIdx: number, teamId: string) {
    const newTeams = [...teams] as [string | null, string | null, string | null];
    newTeams[slotIdx] = teamId;
    setTeams(newTeams);
    setOpenTeamSlot(null);
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, fav_team_1: newTeams[0], fav_team_2: newTeams[1], fav_team_3: newTeams[2] });
    await refreshFavorites();
  }

  async function clearTeam(slotIdx: number) {
    const newTeams = [...teams] as [string | null, string | null, string | null];
    newTeams[slotIdx] = null;
    setTeams(newTeams);
    setOpenTeamSlot(null);
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, fav_team_1: newTeams[0], fav_team_2: newTeams[1], fav_team_3: newTeams[2] });
    await refreshFavorites();
  }

  async function selectDriver(slotIdx: number, driverId: string) {
    const newDrivers = [...drivers] as [string | null, string | null, string | null];
    newDrivers[slotIdx] = driverId;
    setDrivers(newDrivers);
    setOpenDriverSlot(null);
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, fav_driver_1: newDrivers[0], fav_driver_2: newDrivers[1], fav_driver_3: newDrivers[2] });
  }

  async function clearDriver(slotIdx: number) {
    const newDrivers = [...drivers] as [string | null, string | null, string | null];
    newDrivers[slotIdx] = null;
    setDrivers(newDrivers);
    setOpenDriverSlot(null);
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, fav_driver_1: newDrivers[0], fav_driver_2: newDrivers[1], fav_driver_3: newDrivers[2] });
  }

  function toggleTeamSlot(idx: number) { setOpenDriverSlot(null); setOpenTeamSlot((p) => (p === idx ? null : idx)); }
  function toggleDriverSlot(idx: number) { setOpenTeamSlot(null); setOpenDriverSlot((p) => (p === idx ? null : idx)); }
  const [isAdmin, setIsAdmin] = useState(false);
  const [tzName, setTzName] = useState(timezoneName);
  const [tzSaved, setTzSaved] = useState(false);
  const [tzError, setTzError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<"unsupported" | "denied" | "enabled" | "disabled">("disabled");
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Sync local state when context loads (after DB fetch)
  useEffect(() => { setTzName(timezoneName); }, [timezoneName]);

  // Check admin status
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setIsAdmin(data?.is_admin === true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Check current push permission / subscription status
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      setPushStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setPushStatus('denied');
      return;
    }
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        setPushStatus(sub ? 'enabled' : 'disabled');
      })
    );
  }, []);

  async function handleEnablePush() {
    if (pushLoading) return;
    setPushLoading(true);
    setPushError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus(permission === 'denied' ? 'denied' : 'disabled');
        return;
      }
      const sub = await subscribeToPush();
      if (!sub) { setPushStatus('disabled'); return; }
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setPushStatus('enabled');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPushError(msg);
      console.error('Push subscribe failed:', err);
    } finally {
      setPushLoading(false);
    }
  }

  async function handleDisablePush() {
    if (pushLoading) return;
    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch('/api/push/subscribe', { method: 'DELETE' });
      setPushStatus('disabled');
    } finally {
      setPushLoading(false);
    }
  }

  async function handleTzChange(value: string) {
    setTzName(value);
    setTzSaved(false);
    setTzError(null);
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({ id: user.id, timezone_name: value });
    if (error) {
      setTzError("Save failed: " + error.message);
      return;
    }
    await refreshFavorites();
    setTzSaved(true);
    setTimeout(() => setTzSaved(false), 2000);
  }

  function autoDetect() {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    handleTzChange(detected);
  }

  async function handleConfirmDelete() {
    if (!user) return;
    await clearPredictions(user.id, supabase);
    setConfirming(false);
    router.push("/");
  }

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto px-4 pt-6 pb-28 md:pb-6">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block h-1 w-8 rounded-full"
            style={{ backgroundColor: "var(--f1-red)" }}
          />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            App
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Settings
        </h1>
      </div>

      {/* ── Profile ── */}
      <section className="mb-6" style={{ opacity: authReady ? 1 : 0, transition: "opacity 0.15s ease" }}>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>Profile</h2>

        {/* Avatar + display name */}
        <div className="rounded-xl border p-4 mb-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-white shrink-0" style={{ backgroundColor: "var(--team-accent)" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold truncate" style={{ color: "var(--foreground)" }}>
                {displayName || <span className="font-normal italic" style={{ color: "var(--muted)" }}>No name set</span>}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{user?.email}</p>
            </div>
          </div>
          {editingName ? (
            <div>
              <input
                type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)] mb-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--background)", color: "var(--foreground)" }}
                autoFocus placeholder="Your racing name" maxLength={32}
              />
              <div className="flex gap-2">
                <button onClick={handleSaveName} className="flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white" style={{ minHeight: "44px", backgroundColor: "var(--f1-red)" }}>Save</button>
                <button onClick={() => setEditingName(false)} className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold border" style={{ minHeight: "44px", borderColor: "var(--border)", color: "var(--muted)", backgroundColor: "transparent" }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setNameInput(displayName); setEditingName(true); }}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold border transition-colors active:opacity-80"
              style={{ minHeight: "44px", borderColor: "var(--border)", color: "var(--foreground)", backgroundColor: "transparent" }}
            >
              {nameSaved ? "Saved ✓" : displayName ? "Edit display name" : "Set display name"}
            </button>
          )}
        </div>

        {/* My Teams */}
        <div className="rounded-xl border p-4 mb-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>My Teams</h3>
          {([0, 1, 2] as const).map((idx) => {
            const teamId = teams[idx];
            const teamColor = TEAM_COLORS[teamId ?? ""] ?? null;
            const teamLabel = CONSTRUCTORS.find((c) => c.id === teamId)?.name ?? null;
            const isOpen = openTeamSlot === idx;
            return (
              <div key={idx} className="mb-2">
                <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer active:opacity-75" style={{ backgroundColor: "var(--surface-hover)" }} onClick={() => toggleTeamSlot(idx)}>
                  <span className="text-xs font-black w-6 text-center shrink-0" style={{ color: RANK_COLORS[idx] }}>{RANK_LABELS[idx]}</span>
                  {teamId && teamColor ? (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: `rgba(${hexToRgb(teamColor)},0.15)`, color: teamColor, border: `1px solid rgba(${hexToRgb(teamColor)},0.35)` }}>{teamLabel}</span>
                  ) : (
                    <span className="text-sm" style={{ color: "var(--muted)" }}>Choose team…</span>
                  )}
                  <span className="flex-1" />
                  {teamId && <button onClick={(e) => { e.stopPropagation(); clearTeam(idx); }} className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--muted)" }}>✕</button>}
                  <span style={{ color: "var(--muted)", fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div className="mt-1 rounded-xl p-3 flex flex-wrap gap-2" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
                    {CONSTRUCTORS.map((c) => {
                      const tc = TEAM_COLORS[c.id] ?? "#888";
                      const tcRgb = hexToRgb(tc);
                      return (
                        <button key={c.id} onClick={() => selectTeam(idx, c.id)} className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity"
                          style={{ backgroundColor: `rgba(${tcRgb},0.15)`, color: tc, border: `1px solid rgba(${tcRgb},0.35)`, opacity: teams.some((t, i) => t === c.id && i !== idx) ? 0.35 : 1 }}>
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* My Drivers */}
        <div className="rounded-xl border p-4 mb-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <h3 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>My Drivers</h3>
          {([0, 1, 2] as const).map((idx) => {
            const driverId = drivers[idx];
            const driverLabel = DRIVERS.find((d) => d.id === driverId)?.name ?? null;
            const isOpen = openDriverSlot === idx;
            return (
              <div key={idx} className="mb-2">
                <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer active:opacity-75" style={{ backgroundColor: "var(--surface-hover)" }} onClick={() => toggleDriverSlot(idx)}>
                  <span className="text-xs font-black w-6 text-center shrink-0" style={{ color: RANK_COLORS[idx] }}>{RANK_LABELS[idx]}</span>
                  {driverLabel ? (
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{driverLabel}</span>
                  ) : (
                    <span className="text-sm" style={{ color: "var(--muted)" }}>Choose driver…</span>
                  )}
                  <span className="flex-1" />
                  {driverId && <button onClick={(e) => { e.stopPropagation(); clearDriver(idx); }} className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--muted)" }}>✕</button>}
                  <span style={{ color: "var(--muted)", fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
                {isOpen && (
                  <div className="mt-1 rounded-xl p-3" style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}>
                    {DRIVERS_BY_TEAM.map(({ team, drivers: teamDrivers }) => {
                      const tc = TEAM_COLORS[team.id] ?? "#888";
                      return (
                        <div key={team.id} className="mb-3 last:mb-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: tc }}>{team.name}</p>
                          <div className="flex flex-wrap gap-2">
                            {teamDrivers.map((d) => (
                              <button key={d.id} onClick={() => selectDriver(idx, d.id)} className="text-xs font-medium px-3 py-1.5 rounded-full transition-opacity"
                                style={{ backgroundColor: "var(--surface-hover)", color: "var(--foreground)", border: "1px solid var(--border)", opacity: drivers.some((dr, i) => dr === d.id && i !== idx) ? 0.35 : 1 }}>
                                {d.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Member since */}
        <div className="rounded-xl border px-4 py-3 flex items-center justify-between" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}>
          <span className="text-sm" style={{ color: "var(--muted)" }}>Member since</span>
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "—"}
          </span>
        </div>
      </section>

      {/* Account — logout */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Account
        </h2>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>
            Signed in as
          </p>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            {user?.email ?? "—"}
          </p>
          <button
            onClick={signOut}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors active:opacity-80 border"
            style={{
              minHeight: "44px",
              borderColor: "var(--border)",
              color: "var(--foreground)",
              backgroundColor: "transparent",
            }}
          >
            Log out
          </button>
        </div>
      </section>

      {/* Display */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Display
        </h2>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Race date timezone
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Adjusts race dates to your local time
              </p>
            </div>
            {tzSaved && (
              <span className="text-xs text-green-500 font-medium">Saved ✓</span>
            )}
            {tzError && (
              <span className="text-xs text-red-500 font-medium">{tzError}</span>
            )}
          </div>

          <select
            value={tzName}
            onChange={(e) => handleTzChange(e.target.value)}
            className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)] mb-3"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
            }}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>{tz.label}</option>
            ))}
          </select>

          <button
            onClick={autoDetect}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold border transition-colors active:opacity-80"
            style={{
              minHeight: "44px",
              borderColor: "var(--border)",
              color: "var(--muted)",
              backgroundColor: "transparent",
            }}
          >
            Auto-detect from browser
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Notifications
        </h2>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                Push notifications
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Get notified when someone @mentions you in a race discussion
              </p>
            </div>
            <span
              className="text-xs font-semibold ml-3 shrink-0"
              style={{
                color:
                  pushStatus === 'enabled' ? '#22c55e' :
                  pushStatus === 'denied' ? '#ef4444' :
                  "var(--muted)",
              }}
            >
              {pushStatus === 'enabled' ? 'Enabled' :
               pushStatus === 'denied' ? 'Blocked' :
               pushStatus === 'unsupported' ? 'Not supported' :
               'Disabled'}
            </span>
          </div>

          {pushStatus === 'unsupported' && (
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Push notifications are not supported in this browser.
            </p>
          )}

          {pushStatus === 'denied' && (
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Notifications are blocked. Enable them in your browser settings to continue.
            </p>
          )}

          {pushStatus === 'disabled' && (
            <button
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors active:opacity-80"
              style={{
                minHeight: "44px",
                backgroundColor: pushLoading ? "rgba(255,255,255,0.06)" : "var(--f1-red)",
                color: "#fff",
              }}
            >
              {pushLoading ? "Enabling…" : "Enable push notifications"}
            </button>
          )}

          {pushError && (
            <p className="text-xs mt-2" style={{ color: "#ef4444" }}>
              Failed: {pushError}
            </p>
          )}

          {pushStatus === 'enabled' && (
            <button
              onClick={handleDisablePush}
              disabled={pushLoading}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors active:opacity-80 border"
              style={{
                minHeight: "44px",
                borderColor: "var(--border)",
                color: "var(--muted)",
                backgroundColor: "transparent",
              }}
            >
              {pushLoading ? "Disabling…" : "Disable notifications"}
            </button>
          )}
        </div>
      </section>

      {/* Admin */}
      {isAdmin && (
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Admin
          </h2>
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
          >
            <Link
              href="/admin/results"
              className="block w-full rounded-lg px-4 py-3 text-sm font-semibold text-center transition-colors active:opacity-80"
              style={{
                minHeight: "44px",
                backgroundColor: "#e10600",
                color: "#fff",
                lineHeight: "1.75rem",
              }}
            >
              Manage Race Results →
            </Link>
          </div>
        </section>
      )}

      {/* Danger zone */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Danger Zone
        </h2>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
        >
          <div className="flex flex-col gap-1 mb-4">
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Delete All Data
            </p>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Clears all your season predictions. This cannot be undone.
            </p>
          </div>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors active:opacity-80"
              style={{
                minHeight: "44px",
                backgroundColor: "transparent",
                border: "1px solid var(--f1-red)",
                color: "var(--f1-red)",
              }}
            >
              Delete All Data
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-center" style={{ color: "var(--foreground)" }}>
                Are you sure? This will erase all your predictions.
              </p>
              <button
                onClick={handleConfirmDelete}
                className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-colors active:opacity-80"
                style={{ minHeight: "44px", backgroundColor: "var(--f1-red)" }}
              >
                Yes, delete everything
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-colors active:opacity-80"
                style={{
                  minHeight: "44px",
                  backgroundColor: "var(--surface-hover)",
                  color: "var(--foreground)",
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
