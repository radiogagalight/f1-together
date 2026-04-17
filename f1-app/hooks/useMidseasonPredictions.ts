"use client";

import { useState, useEffect, useCallback } from "react";
import type { MidseasonPredictions } from "@/lib/types";
import { getDb } from "@/lib/firebase/db";
import { doc, getDoc, setDoc } from "firebase/firestore";

const DEFAULT: MidseasonPredictions = { wdcWinner: null, wccWinner: null };

export function useMidseasonPredictions(userId: string | undefined) {
  const [predictions, setPredictions] = useState<MidseasonPredictions | null>(null);
  const [savedKey, setSavedKey] = useState<keyof MidseasonPredictions | null>(null);
  const [loading, setLoading] = useState(true);
  const db = getDb();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getDoc(doc(db, "midseason_picks", userId)).then((snap) => {
      const data = snap.data();
      setPredictions(
        data
          ? {
              wdcWinner: (data.wdc_winner as string | null) ?? null,
              wccWinner: (data.wcc_winner as string | null) ?? null,
            }
          : { ...DEFAULT }
      );
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const setPrediction = useCallback(
    (key: keyof MidseasonPredictions, value: string | null) => {
      if (!userId) return;
      setPredictions((prev) => (prev ? { ...prev, [key]: value } : prev));
      if (value !== null) {
        setSavedKey(key);
        setTimeout(() => setSavedKey(null), 1500);
      }
      const col = key === "wdcWinner" ? "wdc_winner" : "wcc_winner";
      setDoc(
        doc(db, "midseason_picks", userId),
        {
          user_id: userId,
          [col]: value,
          updated_at: new Date().toISOString(),
        },
        { merge: true }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  return { predictions, setPrediction, savedKey, loading };
}
