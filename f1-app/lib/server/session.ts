import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";

const SESSION_COOKIE = "__session";

export async function getSessionUid(): Promise<string | null> {
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(session, true);
    return decoded.uid;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE };
