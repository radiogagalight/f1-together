import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { checkIsAdmin } from "@/lib/adminAccess";

export async function isAdminUid(uid: string): Promise<boolean> {
  const snap = await getAdminDb().collection("profiles").doc(uid).get();
  if (snap.data()?.is_admin === true) return true;
  try {
    const user = await getAdminAuth().getUser(uid);
    return checkIsAdmin(user.email);
  } catch {
    return false;
  }
}
