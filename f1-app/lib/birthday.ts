"use client";

import { useSyncExternalStore } from "react";

/**
 * Sarah's birthday (Oct 2) lands on the Bahrain GP weekend. The celebration
 * shows until midnight US Central on the day after the race:
 * Mon 2026-10-05 00:00 CDT = 05:00 UTC.
 */
export const BIRTHDAY_END_UTC = Date.parse("2026-10-05T05:00:00Z");

export function isBirthdayActive(now = Date.now()): boolean {
  return now < BIRTHDAY_END_UTC;
}

function subscribe(onChange: () => void) {
  const remaining = BIRTHDAY_END_UTC - Date.now();
  if (remaining <= 0) return () => {};
  // Re-check exactly at the cutoff so an open tab hides the celebration live.
  const id = setTimeout(onChange, remaining + 50);
  return () => clearTimeout(id);
}

/** Client-only check (server renders false to avoid hydration mismatch); switches off live at the cutoff. */
export function useBirthdayActive(): boolean {
  return useSyncExternalStore(subscribe, () => isBirthdayActive(), () => false);
}
