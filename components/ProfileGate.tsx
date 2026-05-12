"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase/client";

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);
  const [needsName, setNeedsName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setNeedsName(!data?.display_name?.trim());
        setChecked(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function handleSave() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError("Please enter a display name.");
      return;
    }
    if (!user) return;

    setSaving(true);
    const { error: saveError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: trimmed });

    if (saveError) {
      setError("Couldn't save — please try again.");
      setSaving(false);
      return;
    }

    setNeedsName(false);
    setSaving(false);
  }

  return (
    <>
      {children}

      {checked && needsName && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          style={{
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border p-8 flex flex-col items-center text-center"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
            }}
          >
            {/* Red accent */}
            <div
              className="h-1 w-8 rounded-full mb-6"
              style={{ backgroundColor: "var(--f1-red)" }}
            />

            <h2
              className="text-xl font-bold mb-2"
              style={{ color: "var(--foreground)" }}
            >
              Welcome to the grid
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
              Choose a display name — this is how the rest of your league will
              see you.
            </p>

            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full rounded-xl border px-4 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)] mb-3"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--background)",
                color: "var(--foreground)",
              }}
              placeholder="Your racing name"
              maxLength={32}
              autoFocus
            />

            {error && (
              <p className="text-xs mb-3" style={{ color: "var(--f1-red)" }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !nameInput.trim()}
              className="w-full rounded-xl px-4 py-3 text-sm font-bold text-white transition-colors active:opacity-80 disabled:opacity-40"
              style={{ minHeight: "44px", backgroundColor: "var(--f1-red)" }}
            >
              {saving ? "Saving…" : "Let's race →"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
