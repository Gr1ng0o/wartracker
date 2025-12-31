import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl p-6 pt-14">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 text-white shadow-2xl backdrop-blur-md">
          
          {/* LOGO */}
          <div className="flex justify-center">
            <Image
              src="/branding/wartracker-logo.png"
              alt="WarTracker"
              width={1000}
              height={500}
              priority
              className="w-full max-w-[520px] select-none drop-shadow-[0_0_20px_rgba(234,179,8,0.35)]"
            />
          </div>

          {/* Actions */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/40k"
              className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
            >
              <div className="text-lg font-semibold">⚔️ Warhammer 40k</div>
            </Link>

            <Link
              href="/fab"
              className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
            >
              <div className="text-lg font-semibold">🩸 Flesh and Blood</div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
