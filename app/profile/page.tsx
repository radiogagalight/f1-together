"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { CONSTRUCTORS, DRIVERS } from "@/lib/data";
import { TEAM_COLORS, hexToRgb } from "@/lib/teamColors";

const RANK_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const RANK_LABELS = ["#1", "#2", "#3"];

// Group drivers by team for the driver picker
const DRIVERS_BY_TEAM = CONSTRUCTORS.map((c) => ({
  team: c,
  drivers: DRIVERS.filter((d) => d.team === c.name),
}));

export default function ProfilePage() {
  const { user, refreshFavorites } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaved, setNameSaved] = useState(false);

  const [teams, setTeams] = useState<[string | null, string | null, string | null]>([null, null, null]);
  const [drivers, setDrivers] = useState<[string | null, string | null, string | null]>([null, null, null]);
  const [openTeamSlot, setOpenTeamSlot] = useState<number | null>(null);
  const [openDriverSlot, setOpenDriverSlot] = useState<number | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name,fav_team_1,fav_team_2,fav_team_3,fav_driver_1,fav_driver_2,fav_driver_3")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
        setTeams([data?.fav_team_1 ?? null, data?.fav_team_2 ?? null, data?.fav_team_3 ?? null]);
        setDrivers([data?.fav_driver_1 ?? null, data?.fav_driver_2 ?? null, data?.fav_driver_3 ?? null]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
  }

  function startEditing() {
    setNameInput(displayName);
    setEditingName(true);
  }

  async function selectTeam(slotIdx: number, teamId: string) {
    const newTeams = [...teams] as [string | null, string | null, string | null];
    newTeams[slotIdx] = teamId;
    setTeams(newTeams);
    setOpenTeamSlot(null);
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      fav_team_1: newTeams[0],
      fav_team_2: newTeams[1],
      fav_team_3: newTeams[2],
    });
    await refreshFavorites();
  }

  async function clearTeam(slotIdx: number) {
    const newTeams = [...teams] as [string | null, string | null, string | null];
    newTeams[slotIdx] = null;
    setTeams(newTeams);
    setOpenTeamSlot(null);
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      fav_team_1: newTeams[0],
      fav_team_2: newTeams[1],
      fav_team_3: newTeams[2],
    });
    await refreshFavorites();
  }

  async function selectDriver(slotIdx: number, driverId: string) {
    const newDrivers = [...drivers] as [string | null, string | null, string | null];
    newDrivers[slotIdx] = driverId;
    setDrivers(newDrivers);
    setOpenDriverSlot(null);
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      fav_driver_1: newDrivers[0],
      fav_driver_2: newDrivers[1],
      fav_driver_3: newDrivers[2],
    });
  }

  async function clearDriver(slotIdx: number) {
    const newDrivers = [...drivers] as [string | null, string | null, string | null];
    newDrivers[slotIdx] = null;
    setDrivers(newDrivers);
    setOpenDriverSlot(null);
    if (!user) return;
    await supabase.from("profiles").upsert({
      id: user.id,
      fav_driver_1: newDrivers[0],
      fav_driver_2: newDrivers[1],
      fav_driver_3: newDrivers[2],
    });
  }

  function toggleTeamSlot(idx: number) {
    setOpenDriverSlot(null);
    setOpenTeamSlot((prev) => (prev === idx ? null : idx));
  }

  function toggleDriverSlot(idx: number) {
    setOpenTeamSlot(null);
    setOpenDriverSlot((prev) => (prev === idx ? null : idx));
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
          <span className="inline-block h-1 w-8 rounded-full" style={{ backgroundColor: "var(--f1-red)" }} />
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
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white mb-5 shadow-lg"
          style={{ backgroundColor: "var(--f1-red)" }}
        >
          {initials}
        </div>

        {editingName ? (
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
                style={{ borderColor: "var(--border)", color: "var(--muted)", backgroundColor: "transparent" }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
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
            {nameSaved && <p className="text-xs text-green-500 mb-3">Name saved!</p>}
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

      {/* ── My Teams ── */}
      <div
        className="rounded-2xl border p-4 mb-4"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          My Teams
        </h2>
        {([0, 1, 2] as const).map((idx) => {
          const teamId = teams[idx];
          const teamColor = TEAM_COLORS[teamId ?? ""] ?? null;
          const teamLabel = CONSTRUCTORS.find((c) => c.id === teamId)?.name ?? null;
          const isOpen = openTeamSlot === idx;

          return (
            <div key={idx} className="mb-2">
              {/* Slot row */}
              <div
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer active:opacity-75"
                style={{ backgroundColor: "var(--surface-hover)" }}
                onClick={() => toggleTeamSlot(idx)}
              >
                <span
                  className="text-xs font-black w-6 text-center shrink-0"
                  style={{ color: RANK_COLORS[idx] }}
                >
                  {RANK_LABELS[idx]}
                </span>
                {teamId && teamColor ? (
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: `rgba(${hexToRgb(teamColor)},0.15)`,
                      color: teamColor,
                      border: `1px solid rgba(${hexToRgb(teamColor)},0.35)`,
                    }}
                  >
                    {teamLabel}
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    Choose team…
                  </span>
                )}
                <span className="flex-1" />
                {teamId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clearTeam(idx); }}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ color: "var(--muted)", backgroundColor: "transparent" }}
                  >
                    ✕
                  </button>
                )}
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
              </div>

              {/* Expanded team picker */}
              {isOpen && (
                <div
                  className="mt-1 rounded-xl p-3 flex flex-wrap gap-2"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
                >
                  {CONSTRUCTORS.map((c) => {
                    const tc = TEAM_COLORS[c.id] ?? "#888";
                    const tcRgb = hexToRgb(tc);
                    const isChosenElsewhere = teams.some((t, i) => t === c.id && i !== idx);
                    return (
                      <button
                        key={c.id}
                        onClick={() => selectTeam(idx, c.id)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity"
                        style={{
                          backgroundColor: `rgba(${tcRgb},0.15)`,
                          color: tc,
                          border: `1px solid rgba(${tcRgb},0.35)`,
                          opacity: isChosenElsewhere ? 0.35 : 1,
                        }}
                      >
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

      {/* ── My Drivers ── */}
      <div
        className="rounded-2xl border p-4 mb-4"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          My Drivers
        </h2>
        {([0, 1, 2] as const).map((idx) => {
          const driverId = drivers[idx];
          const driverLabel = DRIVERS.find((d) => d.id === driverId)?.name ?? null;
          const isOpen = openDriverSlot === idx;

          return (
            <div key={idx} className="mb-2">
              {/* Slot row */}
              <div
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer active:opacity-75"
                style={{ backgroundColor: "var(--surface-hover)" }}
                onClick={() => toggleDriverSlot(idx)}
              >
                <span
                  className="text-xs font-black w-6 text-center shrink-0"
                  style={{ color: RANK_COLORS[idx] }}
                >
                  {RANK_LABELS[idx]}
                </span>
                {driverLabel ? (
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    {driverLabel}
                  </span>
                ) : (
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    Choose driver…
                  </span>
                )}
                <span className="flex-1" />
                {driverId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clearDriver(idx); }}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ color: "var(--muted)", backgroundColor: "transparent" }}
                  >
                    ✕
                  </button>
                )}
                <span style={{ color: "var(--muted)", fontSize: "12px" }}>{isOpen ? "▲" : "▼"}</span>
              </div>

              {/* Expanded driver picker */}
              {isOpen && (
                <div
                  className="mt-1 rounded-xl p-3"
                  style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)" }}
                >
                  {DRIVERS_BY_TEAM.map(({ team, drivers: teamDrivers }) => {
                    const tc = TEAM_COLORS[team.id] ?? "#888";
                    return (
                      <div key={team.id} className="mb-3 last:mb-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: tc }}>
                          {team.name}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {teamDrivers.map((d) => {
                            const isChosenElsewhere = drivers.some((dr, i) => dr === d.id && i !== idx);
                            return (
                              <button
                                key={d.id}
                                onClick={() => selectDriver(idx, d.id)}
                                className="text-xs font-medium px-3 py-1.5 rounded-full transition-opacity"
                                style={{
                                  backgroundColor: "var(--surface-hover)",
                                  color: "var(--foreground)",
                                  border: "1px solid var(--border)",
                                  opacity: isChosenElsewhere ? 0.35 : 1,
                                }}
                              >
                                {d.name}
                              </button>
                            );
                          })}
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
      <div
        className="rounded-2xl border px-5 py-4 flex items-center justify-between"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--surface)" }}
      >
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          Member since
        </span>
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {user?.created_at
            ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
            : "—"}
        </span>
      </div>
    </div>
  );
}
