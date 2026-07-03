import type { Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/pushActions";
import { RACES } from "@/lib/data";

const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000; // 24h before FP1

export interface ReminderRunResult {
  round: number;
  raceName: string;
  sent: number;
  skippedAlreadySent: boolean;
}

function pickDocId(userId: string, round: number): string {
  return `${userId}_${round}`;
}

/** Races that are within their "weekend starting soon" reminder window right now. */
function racesDueForReminder(now: Date): typeof RACES {
  const nowMs = now.getTime();
  return RACES.filter((race) => {
    if (!race.weekendStartUtc) return false;
    const reminderAt = new Date(race.weekendStartUtc).getTime() - REMINDER_LEAD_MS;
    const raceStartMs = new Date(race.startUtc).getTime();
    return nowMs >= reminderAt && nowMs < raceStartMs;
  });
}

async function hasReminderBeenSent(round: number, db: Firestore): Promise<boolean> {
  const snap = await db.collection("race_notification_state").doc(String(round)).get();
  return Boolean(snap.data()?.weekendReminderSentAt);
}

async function markReminderSent(round: number, db: Firestore): Promise<void> {
  await db.collection("race_notification_state").doc(String(round)).set(
    { round, weekendReminderSentAt: new Date().toISOString() },
    { merge: true }
  );
}

/** uids of push-subscribed users who have not made any picks yet for this round. */
async function getUnpredictedSubscriberIds(round: number, db: Firestore): Promise<string[]> {
  const subsSnap = await db.collection("push_subscriptions").get();
  const uids = subsSnap.docs.map((d) => d.id);
  if (uids.length === 0) return [];

  const pickSnaps = await Promise.all(
    uids.map((uid) => db.collection("race_picks").doc(pickDocId(uid, round)).get())
  );

  return uids.filter((_, i) => !pickSnaps[i].exists);
}

/**
 * Checks every race for a due, not-yet-sent "weekend starting" reminder and sends it
 * to push-subscribed users who haven't made any picks for that race yet.
 * Safe to call repeatedly (e.g. hourly/daily via cron) — idempotent per race.
 */
export async function sendWeekendReminders(now: Date = new Date()): Promise<ReminderRunResult[]> {
  const db = getAdminDb();
  const dueRaces = racesDueForReminder(now);
  const results: ReminderRunResult[] = [];

  for (const race of dueRaces) {
    const alreadySent = await hasReminderBeenSent(race.r, db);
    if (alreadySent) {
      results.push({ round: race.r, raceName: race.name, sent: 0, skippedAlreadySent: true });
      continue;
    }

    const uids = await getUnpredictedSubscriberIds(race.r, db);
    const title = `🏁 ${race.name} weekend is here!`;
    const body = "Lock in your predictions before lights out.";
    const url = `/predictions/race/${race.r}`;

    await Promise.all(uids.map((uid) => sendPushToUser(uid, title, body, url)));
    await markReminderSent(race.r, db);

    results.push({ round: race.r, raceName: race.name, sent: uids.length, skippedAlreadySent: false });
  }

  return results;
}
