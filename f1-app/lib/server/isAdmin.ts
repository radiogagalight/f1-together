import { getAdminDb } from "@/lib/firebase/admin";

export async function isAdminUid(uid: string): Promise<boolean> {
  const snap = await getAdminDb().collection("profiles").doc(uid).get();
  return snap.data()?.is_admin === true;
}
