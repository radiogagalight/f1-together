"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDb } from "@/lib/firebase/db";
import { doc, getDoc } from "firebase/firestore";
import { RACES, DRIVERS, CONSTRUCTORS } from "@/lib/data";
import { checkIsAdminUser, collectUserEmails, getAdminEmails } from "@/lib/adminAccess";
import { debugLog } from "@/lib/debugLog";
import { loadRaceResult, saveRaceResult } from "@/lib/resultsStorage";
import {
  saveClassification,
  loadClassification,
} from "@/lib/classificationStorage";
import {
  classificationFromRaceResult,
  sprintClassificationFromRaceResult,
} from "@/lib/f1Points";
import { apiFetch } from "@/lib/api/fetch";
import type {
  RaceClassification,
  RaceResult,
  RaceWildcard,
  WildcardQuestionType,
} from "@/lib/types";
import {
  loadWildcards as loadWildcardsFromStorage,
  createWildcard,
  updateWildcard,
  deleteWildcard,
} from "@/lib/wildcardStorage";

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

const NULL_OPTION_CONSTRUCTOR = "__null_constructor__";

function ConstructorSelect({ value, onChange, label }: { value: string | null; onChange: (v: string | null) => void; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: "var(--muted)" }}>{label}</label>
      <select
        value={value ?? NULL_OPTION_CONSTRUCTOR}
        onChange={(e) => onChange(e.target.value === NULL_OPTION_CONSTRUCTOR ? null : e.target.value)}
        className="px-3 py-2 text-sm rounded-lg"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--foreground)", border: "1px solid rgba(255,255,255,0.12)", outline: "none" }}
      >
        <option value={NULL_OPTION_CONSTRUCTOR} style={{ backgroundColor: "#0c0810" }}>— not set —</option>
        {CONSTRUCTORS.map((c) => (
          <option key={c.id} value={c.id} style={{ backgroundColor: "#0c0810" }}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}

export default function AdminResultsPage() {
  const { user, authReady } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedRound, setSelectedRound] = useState(1);
  const [result, setResult] = useState<Partial<RaceResult>>({});
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [classificationSummary, setClassificationSummary] = useState<string | null>(null);

  // Wildcard state
  const [wildcards, setWildcards] = useState<RaceWildcard[]>([]);
  const [wcStatus, setWcStatus] = useState<string | null>(null);
  const [newWcQuestion, setNewWcQuestion] = useState("");
  const [newWcType, setNewWcType] = useState<WildcardQuestionType>("driver");
  const [newWcPoints, setNewWcPoints] = useState(10);
  const [newWcBattleA, setNewWcBattleA] = useState<string | null>(null);
  const [newWcBattleB, setNewWcBattleB] = useState<string | null>(null);
  const [newWcBattleTeam, setNewWcBattleTeam] = useState<string | null>(null);
  const [creatingWc, setCreatingWc] = useState(false);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      void debugLog("pre-fix", "H1", "app/admin/results/page.tsx:176", "admin page auth resolved without user", {
        authReady,
      });
      setIsAdmin(false);
      return;
    }

    void getDoc(doc(getDb(), "profiles", user.uid)).then((snap) => {
      const profileIsAdmin = snap.data()?.is_admin === true;
      const emails = collectUserEmails(
        user.email,
        user.providerData.map((provider) => provider.email)
      );
      const nextIsAdmin = checkIsAdminUser(user, profileIsAdmin);
      void debugLog("pre-fix", "H1", "app/admin/results/page.tsx:182", "admin page auth evaluated", {
        authReady,
        hasUser: true,
        emailPresent: Boolean(user.email),
        emailDomain: user.email?.split("@")[1] ?? emails[0]?.split("@")[1] ?? null,
        providerEmailCount: emails.length,
        profileExists: snap.exists(),
        profileIsAdmin,
        nextIsAdmin,
      });
      setIsAdmin(nextIsAdmin);
    });
  }, [authReady, user]);

  const loadResult = useCallback(async (round: number) => {
    try {
      const data = await loadRaceResult(round, getDb());
      debugLog("pre-fix", "H4", "app/admin/results/page.tsx:193", "loadRaceResult completed", {
        round,
        found: Boolean(data),
      });
      setResult(data ?? {});
    } catch (error) {
      debugLog("pre-fix", "H4", "app/admin/results/page.tsx:199", "loadRaceResult failed", {
        round,
        error: error instanceof Error ? error.message : "unknown",
      });
      throw error;
    }
  }, []);

  const loadClassificationMeta = useCallback(async (round: number) => {
    const db = getDb();
    const [raceClas, sprintClas] = await Promise.all([
      loadClassification(round, "race", db),
      loadClassification(round, "sprint", db),
    ]);
    const parts: string[] = [];
    if (raceClas) {
      parts.push(
        `Race: ${raceClas.entries.length} drivers${raceClas.incomplete ? " (partial)" : ""}`
      );
    }
    if (sprintClas) {
      parts.push(
        `Sprint: ${sprintClas.entries.length} drivers${sprintClas.incomplete ? " (partial)" : ""}`
      );
    }
    setClassificationSummary(
      parts.length ? parts.join(" · ") : "No full classification stored"
    );
  }, []);

  const loadWildcards = useCallback(async (round: number) => {
    setWildcards(await loadWildcardsFromStorage(round, getDb()));
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadResult(selectedRound);
      loadWildcards(selectedRound);
      loadClassificationMeta(selectedRound);
    }
  }, [isAdmin, selectedRound, loadResult, loadWildcards, loadClassificationMeta]);

  if (!authReady) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center" style={{ color: "var(--muted)" }}>
        Checking access…
      </div>
    );
  }

  if (!isAdmin) {
    const signedInEmail = user?.email ?? user?.providerData[0]?.email ?? null;
    return (
      <div className="max-w-lg mx-auto px-4 pt-10 text-center">
        <p className="text-lg font-bold" style={{ color: "#e10600" }}>Not authorised</p>
        <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
          This page is for admins only.
        </p>
        {signedInEmail && (
          <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
            Signed in as {signedInEmail}
          </p>
        )}
        <p className="text-[11px] mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>
          Admin access is granted to: {getAdminEmails().join(", ")}
        </p>
      </div>
    );
  }

  const race = RACES.find((r) => r.r === selectedRound);

  function update<K extends keyof RaceResult>(key: K, value: RaceResult[K]) {
    setResult((prev) => ({ ...prev, [key]: value }));
  }

  async function seedPartialClassifications(saved: RaceResult) {
    const db = getDb();
    const existingRace = await loadClassification(saved.round, "race", db);
    const derived = classificationFromRaceResult(saved);
    // Never replace a fuller OpenF1 grid with prediction top-6
    if (
      derived &&
      (!existingRace ||
        (existingRace.incomplete &&
          existingRace.entries.length <= derived.entries.length))
    ) {
      await saveClassification(derived, db, true);
    }
    const existingSprint = await loadClassification(saved.round, "sprint", db);
    const derivedSprint = sprintClassificationFromRaceResult(saved);
    if (
      derivedSprint &&
      (!existingSprint ||
        (existingSprint.incomplete &&
          existingSprint.entries.length <= derivedSprint.entries.length))
    ) {
      await saveClassification(derivedSprint, db, true);
    }
  }

  async function handleSave() {
    setSaving(true);
    setStatusMsg(null);
    try {
      debugLog("pre-fix", "H3", "app/admin/results/page.tsx:291", "saveRaceResult starting", {
        round: selectedRound,
        keys: Object.keys(result).sort(),
      });
      await saveRaceResult(selectedRound, result, true, getDb());
      const saved = await loadRaceResult(selectedRound, getDb());
      debugLog("pre-fix", "H3", "app/admin/results/page.tsx:297", "saveRaceResult completed", {
        round: selectedRound,
        saved: Boolean(saved),
      });
      setResult(saved ?? result);
      if (saved) {
        await seedPartialClassifications(saved);
        await loadClassificationMeta(selectedRound);
      }
      setStatusMsg("Overrides saved.");
    } catch (error) {
      debugLog("pre-fix", "H3", "app/admin/results/page.tsx:307", "saveRaceResult failed", {
        round: selectedRound,
        error: error instanceof Error ? error.message : "unknown",
      });
      setStatusMsg("Save failed. Try again.");
    }
    setSaving(false);
  }

  async function handleSyncClassification() {
    setSyncing(true);
    setStatusMsg(null);
    try {
      debugLog("pre-fix", "H5", "app/admin/results/page.tsx:318", "sync classification request starting", {
        round: selectedRound,
      });
      const res = await apiFetch("/api/classifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ round: selectedRound }),
      });
      const json = (await res.json()) as {
        error?: string;
        classifications?: RaceClassification[];
      };
      if (!res.ok) {
        debugLog("pre-fix", "H5", "app/admin/results/page.tsx:329", "sync classification request failed", {
          round: selectedRound,
          status: res.status,
          error: json.error ?? "unknown",
        });
        setStatusMsg(json.error ?? "OpenF1 sync failed.");
      } else {
        const n = json.classifications?.length ?? 0;
        debugLog("pre-fix", "H5", "app/admin/results/page.tsx:336", "sync classification request completed", {
          round: selectedRound,
          classifications: n,
        });
        setStatusMsg(
          n > 0
            ? `Synced ${n} classification${n === 1 ? "" : "s"} from OpenF1.`
            : "OpenF1 returned no data."
        );
        await loadClassificationMeta(selectedRound);
      }
    } catch {
      setStatusMsg("OpenF1 sync failed.");
    }
    setSyncing(false);
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
          <DriverSelect label="P4"          value={(result.raceP4     ?? null) as string | null} onChange={(v) => update("raceP4",     v)} />
          <DriverSelect label="P5"          value={(result.raceP5     ?? null) as string | null} onChange={(v) => update("raceP5",     v)} />
          <DriverSelect label="P6"          value={(result.raceP6     ?? null) as string | null} onChange={(v) => update("raceP6",     v)} />
          <DriverSelect label="Fastest Lap" value={(result.fastestLap ?? null) as string | null} onChange={(v) => update("fastestLap", v)} />
          <BoolSelect   label="Safety Car"  value={(result.safetyCar  ?? null) as boolean | null} onChange={(v) => update("safetyCar",  v)} />
        </div>
      </section>

      {/* Wildcards & Battles */}
      <section className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-block w-1 h-5 rounded-full shrink-0" style={{ backgroundColor: "#9664ff" }} />
          <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: "var(--foreground)" }}>
            Wild Cards &amp; Battles
          </h2>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "rgba(150,100,255,0.15)", color: "#9664ff", border: "1px solid rgba(150,100,255,0.35)" }}
          >
            {wildcards.length}/5
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: "rgba(150,100,255,0.2)" }} />
        </div>

        {/* Existing wildcards */}
        {wildcards.length > 0 && (
          <div className="flex flex-col gap-3 mb-4">
            {wildcards.map((wc) => (
              <div
                key={wc.id}
                className="rounded-xl p-3"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{wc.question}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>
                      {wc.questionType} · {wc.points} pts
                      {wc.questionType === "battle" && wc.options && ` · ${wc.options[0]?.name} vs ${wc.options[1]?.name}`}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this wildcard? All user predictions for it will be lost.")) return;
                      setWcStatus(null);
                      try {
                        await deleteWildcard(wc.id, getDb());
                        setWcStatus("Deleted.");
                        loadWildcards(selectedRound);
                      } catch {
                        setWcStatus("Delete failed.");
                      }
                    }}
                    className="text-xs px-2 py-1 rounded-lg shrink-0"
                    style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
                  >
                    Delete
                  </button>
                </div>

                {/* Set correct answer */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    Correct Answer {wc.correctAnswer ? `(set: ${wc.correctAnswer})` : "(not set)"}
                  </label>
                  {wc.questionType === "boolean" ? (
                    <div className="flex gap-2">
                      {["yes", "no"].map((v) => (
                        <button
                          key={v}
                          onClick={async () => {
                            await updateWildcard(wc.id, { correctAnswer: v }, getDb());
                            loadWildcards(selectedRound);
                          }}
                          className="px-3 py-1 text-xs font-semibold rounded-lg"
                          style={{
                            backgroundColor: wc.correctAnswer === v ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.06)",
                            color: wc.correctAnswer === v ? "#22c55e" : "var(--muted)",
                            border: wc.correctAnswer === v ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {v === "true" ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  ) : wc.questionType === "battle" && wc.options ? (
                    <div className="flex gap-2">
                      {wc.options.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={async () => {
                            await updateWildcard(wc.id, { correctAnswer: opt.id }, getDb());
                            loadWildcards(selectedRound);
                          }}
                          className="px-3 py-1 text-xs font-semibold rounded-lg"
                          style={{
                            backgroundColor: wc.correctAnswer === opt.id ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.06)",
                            color: wc.correctAnswer === opt.id ? "#22c55e" : "var(--muted)",
                            border: wc.correctAnswer === opt.id ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          {opt.name}
                        </button>
                      ))}
                    </div>
                  ) : wc.questionType === "constructor" ? (
                    <ConstructorSelect
                      label=""
                      value={wc.correctAnswer}
                      onChange={async (v) => {
                        await updateWildcard(wc.id, { correctAnswer: v }, getDb());
                        loadWildcards(selectedRound);
                      }}
                    />
                  ) : (
                    <DriverSelect
                      label=""
                      value={wc.correctAnswer}
                      onChange={async (v) => {
                        await updateWildcard(wc.id, { correctAnswer: v }, getDb());
                        loadWildcards(selectedRound);
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create new wildcard */}
        {wildcards.length < 5 && (
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-xs font-semibold mb-3" style={{ color: "var(--muted)" }}>Add new question</p>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Type</label>
                  <select
                    value={newWcType}
                    onChange={(e) => {
                      setNewWcType(e.target.value as WildcardQuestionType);
                      setNewWcBattleTeam(null);
                      setNewWcBattleA(null);
                      setNewWcBattleB(null);
                    }}
                    className="px-3 py-2 text-sm rounded-lg"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--foreground)", border: "1px solid rgba(255,255,255,0.12)", outline: "none" }}
                  >
                    <option value="driver" style={{ backgroundColor: "#0c0810" }}>Driver pick</option>
                    <option value="constructor" style={{ backgroundColor: "#0c0810" }}>Constructor pick</option>
                    <option value="boolean" style={{ backgroundColor: "#0c0810" }}>Yes / No</option>
                    <option value="battle" style={{ backgroundColor: "#0c0810" }}>Teammate battle</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Points</label>
                  <input
                    type="number"
                    value={newWcPoints}
                    onChange={(e) => setNewWcPoints(parseInt(e.target.value) || 10)}
                    className="px-3 py-2 text-sm rounded-lg w-20"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--foreground)", border: "1px solid rgba(255,255,255,0.12)", outline: "none" }}
                  />
                </div>
              </div>

              {newWcType === "battle" ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Team</label>
                    <select
                      value={newWcBattleTeam ?? ""}
                      onChange={(e) => {
                        const teamId = e.target.value || null;
                        setNewWcBattleTeam(teamId);
                        if (teamId) {
                          const c = CONSTRUCTORS.find((c) => c.id === teamId);
                          const teamDrivers = DRIVERS.filter((d) =>
                            d.team.toLowerCase().replace(/\s+/g, "-") === teamId
                          );
                          setNewWcBattleA(teamDrivers[0]?.id ?? null);
                          setNewWcBattleB(teamDrivers[1]?.id ?? null);
                          setNewWcQuestion(c ? `Which ${c.name} driver finishes higher in the race?` : "");
                        } else {
                          setNewWcBattleA(null);
                          setNewWcBattleB(null);
                          setNewWcQuestion("");
                        }
                      }}
                      className="px-3 py-2 text-sm rounded-lg"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--foreground)", border: "1px solid rgba(255,255,255,0.12)", outline: "none" }}
                    >
                      <option value="" style={{ backgroundColor: "#0c0810" }}>— pick a team —</option>
                      {CONSTRUCTORS.map((c) => (
                        <option key={c.id} value={c.id} style={{ backgroundColor: "#0c0810" }}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {newWcBattleTeam && (
                    <div
                      className="rounded-lg px-3 py-2 text-sm"
                      style={{ backgroundColor: "rgba(150,100,255,0.08)", border: "1px solid rgba(150,100,255,0.2)", color: "rgba(150,100,255,0.9)" }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: "rgba(150,100,255,0.6)" }}>Question</span>
                      {newWcQuestion}
                    </div>
                  )}
                  {newWcBattleTeam && newWcBattleA && newWcBattleB && (
                    <div className="flex gap-2">
                      <span
                        className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--muted)" }}
                      >
                        {DRIVERS.find((d) => d.id === newWcBattleA)?.name}
                      </span>
                      <span className="text-xs font-bold self-center" style={{ color: "var(--muted)" }}>vs</span>
                      <span
                        className="flex-1 text-center text-xs font-semibold py-1.5 rounded-lg"
                        style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--muted)" }}
                      >
                        {DRIVERS.find((d) => d.id === newWcBattleB)?.name}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  placeholder="Question text…"
                  value={newWcQuestion}
                  onChange={(e) => setNewWcQuestion(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--foreground)", border: "1px solid rgba(255,255,255,0.12)", outline: "none" }}
                />
              )}

              <button
                onClick={async () => {
                  if (newWcType === "battle") {
                    if (!newWcBattleTeam) { setWcStatus("Pick a team for the battle."); return; }
                    if (!newWcBattleA || !newWcBattleB) { setWcStatus("Could not find two drivers for that team."); return; }
                  } else {
                    if (!newWcQuestion.trim()) { setWcStatus("Enter a question."); return; }
                  }
                  setCreatingWc(true); setWcStatus(null);
                  const battleOptions = newWcType === "battle"
                    ? [
                        { id: newWcBattleA!, name: DRIVERS.find(d => d.id === newWcBattleA)?.name ?? newWcBattleA! },
                        { id: newWcBattleB!, name: DRIVERS.find(d => d.id === newWcBattleB)?.name ?? newWcBattleB! },
                      ]
                    : null;
                  try {
                    await createWildcard(
                      selectedRound,
                      {
                        question: newWcQuestion.trim(),
                        questionType: newWcType,
                        options: battleOptions,
                        points: newWcPoints,
                        displayOrder: wildcards.length,
                      },
                      getDb()
                    );
                    setNewWcQuestion(""); setNewWcBattleA(null); setNewWcBattleB(null);
                    setNewWcBattleTeam(null); setNewWcPoints(10);
                    setWcStatus("Question added.");
                    loadWildcards(selectedRound);
                  } catch {
                    setWcStatus("Failed to add question.");
                  }
                  setCreatingWc(false);
                }}
                disabled={creatingWc}
                className="py-2 text-sm font-semibold rounded-xl"
                style={{ backgroundColor: creatingWc ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)", color: "var(--foreground)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                {creatingWc ? "Adding…" : "+ Add Question"}
              </button>
            </div>
          </div>
        )}

        {wcStatus && (
          <p className="text-sm mt-2" style={{ color: wcStatus.toLowerCase().includes("fail") || wcStatus.toLowerCase().includes("delete") ? "#ef4444" : "#22c55e" }}>
            {wcStatus}
          </p>
        )}
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

      {/* Championship classification */}
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
          Season results grid
        </h2>
        <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
          {classificationSummary ?? "…"}
        </p>
        <p className="text-[11px] mb-3 leading-relaxed" style={{ color: "var(--muted)" }}>
          Saving prediction slots also seeds a partial grid for Results. Sync from OpenF1 for the
          full finishing order and accurate championship points.
        </p>
        <button
          type="button"
          onClick={() => void handleSyncClassification()}
          disabled={syncing}
          className="w-full py-2.5 text-sm font-semibold rounded-xl mb-2"
          style={{
            backgroundColor: syncing ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)",
            color: "var(--foreground)",
            border: "1px solid rgba(255,255,255,0.14)",
          }}
        >
          {syncing ? "Syncing from OpenF1…" : "Sync classification from OpenF1"}
        </button>
      </section>

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="flex-1 py-3 text-sm font-semibold rounded-xl"
          style={{
            backgroundColor: saving ? "rgba(255,255,255,0.06)" : "#e10600",
            color: "#fff",
          }}
        >
          {saving ? "Saving…" : "Save Results"}
        </button>
      </div>

      {statusMsg && (
        <p
          className="text-sm text-center mb-4"
          style={{
            color:
              statusMsg.toLowerCase().includes("fail") ||
              statusMsg.toLowerCase().includes("no data") ||
              statusMsg.toLowerCase().includes("returned no")
                ? "#ef4444"
                : "#22c55e",
          }}
        >
          {statusMsg}
        </p>
      )}

      {result.updatedAt && (
        <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
          Last updated: {new Date(result.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
