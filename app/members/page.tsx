"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CONSTRUCTORS, DRIVERS } from "@/lib/data";
import { TEAM_COLORS, hexToRgb } from "@/lib/teamColors";

type Profile = {
  id: string;
  display_name: string | null;
  fav_team_1: string | null;
  fav_team_2: string | null;
  fav_team_3: string | null;
  fav_driver_1: string | null;
  fav_driver_2: string | null;
  fav_driver_3: string | null;
};

function teamName(id: string | null) {
  return CONSTRUCTORS.find((c) => c.id === id)?.name ?? id ?? "";
}

function driverName(id: string | null) {
  return DRIVERS.find((d) => d.id === id)?.name ?? id ?? "";
}

export default function MembersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id,display_name,fav_team_1,fav_team_2,fav_team_3,fav_driver_1,fav_driver_2,fav_driver_3")
      .then(({ data }) => {
        setProfiles(data ?? []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            The Grid
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Group Members
        </h1>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Loading…
        </p>
      )}

      <div className="flex flex-col gap-4">
        {profiles.map((profile) => {
          const accent = profile.fav_team_1 ? TEAM_COLORS[profile.fav_team_1] ?? null : null;
          const rgb = accent ? hexToRgb(accent) : null;

          const favTeams = [profile.fav_team_1, profile.fav_team_2, profile.fav_team_3].filter(Boolean) as string[];
          const favDrivers = [profile.fav_driver_1, profile.fav_driver_2, profile.fav_driver_3].filter(Boolean) as string[];

          return (
            <div
              key={profile.id}
              className="rounded-2xl p-5"
              style={{
                background: rgb
                  ? `linear-gradient(135deg, rgba(${rgb},0.12) 0%, rgba(8,8,16,0.8) 100%)`
                  : "rgba(26,26,26,0.8)",
                border: `1px solid ${rgb ? `rgba(${rgb},0.3)` : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <p className="text-xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
                {profile.display_name ?? (
                  <span style={{ color: "var(--muted)", fontWeight: 400 }}>Anonymous</span>
                )}
              </p>

              {favTeams.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {favTeams.map((teamId, i) => {
                    const tc = TEAM_COLORS[teamId] ?? "#888";
                    const tcRgb = hexToRgb(tc);
                    return (
                      <span
                        key={i}
                        className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: `rgba(${tcRgb},0.15)`,
                          color: tc,
                          border: `1px solid rgba(${tcRgb},0.35)`,
                        }}
                      >
                        {teamName(teamId)}
                      </span>
                    );
                  })}
                </div>
              )}

              {favDrivers.length > 0 && (
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {favDrivers.map((id) => driverName(id)).join(" · ")}
                </p>
              )}

              {favTeams.length === 0 && favDrivers.length === 0 && (
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  No favourites set yet
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
