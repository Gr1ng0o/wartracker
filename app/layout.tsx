import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WarTracker",
  description: "Track Warhammer 40k & Flesh and Blood games",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const signedIn = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen`}>
        {/* ✅ Background image (NE CAPTE PAS LES CLICS) */}
        <div
          className="pointer-events-none fixed inset-0 -z-10 bg-center bg-cover bg-fixed"
          style={{ backgroundImage: "url('/background.png')" }}
        />

        {/* ✅ Dark overlay (NE CAPTE PAS LES CLICS) */}
        <div className="pointer-events-none fixed inset-0 -z-10 bg-black/60" />

        {/* ✅ App content (CLICABLE) */}
        <div className="relative z-10 min-h-screen">
          {signedIn ? <form action="/api/auth/logout" method="post" className="absolute right-4 top-4 z-50"><button className="rounded-full border border-white/15 bg-black/80 px-3 py-2 text-xs text-white/70">Se déconnecter</button></form> : null}
          {children}
        </div>
      </body>
    </html>
  );
}
