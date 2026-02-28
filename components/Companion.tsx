"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCompanion } from "@/components/CompanionProvider";
import CompanionCar, { type CarPose } from "@/components/CompanionCar";

export default function Companion() {
  const {
    phase,
    message,
    showBubble,
    showMenu,
    introNameInput,
    setIntroNameInput,
    confirmIntroName,
    confirmIntroStep2,
    openMenu,
    closeMenu,
    handleMenuAction,
    wakeUp,
  } = useCompanion();

  const pathname = usePathname();
  const isHome = pathname === "/";

  // Keep the component alive during dismiss animation
  const [isDismissing, setIsDismissing] = useState(false);
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    if (prevPhaseRef.current !== "dismissed" && phase === "dismissed") {
      setIsDismissing(true);
      const t = setTimeout(() => setIsDismissing(false), 850);
      return () => clearTimeout(t);
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  if (phase === "hidden") return null;
  if (phase === "dismissed" && !isDismissing) return null;

  // Pick the right sprite pose for the current phase
  let pose: CarPose = "side-right";
  if (phase === "intro-step-1" || phase === "intro-step-2") {
    pose = "quarter-front";
  } else if (phase === "waiting-home") {
    pose = "front";
  } else if (isDismissing) {
    pose = "side-left";
  }

  // Car animation
  let carAnimation = "none";
  if (isDismissing) {
    carAnimation = "companion-dismiss 0.8s forwards";
  } else if (phase === "active" || phase === "intro-step-1" || phase === "intro-step-2") {
    carAnimation = "companion-float 3s ease-in-out infinite";
  } else if (phase === "waiting-home") {
    carAnimation = "companion-idle 2s ease-in-out infinite";
  }

  function handleCarClick() {
    if (phase === "waiting-home") {
      wakeUp();
    } else if (phase === "active") {
      openMenu();
    }
  }

  return (
    <>
      {/* Menu backdrop */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Companion container */}
      <div
        style={{
          position: "fixed",
          bottom: "calc(64px + 12px)",
          right: "16px",
          zIndex: 60,
        }}
      >
        {/* Speech bubble */}
        {showBubble && !showMenu && message && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              right: 0,
              width: (phase === "intro-step-1" || phase === "intro-step-2") ? "240px" : undefined,
              minWidth: "180px",
              maxWidth: "240px",
              fontSize: "13px",
              wordBreak: "break-word",
              borderRadius: "16px 16px 4px 16px",
              animation: "companion-bubble-in 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
            className="bg-surface border border-border text-foreground px-3 py-3 shadow-lg"
          >
            {phase === "intro-step-1" ? (
              <div className="flex flex-col gap-3">
                <p>{message}</p>
                <input
                  type="text"
                  value={introNameInput}
                  onChange={(e) => setIntroNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirmIntroName()}
                  placeholder="Your name…"
                  maxLength={30}
                  autoFocus
                  className="rounded px-2 py-2 text-sm bg-background border border-border text-foreground outline-none focus:border-[var(--team-accent)]"
                />
                <button
                  onClick={confirmIntroName}
                  className="rounded px-3 py-2 text-sm font-semibold text-white"
                  style={{ background: "var(--team-accent)", minHeight: "40px" }}
                >
                  That&apos;s me! ✅
                </button>
              </div>
            ) : phase === "intro-step-2" ? (
              <div className="flex flex-col gap-3">
                <p>{message}</p>
                <button
                  onClick={confirmIntroStep2}
                  className="rounded px-3 py-2 text-sm font-semibold text-white"
                  style={{ background: "var(--team-accent)", minHeight: "40px" }}
                >
                  Let&apos;s go! 🏁
                </button>
              </div>
            ) : (
              <p>{message}</p>
            )}
          </div>
        )}

        {/* Tap menu */}
        {showMenu && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              right: 0,
              width: "220px",
              animation: "companion-menu-in 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards",
              transformOrigin: "bottom right",
              zIndex: 60,
            }}
            className="bg-surface border border-border rounded-2xl shadow-xl overflow-hidden"
          >
            {(
              [
                { action: "help",    label: "Help 💡" },
                { action: "joke",    label: "Tell me a joke 😄" },
                { action: "hype",    label: "Hype me up 🔥" },
                { action: "scoring", label: "How does scoring work? 🏆" },
                { action: "dismiss", label: "See ya later 👋" },
              ] as const
            ).filter(({ action }) => !(action === "dismiss" && isHome)).map(({ action, label }) => (
              <button
                key={action}
                onClick={() => handleMenuAction(action)}
                className="w-full text-left px-4 text-sm text-foreground hover:bg-surface-hover transition-colors"
                style={{
                  minHeight: "44px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Car image button */}
        <button
          onClick={handleCarClick}
          aria-label={
            phase === "waiting-home" ? "Wake up companion" :
            phase === "active" ? "Open companion menu" : undefined
          }
          style={{
            background: "none",
            border: "none",
            cursor: phase === "active" || phase === "waiting-home" ? "pointer" : "default",
            padding: "4px",
            display: "block",
            animation: carAnimation,
            userSelect: "none",
          }}
        >
          <CompanionCar pose={pose} />
        </button>
      </div>
    </>
  );
}
