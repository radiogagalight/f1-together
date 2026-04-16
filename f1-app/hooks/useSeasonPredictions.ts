"use client";

import { useState, useEffect, useCallback } from "react";
import type { SeasonPredictions } from "@/lib/types";
import { loadPredictions, savePrediction } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

export function useSeasonPredictions(userId: string | undefined) {
  const [predictions, setPredictions] = useState<SeasonPredictions | null>(null);
  const [savedKey, setSavedKey] = useState<keyof SeasonPredictions | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadPredictions(userId, supabase).then((data) => {
      setPredictions(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const setPrediction = useCallback(
    (key: keyof SeasonPredictions, value: string | null) => {
      if (!userId) return;

      // Optimistic update
      setPredictions((prev) => {
        if (!prev) return prev;
        return { ...prev, [key]: value };
      });

      // Flash "Saved ✓" immediately (only when picking, not deselecting)
      if (value !== null) {
        setSavedKey(key);
        setTimeout(() => setSavedKey(null), 1500);
      }

      // Background save to Supabase
      savePrediction(userId, key, value, supabase);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  return { predictions, setPrediction, savedKey, loading };
}
