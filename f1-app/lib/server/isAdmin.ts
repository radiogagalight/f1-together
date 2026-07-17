import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { collectUserEmails, isAnyAdminEmail } from "@/lib/adminAccess";

export async function isAdminUid(uid: string): Promise<boolean> {
  const snap = await getAdminDb().collection("profiles").doc(uid).get();
  if (snap.data()?.is_admin === true) return true;
  try {
    const user = await getAdminAuth().getUser(uid);
    const emails = collectUserEmails(
      user.email,
      user.providerData.map((provider) => provider.email)
    );
    return isAnyAdminEmail(emails);
  } catch {
    return false;
  }
}
