import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { firebaseClientConfig } from "./config";

export function getFirebaseApp(): FirebaseApp {
  if (!getApps().length) {
    return initializeApp(firebaseClientConfig);
  }
  return getApp();
}
