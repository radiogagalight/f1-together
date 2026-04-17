import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function ensureApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!json) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY is required (JSON string of your Firebase service account private key)."
    );
  }
  return initializeApp({
    credential: cert(JSON.parse(json) as Parameters<typeof cert>[0]),
  });
}

export function getAdminAuth(): Auth {
  return getAuth(ensureApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(ensureApp());
}
