"use client";

import { useState, useEffect, useCallback } from "react";
import type { SeasonPredictions } from "@/lib/types";
import { loadPredictions, savePrediction } from "@/lib/storage";
import { getDb } from "@/lib/firebase/db";

export function useSeasonPredictions(userId: string | undefined) {
  const [predictions, setPredictions] = useState<SeasonPredictions | null>(null);
  const [savedKey, setSavedKey] = useState<keyof SeasonPredictions | null>(null);
  const [loading, setLoading] = useState(true);
  const db = getDb();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadPredictions(userId, db).then((data) => {
      setPredictions(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const setPrediction = useCallback(
    (key: keyof SeasonPredictions, value: string | null) => {
      if (!userId) return;

      setPredictions((prev) => {
        if (!prev) return prev;
        return { ...prev, [key]: value };
      });

      if (value !== null) {
        setSavedKey(key);
        setTimeout(() => setSavedKey(null), 1500);
      }

      savePrediction(userId, key, value, db);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  return { predictions, setPrediction, savedKey, loading };
}
