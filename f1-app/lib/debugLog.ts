import { addDoc, collection } from "firebase/firestore";
import { getDb } from "@/lib/firebase/db";

const SESSION_ID = "63ed1e";

export async function debugLog(
  runId: string,
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
): Promise<void> {
  const payload = {
    sessionId: SESSION_ID,
    runId,
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  };

  // #region agent log
  fetch("/api/debug-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});

  try {
    await addDoc(collection(getDb(), "agent_debug_logs"), payload);
  } catch {
    // Ignore Firestore debug write failures.
  }
  // #endregion
}
