"use client";

import { useState, useEffect, useCallback } from "react";
import type { RacePick } from "@/lib/types";
import { loadRacePick, saveRacePick } from "@/lib/raceStorage";
import { createClient } from "@/lib/supabase/client";

export function useRacePick(userId: string | undefined, round: number) {
  const [picks, setPicks] = useState<RacePick | null>(null);
  const [savedField, setSavedField] = useState<keyof RacePick | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadRacePick(userId, round, supabase).then((data) => {
      setPicks(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, round]);

  const setPick = useCallback(
    (field: keyof RacePick, value: string | boolean) => {
      if (!userId) return;

      // Optimistic update — save latest picks inside setState callback
      // so we always have the current state, not a stale closure.
      setPicks((prev) => {
        const updated: RacePick = prev
          ? { ...prev, [field]: value }
          : {
              qualPole: null, qualP2: null, qualP3: null,
              raceWinner: null, raceP2: null, raceP3: null,
              fastestLap: null, safetyCar: null,
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

  return { picks, setPick, savedField, loading };
}
