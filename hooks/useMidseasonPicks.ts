"use client";

import { useState, useEffect, useCallback } from "react";
import type { MidseasonPicks } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const DEFAULT: MidseasonPicks = { wdcWinner: null, wccWinner: null };

export function useMidseasonPicks(userId: string | undefined) {
  const [picks, setPicks] = useState<MidseasonPicks | null>(null);
  const [savedKey, setSavedKey] = useState<keyof MidseasonPicks | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    supabase
      .from("midseason_picks")
      .select("wdc_winner,wcc_winner")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setPicks(data ? { wdcWinner: data.wdc_winner ?? null, wccWinner: data.wcc_winner ?? null } : { ...DEFAULT });
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const setPick = useCallback(
    (key: keyof MidseasonPicks, value: string | null) => {
      if (!userId) return;
      setPicks((prev) => (prev ? { ...prev, [key]: value } : prev));
      if (value !== null) {
        setSavedKey(key);
        setTimeout(() => setSavedKey(null), 1500);
      }
      const col = key === "wdcWinner" ? "wdc_winner" : "wcc_winner";
      supabase.from("midseason_picks").upsert(
        { user_id: userId, [col]: value, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  return { picks, setPick, savedKey, loading };
}
