"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDb } from "@/lib/firebase/db";
import { loadSeasonResultsPayload } from "@/lib/seasonResults";
import type { SeasonResultsPayload } from "@/lib/types";

export function useSeasonResults() {
  const { user, authReady } = useAuth();
  const [data, setData] = useState<SeasonResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    if (!user) {
      setData(null);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const payload = await loadSeasonResultsPayload(getDb());
      setData(payload);
    } catch {
      setError(true);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authReady) return;
    void reload();
  }, [authReady, reload]);

  return { data, loading: !authReady || loading, error, reload };
}
