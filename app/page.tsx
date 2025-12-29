import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl p-6 pt-14">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 text-white shadow-2xl backdrop-blur-md">
          <h1 className="text-4xl font-extrabold tracking-tight">WarTracker</h1>

          {/* Actions */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
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
