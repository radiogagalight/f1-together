"use client";

import { useState, useEffect, useCallback } from "react";
import type { SeasonPicks } from "@/lib/types";
import { loadPicks, savePick } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

export function useSeasonPicks(userId: string | undefined) {
  const [picks, setPicks] = useState<SeasonPicks | null>(null);
  const [savedKey, setSavedKey] = useState<keyof SeasonPicks | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    loadPicks(userId, supabase).then((data) => {
      setPicks(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const setPick = useCallback(
    (key: keyof SeasonPicks, value: string) => {
      if (!userId) return;

      // Optimistic update
      setPicks((prev) => {
        if (!prev) return prev;
        return { ...prev, [key]: value };
      });

      // Flash "Saved ✓" immediately
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 1500);

      // Background save to Supabase
      savePick(userId, key, value, supabase);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId]
  );

  return { picks, setPick, savedKey, loading };
}
