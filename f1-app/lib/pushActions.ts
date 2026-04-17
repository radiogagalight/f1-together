"use server";

import webpush from "web-push";
import { getAdminDb } from "@/lib/firebase/admin";

webpush.setVapidDetails(
  "mailto:f1together@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url: string
) {
  const db = getAdminDb();
  const snap = await db.collection("push_subscriptions").doc(userId).get();
  const subscription = snap.data()?.subscription as webpush.PushSubscription | undefined;
  if (!subscription) return;

  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title, body, url }));
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "statusCode" in err) {
      const statusCode = (err as { statusCode: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await db.collection("push_subscriptions").doc(userId).delete();
      } else {
        console.error(`[push] Failed to send notification to ${userId}:`, err);
      }
    } else {
      console.error(`[push] Failed to send notification to ${userId}:`, err);
    }
  }
}
