import { getAuth } from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase/app";

/**
 * Same-origin API calls authenticated with the Firebase session cookie and a
 * Bearer ID token. The Bearer header covers clients where the session cookie
 * is missing (common on iOS Safari / home-screen PWAs).
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const user = getAuth(getFirebaseApp()).currentUser;

  async function send(forceRefresh: boolean): Promise<Response> {
    if (user) {
      const idToken = await user.getIdToken(forceRefresh);
      headers.set("Authorization", `Bearer ${idToken}`);
    }
    return fetch(input, { ...init, headers, credentials: "include" });
  }

  const res = await send(false);
  if (res.status === 401 && user) {
    return send(true);
  }
  return res;
}
