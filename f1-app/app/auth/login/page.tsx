"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase/app";

const SPEED_LINES = [
  { top: 7, width: 38, dur: 2.1, delay: 0.3, opacity: 0.28 },
  { top: 14, width: 52, dur: 3.4, delay: 1.8, opacity: 0.18 },
  { top: 21, width: 25, dur: 1.8, delay: 4.2, opacity: 0.42 },
  { top: 28, width: 44, dur: 4.1, delay: 0.8, opacity: 0.31 },
  { top: 35, width: 31, dur: 2.7, delay: 2.5, opacity: 0.22 },
  { top: 42, width: 58, dur: 1.6, delay: 5.1, opacity: 0.47 },
  { top: 48, width: 19, dur: 3.8, delay: 3.3, opacity: 0.15 },
  { top: 55, width: 46, dur: 2.3, delay: 0.6, opacity: 0.38 },
  { top: 62, width: 33, dur: 4.4, delay: 2.1, opacity: 0.25 },
  { top: 68, width: 57, dur: 1.9, delay: 4.7, opacity: 0.52 },
  { top: 74, width: 22, dur: 3.1, delay: 1.2, opacity: 0.19 },
  { top: 81, width: 41, dur: 2.6, delay: 3.8, opacity: 0.34 },
  { top: 87, width: 16, dur: 4.0, delay: 0.9, opacity: 0.13 },
  { top: 93, width: 49, dur: 2.9, delay: 5.5, opacity: 0.44 },
  { top: 11, width: 35, dur: 1.7, delay: 2.9, opacity: 0.3 },
  { top: 24, width: 60, dur: 3.6, delay: 1.4, opacity: 0.21 },
  { top: 39, width: 27, dur: 2.4, delay: 4.5, opacity: 0.56 },
  { top: 52, width: 43, dur: 4.2, delay: 0.2, opacity: 0.17 },
  { top: 66, width: 18, dur: 3.0, delay: 3.6, opacity: 0.4 },
  { top: 79, width: 55, dur: 2.2, delay: 5.8, opacity: 0.26 },
  { top: 89, width: 30, dur: 1.5, delay: 1.7, opacity: 0.49 },
  { top: 97, width: 47, dur: 3.9, delay: 4.0, opacity: 0.33 },
];

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth(getFirebaseApp());

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage("Account created. You can sign in, or continue if you’re already signed in.");
        router.push("/");
        router.refresh();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    }

    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
      setError(msg);
    }
  }

  function toggleMode() {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setMessage(null);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div
        className="relative flex flex-col justify-center px-8 py-12 md:flex-1 md:min-h-screen overflow-hidden"
        style={{ backgroundColor: "#080810" }}
      >
        {SPEED_LINES.map((line, i) => (
          <div
            key={i}
            className="absolute left-0 pointer-events-none"
            style={{
              top: `${line.top}%`,
              width: `${line.width}%`,
              height: "1px",
              background:
                "linear-gradient(to right, transparent, rgba(225,6,0,0.4), transparent)",
              opacity: line.opacity,
              animation: `speed-rush ${line.dur}s linear ${line.delay}s infinite`,
            }}
          />
        ))}

        <div className="relative z-10">
          <div className="flex justify-center mb-10">
            <Image
              src="/images/f1-logo-3.png"
              alt="Formula 1"
              width={260}
              height={136}
              className="object-contain"
              priority
            />
          </div>

          <div
            className="h-1 w-12 rounded-full mb-8"
            style={{ backgroundColor: "var(--f1-red)" }}
          />

          <h1
            className="text-6xl md:text-7xl font-black leading-none mb-4"
            style={{ color: "var(--foreground)" }}
          >
            F1
            <br />
            Together
          </h1>

          <p className="text-base md:text-lg mb-10" style={{ color: "var(--muted)" }}>
            Predict the 2026 season.
            <br />
            Beat your crew.
          </p>

          <ul className="hidden md:flex flex-col gap-3">
            {[
              "WDC & WCC champion predictions",
              "Race winner & podium predictions",
              "Most wins, poles & podiums",
              "Most DNFs — driver & constructor",
            ].map((feat) => (
              <li
                key={feat}
                className="flex items-center gap-3 text-sm"
                style={{ color: "var(--muted)" }}
              >
                <span
                  className="inline-block h-1 w-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: "var(--f1-red)" }}
                />
                {feat}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        className="flex flex-col justify-center px-8 py-12 md:flex-1 md:min-h-screen"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="w-full max-w-sm mx-auto">
          <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--foreground)" }}>
            {mode === "signin" ? "Sign in" : "Create account"}
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
            {mode === "signin" ? "Welcome back to the grid" : "Join the predictions league"}
          </p>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3 mb-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--foreground)" }}
              >
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)]"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "var(--foreground)" }}
              >
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--f1-red)]"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface)",
                  color: "var(--foreground)",
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-center" style={{ color: "var(--f1-red)" }}>
                {error}
              </p>
            )}

            {message && <p className="text-sm text-center text-green-500">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-colors active:opacity-80 disabled:opacity-50"
              style={{
                minHeight: "44px",
                backgroundColor: "var(--f1-red)",
              }}
            >
              {loading
                ? "Please wait…"
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: "var(--border)" }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span
                className="px-2"
                style={{
                  backgroundColor: "var(--background)",
                  color: "var(--muted)",
                }}
              >
                or
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full rounded-lg border px-4 py-3 text-sm font-semibold transition-colors active:opacity-80 flex items-center justify-center gap-2"
            style={{
              minHeight: "44px",
              borderColor: "var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--foreground)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18Z"
              />
              <path
                fill="#34A853"
                d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.87v2.07A8 8 0 0 0 8.98 17Z"
              />
              <path
                fill="#FBBC05"
                d="M4.51 10.52A4.77 4.77 0 0 1 4.26 9c0-.52.09-1.03.25-1.52V5.41H1.87A8 8 0 0 0 1 9c0 1.29.31 2.51.87 3.59l2.64-2.07Z"
              />
              <path
                fill="#EA4335"
                d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 8.98 1a8 8 0 0 0-7.1 4.41l2.64 2.07c.62-1.89 2.38-3.3 4.46-3.3Z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={toggleMode}
              className="font-semibold underline"
              style={{ color: "var(--foreground)" }}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
