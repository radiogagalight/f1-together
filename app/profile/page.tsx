"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Derive initials from display name or email
  const initials = displayName
    ? displayName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : (user?.email?.[0] ?? "?").toUpperCase();

  async function handleSaveName() {
    if (!user || !nameInput.trim()) return;
    await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: nameInput.trim() });
    setDisplayName(nameInput.trim());
    setEditingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  function startEditing() {
    setNameInput(displayName);
    setEditingName(true);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-5 pb-24">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium mb-6"
        style={{ color: "var(--muted)" }}
      >
        ← Back to track
      </Link>

      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-block h-1 w-8 rounded-full"
            style={{ backgroundColor: "var(--f1-red)" }}
          />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Driver
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Profile
        </h1>
      </div>

      {/* Profile card */}
      <div
        className="rounded-2xl border p-6 mb-4 flex flex-col items-center text-center"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        {/* Avatar */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white mb-5 shadow-lg"
          style={{ backgroundColor: "var(--f1-red)" }}
        >
          {initials}
        </div>

        {editingName ? (
          /* Edit mode */
          <div className="w-full">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className="w-full rounded-xl border px-4 py-3 text-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)] mb-4"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--background)",
                color: "var(--foreground)",
              }}
              autoFocus
              placeholder="Your racing name"
              maxLength={32}
            />
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleSaveName}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-colors active:opacity-80"
                style={{ backgroundColor: "var(--f1-red)" }}
              >
                Save
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="rounded-xl px-6 py-2.5 text-sm font-semibold border transition-colors active:opacity-80"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--muted)",
                  backgroundColor: "transparent",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* View mode */
          <>
            <p className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
              {displayName || (
                <span className="font-normal italic" style={{ color: "var(--muted)" }}>
                  No name set
                </span>
              )}
            </p>
            <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>
              {user?.email}
            </p>

            {nameSaved && (
              <p className="text-xs text-green-500 mb-3">Name saved!</p>
            )}

            <button
              onClick={startEditing}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold border transition-colors active:opacity-80"
              style={{
                borderColor: "var(--border)",
                color: "var(--foreground)",
                backgroundColor: "var(--surface-hover)",
              }}
            >
              {displayName ? "Edit display name" : "Set display name"}
            </button>
          </>
        )}
      </div>

      {/* Info row */}
      <div
        className="rounded-2xl border px-5 py-4 flex items-center justify-between"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          Member since
        </span>
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {user?.created_at
            ? new Date(user.created_at).toLocaleDateString("en-GB", {
                month: "long",
                year: "numeric",
              })
            : "—"}
        </span>
      </div>
    </div>
  );
}
