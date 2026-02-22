"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { clearPicks } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
