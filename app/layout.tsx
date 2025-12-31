import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
          {children}
        </div>
      </body>
    </html>
  );
}
