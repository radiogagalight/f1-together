"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { RACES, DRIVERS } from "@/lib/data";
import type { RaceResult } from "@/lib/types";

const NULL_OPTION = "__null__";

function DriverSelect({
  value,
  onChange,
  label,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
        {label}
      </label>
      <select
        value={value ?? NULL_OPTION}
        onChange={(e) => onChange(e.target.value === NULL_OPTION ? null : e.target.value)}
        className="px-3 py-2 text-sm rounded-lg"
        style={{
          backgroundColor: "rgba(255,255,255,0.06)",
          color: "var(--foreground)",
          border: "1px solid rgba(255,255,255,0.12)",
          outline: "none",
        }}
      >
        <option value={NULL_OPTION} style={{ backgroundColor: "#0c0810" }}>— not set —</option>
        {DRIVERS.map((d) => (
          <option key={d.id} value={d.id} style={{ backgroundColor: "#0c0810" }}>
            {d.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function BoolSelect({
  value,
  onChange,
  label,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  label: string;
}) {
  const strVal = value === null ? NULL_OPTION : value ? "true" : "false";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
        {label}
      </label>
      <select
        value={strVal}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === NULL_OPTION ? null : v === "true");
        }}
        className="px-3 py-2 text-sm rounded-lg"
        style={{
          backgroundColor: "rgba(255,255,255,0.06)",
          color: "var(--foreground)",
          border: "1px solid rgba(255,255,255,0.12)",
          outline: "none",
        }}
      >
        <option value={NULL_OPTION} style={{ backgroundColor: "#0c0810" }}>— not set —</option>
        <option value="true" style={{ backgroundColor: "#0c0810" }}>Yes</option>
        <option value="false" style={{ backgroundColor: "#0c0810" }}>No</option>
      </select>
    </div>
  );
}

export default function AdminResultsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [selectedRound, setSelectedRound] = useState(1);
  const [result, setResult] = useState<Partial<RaceResult>>({});
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const supabase = createClient();

  // Admin check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setIsAdmin(false); return; }
      supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => setIsAdmin(data?.is_admin === true));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadResult = useCallback(async (round: number) => {
    const res = await fetch(`/api/results/${round}`);
    if (res.ok) {
      const data = await res.json();
      setResult(data);
    } else {
      setResult({});
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadResult(selectedRound);
  }, [isAdmin, selectedRound, loadResult]);

  if (isAdmin === null) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center" style={{ color: "var(--muted)" }}>
        Checking access…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center">
        <p className="text-lg font-bold" style={{ color: "#e10600" }}>Not authorised</p>
        <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
          This page is for admins only.
        </p>
      </div>
    );
  }

  const race = RACES.find((r) => r.r === selectedRound);

  function update<K extends keyof RaceResult>(key: K, value: RaceResult[K]) {
    setResult((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFetch() {
    setFetching(true);
    setStatusMsg(null);
    const res = await fetch(`/api/results/${selectedRound}`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setResult(data);
      setStatusMsg("Fetched from OpenF1 successfully.");
    } else {
      setStatusMsg("Failed to fetch from OpenF1. Try again.");
    }
    setFetching(false);
  }

  async function handleSave() {
    setSaving(true);
    setStatusMsg(null);
    const res = await fetch(`/api/results/${selectedRound}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    if (res.ok) {
      const data = await res.json();
      setResult(data);
      setStatusMsg("Overrides saved.");
    } else {
      setStatusMsg("Save failed. Try again.");
    }
    setSaving(false);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block h-1 w-8 rounded-full" style={{ backgroundColor: "#e10600" }} />
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Admin
          </span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Race Results</h1>
      </div>

      {/* Round picker */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 mb-6"
        style={{ scrollbarWidth: "none" }}
      >
        {RACES.map((r) => (
          <button
            key={r.r}
            onClick={() => { setSelectedRound(r.r); setStatusMsg(null); }}
            className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full"
            style={{
              backgroundColor: selectedRound === r.r ? "var(--team-accent)" : "rgba(255,255,255,0.06)",
              color: selectedRound === r.r ? "#fff" : "var(--muted)",
              border: selectedRound === r.r ? "none" : "1px solid rgba(255,255,255,0.1)",
            }}
          >
            R{r.r}
          </button>
        ))}
      </div>

      {/* Race name */}
      <p className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
        {race?.flag} {race?.name}
        {race?.sprint && (
          <span
            className="ml-2 text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ backgroundColor: "rgba(225,6,0,0.15)", color: "#e10600" }}
          >
            Sprint
          </span>
        )}
      </p>

      {/* Qualifying */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          Qualifying
        </h2>
        <div className="flex flex-col gap-3">
          <DriverSelect label="Pole" value={(result.qualPole ?? null) as string | null} onChange={(v) => update("qualPole", v)} />
          <DriverSelect label="P2"   value={(result.qualP2   ?? null) as string | null} onChange={(v) => update("qualP2",   v)} />
          <DriverSelect label="P3"   value={(result.qualP3   ?? null) as string | null} onChange={(v) => update("qualP3",   v)} />
        </div>
      </section>

      {/* Race */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          Race
        </h2>
        <div className="flex flex-col gap-3">
          <DriverSelect label="Winner"      value={(result.raceWinner ?? null) as string | null} onChange={(v) => update("raceWinner", v)} />
          <DriverSelect label="P2"          value={(result.raceP2     ?? null) as string | null} onChange={(v) => update("raceP2",     v)} />
          <DriverSelect label="P3"          value={(result.raceP3     ?? null) as string | null} onChange={(v) => update("raceP3",     v)} />
          <DriverSelect label="Fastest Lap" value={(result.fastestLap ?? null) as string | null} onChange={(v) => update("fastestLap", v)} />
          <BoolSelect   label="Safety Car"  value={(result.safetyCar  ?? null) as boolean | null} onChange={(v) => update("safetyCar",  v)} />
        </div>
      </section>

      {/* Sprint */}
      {race?.sprint && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
            Sprint Qualifying
          </h2>
          <div className="flex flex-col gap-3">
            <DriverSelect label="Pole" value={(result.sprintQualPole ?? null) as string | null} onChange={(v) => update("sprintQualPole", v)} />
            <DriverSelect label="P2"   value={(result.sprintQualP2   ?? null) as string | null} onChange={(v) => update("sprintQualP2",   v)} />
            <DriverSelect label="P3"   value={(result.sprintQualP3   ?? null) as string | null} onChange={(v) => update("sprintQualP3",   v)} />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-widest mt-5 mb-3" style={{ color: "var(--muted)" }}>
            Sprint Race
          </h2>
          <div className="flex flex-col gap-3">
            <DriverSelect label="Winner" value={(result.sprintWinner ?? null) as string | null} onChange={(v) => update("sprintWinner", v)} />
            <DriverSelect label="P2"     value={(result.sprintP2     ?? null) as string | null} onChange={(v) => update("sprintP2",     v)} />
            <DriverSelect label="P3"     value={(result.sprintP3     ?? null) as string | null} onChange={(v) => update("sprintP3",     v)} />
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleFetch}
          disabled={fetching}
          className="flex-1 py-3 text-sm font-semibold rounded-xl"
          style={{
            backgroundColor: fetching ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)",
            color: fetching ? "var(--muted)" : "var(--foreground)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {fetching ? "Fetching…" : "Fetch from OpenF1"}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 text-sm font-semibold rounded-xl"
          style={{
            backgroundColor: saving ? "rgba(255,255,255,0.06)" : "#e10600",
            color: "#fff",
          }}
        >
          {saving ? "Saving…" : "Save Overrides"}
        </button>
      </div>

      {statusMsg && (
        <p className="text-sm text-center mb-4" style={{ color: statusMsg.includes("fail") || statusMsg.includes("Failed") ? "#ef4444" : "#22c55e" }}>
          {statusMsg}
        </p>
      )}

      {/* Metadata */}
      <div
        className="rounded-xl p-4 text-xs"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p style={{ color: "var(--muted)" }}>
          <span className="font-semibold">Fetched at:</span>{" "}
          {result.fetchedAt ? new Date(result.fetchedAt).toLocaleString() : "—"}
        </p>
        <p className="mt-1" style={{ color: "var(--muted)" }}>
          <span className="font-semibold">Manually overridden:</span>{" "}
          {result.manuallyOverridden ? "Yes" : "No"}
        </p>
        {result.updatedAt && (
          <p className="mt-1" style={{ color: "var(--muted)" }}>
            <span className="font-semibold">Last updated:</span>{" "}
            {new Date(result.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
