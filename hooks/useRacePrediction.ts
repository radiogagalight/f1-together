"use client";

import { useState, useEffect, useCallback } from "react";
import type { RacePrediction } from "@/lib/types";
import { loadRacePick, saveRacePick } from "@/lib/raceStorage";
import { createClient } from "@/lib/supabase/client";

export function useRacePrediction(userId: string | undefined, round: number) {
  const [predictions, setPredictions] = useState<RacePrediction | null>(null);
  const [savedField, setSavedField] = useState<keyof RacePrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadRacePick(userId, round, supabase).then((data) => {
      setPredictions(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, round]);

  const setPrediction = useCallback(
    (field: keyof RacePrediction, value: string | boolean | null) => {
      if (!userId) return;

      // Optimistic update — save latest predictions inside setState callback
      // so we always have the current state, not a stale closure.
      setPredictions((prev) => {
        const updated: RacePrediction = prev
          ? { ...prev, [field]: value }
          : {
              qualPole: null, qualP2: null, qualP3: null,
              raceWinner: null, raceP2: null, raceP3: null,
              raceP4: null, raceP5: null, raceP6: null,
              fastestLap: null, safetyCar: null,
              boostedPredictions: [],
              sprintQualPole: null, sprintQualP2: null, sprintQualP3: null,
              sprintWinner: null, sprintP2: null, sprintP3: null,
              [field]: value,
            };
        saveRacePick(userId, round, updated, supabase);
        return updated;
      });

      setSavedField(field);
      setTimeout(() => setSavedField(null), 1500);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, round]
  );

  const toggleBoost = useCallback(
    (field: string, wildcardBoostedCount: number) => {
      if (!userId) return;
      setPredictions((prev) => {
        if (!prev) return prev;
        const current = prev.boostedPredictions ?? [];
        const alreadyBoosted = current.includes(field);
        const totalUsed = current.length + wildcardBoostedCount;
        if (!alreadyBoosted && totalUsed >= 1) return prev; // no slots left
        const updated: RacePrediction = {
          ...prev,
          boostedPredictions: alreadyBoosted
            ? current.filter((f) => f !== field)
            : [...current, field],
        };
        saveRacePick(userId, round, updated, supabase);
        return updated;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, round]
  );

  return { predictions, setPrediction, toggleBoost, savedField, loading };
}
