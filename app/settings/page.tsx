"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { clearPicks } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

async function subscribeToPush(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  });
}

const UTC_OFFSETS = [
  { value: -12, label: "UTC−12" },
  { value: -11, label: "UTC−11" },
  { value: -10, label: "UTC−10  (Hawaii)" },
  { value: -9,  label: "UTC−9   (Alaska)" },
  { value: -8,  label: "UTC−8   (Pacific US/Canada)" },
  { value: -7,  label: "UTC−7   (Mountain US/Canada)" },
  { value: -6,  label: "UTC−6   (Central US/Canada)" },
  { value: -5,  label: "UTC−5   (Eastern US/Canada)" },
  { value: -4,  label: "UTC−4   (Atlantic / EDT)" },
  { value: -3,  label: "UTC−3   (Brazil, Argentina)" },
  { value: -2,  label: "UTC−2" },
  { value: -1,  label: "UTC−1" },
  { value:  0,  label: "UTC+0   (London, Dublin)" },
  { value:  1,  label: "UTC+1   (Paris, Amsterdam)" },
  { value:  2,  label: "UTC+2   (Helsinki, Cairo)" },
  { value:  3,  label: "UTC+3   (Moscow, Riyadh)" },
  { value:  4,  label: "UTC+4   (Dubai, Baku)" },
  { value:  5,  label: "UTC+5   (Karachi)" },
  { value:  6,  label: "UTC+6   (Dhaka)" },
  { value:  7,  label: "UTC+7   (Bangkok, Jakarta)" },
  { value:  8,  label: "UTC+8   (Singapore, Shanghai)" },
  { value:  9,  label: "UTC+9   (Tokyo, Seoul)" },
  { value: 10,  label: "UTC+10  (Sydney — AEST)" },
  { value: 11,  label: "UTC+11  (Melbourne — AEDT)" },
  { value: 12,  label: "UTC+12  (Auckland)" },
  { value: 13,  label: "UTC+13" },
  { value: 14,  label: "UTC+14" },
];

export default function SettingsPage() {
  const { user, signOut, timezoneOffset, refreshFavorites } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [tzOffset, setTzOffset] = useState(timezoneOffset);
  const [tzSaved, setTzSaved] = useState(false);
  const [tzError, setTzError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<"unsupported" | "denied" | "enabled" | "disabled">("disabled");
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Sync local state when context loads (after DB fetch)
  useEffect(() => { setTzOffset(timezoneOffset); }, [timezoneOffset]);

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

  async function handleTzChange(value: number) {
    setTzOffset(value);
    setTzSaved(false);
    setTzError(null);
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({ id: user.id, timezone_offset: value });
    if (error) {
      setTzError("Save failed: " + error.message);
      return;
    }
    await refreshFavorites();
    setTzSaved(true);
    setTimeout(() => setTzSaved(false), 2000);
  }

  function autoDetect() {
    const detected = -Math.round(new Date().getTimezoneOffset() / 60);
    handleTzChange(detected);
  }

  async function handleConfirmDelete() {
    if (!user) return;
    await clearPicks(user.id, supabase);
    setConfirming(false);
    router.push("/");
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
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
            value={tzOffset}
            onChange={(e) => handleTzChange(Number(e.target.value))}
            className="w-full rounded-lg border px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)] mb-3"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
            }}
          >
            {UTC_OFFSETS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
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
                Are you sure? This will erase all your picks.
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
