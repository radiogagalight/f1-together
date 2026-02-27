import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/components/AuthProvider";
import { ProfileGate } from "@/components/ProfileGate";
import { CompanionProvider } from "@/components/CompanionProvider";
import Companion from "@/components/Companion";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "F1 Together",
  description: "Season predictions for your F1 group",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <CompanionProvider>
            <ProfileGate>
              <main>{children}</main>
              <BottomNav />
            </ProfileGate>
            <Companion />
          </CompanionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
