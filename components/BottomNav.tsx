"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Flag, User, Trophy, Users, SlidersHorizontal } from "lucide-react";

const NAV_ITEMS = [
  { href: "/",            label: "Home",        Icon: Flag },
  { href: "/profile",     label: "Profile",     Icon: User },
  { href: "/predictions", label: "Predictions", Icon: Trophy },
  { href: "/members",     label: "Community",   Icon: Users },
  { href: "/settings",    label: "Settings",    Icon: SlidersHorizontal },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useAuth();

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
            {/* Pill highlight + icon */}
            <span
              className="relative flex items-center justify-center transition-all duration-200"
              style={{
                width: "48px",
                height: "28px",
                borderRadius: "14px",
                backgroundColor: isActive
                  ? "color-mix(in srgb, var(--team-accent) 15%, transparent)"
                  : "transparent",
              }}
            >
              <item.Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              {item.href === "/members" && unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    minWidth: "16px",
                    height: "16px",
                    borderRadius: "8px",
                    backgroundColor: "#e10600",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
