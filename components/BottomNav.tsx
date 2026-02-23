"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",            label: "Home",        icon: "🏠" },
  { href: "/predictions", label: "Predictions", icon: "🏁" },
  { href: "/members",     label: "Group",       icon: "👥" },
  { href: "/profile",     label: "Profile",     icon: "👤" },
  { href: "/settings",    label: "Settings",    icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/auth")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-surface"
      style={{ height: "64px" }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/predictions"
            ? pathname.startsWith("/predictions")
            : pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
            style={{
              color: isActive ? "var(--team-accent)" : "var(--muted)",
              minHeight: "44px",
            }}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
