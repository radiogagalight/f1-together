import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE = "__session";

/**
 * Resolve the signed-in user from the Firebase session cookie and/or
 * Authorization: Bearer <idToken>. Bearer is required on clients (e.g. iOS
 * Safari/PWA) where the httpOnly session cookie may be missing even though
 * Firebase client auth is active.
 */
export async function getSessionUid(request?: Request): Promise<string | null> {
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  if (session) {
    try {
      const decoded = await getAdminAuth().verifySessionCookie(session, true);
      return decoded.uid;
    } catch {
      // Fall through to Bearer token.
    }
  }

  const authHeader = request?.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const idToken = authHeader.slice("Bearer ".length).trim();
    if (!idToken) return null;
    try {
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      return decoded.uid;
    } catch {
      return null;
    }
  }

  return null;
}

export { SESSION_COOKIE };
