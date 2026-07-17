import type { User } from "firebase/auth";

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

export function collectUserEmails(
  email: string | null | undefined,
  providerEmails?: Array<string | null | undefined>
): string[] {
  const emails = new Set<string>();
  if (email) emails.add(email.toLowerCase());
  for (const providerEmail of providerEmails ?? []) {
    if (providerEmail) emails.add(providerEmail.toLowerCase());
  }
  return [...emails];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export function isAnyAdminEmail(emails: string[]): boolean {
  const allowlist = new Set(getAdminEmails());
  return emails.some((email) => allowlist.has(email));
}

/** True if the profile flag is set or the signed-in email is an admin email. */
export function checkIsAdmin(
  email: string | null | undefined,
  profileIsAdmin?: boolean
): boolean {
  return profileIsAdmin === true || isAdminEmail(email);
}

/** Client-side admin check using Firebase user + optional profile flag. */
export function checkIsAdminUser(
  user: User | null | undefined,
  profileIsAdmin?: boolean
): boolean {
  if (!user) return false;
  if (profileIsAdmin === true) return true;
  const emails = collectUserEmails(
    user.email,
    user.providerData.map((provider) => provider.email)
  );
  return isAnyAdminEmail(emails);
}
