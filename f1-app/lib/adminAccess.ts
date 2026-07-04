/** Emails that always have admin access (results entry, wildcards). */
const DEFAULT_ADMIN_EMAILS = ["lightharas@gmail.com"];

export function getAdminEmails(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  if (fromEnv?.trim()) {
    return fromEnv
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  }
  return DEFAULT_ADMIN_EMAILS;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/** True if the profile flag is set or the signed-in email is an admin email. */
export function checkIsAdmin(
  email: string | null | undefined,
  profileIsAdmin?: boolean
): boolean {
  return profileIsAdmin === true || isAdminEmail(email);
}
