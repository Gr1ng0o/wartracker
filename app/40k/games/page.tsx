import Link from "next/link";

export default function Page40k() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Vignette + fumée (grimdark global) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute inset-0 opacity-35 blur-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,120,40,0.10),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(255,200,120,0.06),transparent_60%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl items-center px-6 py-14">
        <div className="w-full rounded-[28px] border border-white/10 bg-black/55 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.85)] backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15 transition"
            >
              ← Accueil
            </Link>

            <div className="hidden sm:block text-[10px] tracking-[0.35em] text-white/35">
              WARHAMMER • 40K
            </div>
          </div>

          <div className="mt-6">
  <h1
    className="
      text-4xl sm:text-5xl font-extrabold
      tracking-[0.04em]
      text-white
      drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]
    "
  >
    <span className="block text-xs tracking-[0.45em] text-white/40 mb-2">
      WARHAMMER
    </span>
    ESPACE 40K
  </h1>

  <div className="mt-4 h-px w-48 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
</div>


          {/* Actions (CTA) */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link
              href="/40k/add-game"
              className="
                group relative overflow-hidden rounded-2xl
                border border-white/10
                bg-black/55 backdrop-blur-md
                px-6 py-5
                shadow-[0_18px_60px_rgba(0,0,0,0.75)]
                transition
                hover:border-amber-200/25
                hover:bg-black/65
              "
            >
              <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(255,180,80,0.08),transparent_60%)]" />
              <div className="pointer-events-none absolute -inset-24 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle,rgba(255,170,70,0.12),transparent_60%)]" />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/60" />

              <div className="relative flex items-center gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 text-xl group-hover:ring-amber-200/20 transition">
                  ＋
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold tracking-wide text-white/95">
                    Ajouter une partie 40k
                  </div>
                  <div className="text-xs text-white/55">
                    Résultat, score, tags, notes.
                  </div>
                </div>
                <div className="ml-auto text-white/40 group-hover:text-amber-200/40 transition">
                  →
                </div>
              </div>
            </Link>

            <Link
              href="/40k/games"
              className="
                group relative overflow-hidden rounded-2xl
                border border-white/10
                bg-black/55 backdrop-blur-md
                px-6 py-5
                shadow-[0_18px_60px_rgba(0,0,0,0.75)]
                transition
                hover:border-amber-200/25
                hover:bg-black/65
              "
            >
              <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.10),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(255,180,80,0.08),transparent_60%)]" />
              <div className="pointer-events-none absolute -inset-24 opacity-0 group-hover:opacity-100 transition duration-500 bg-[radial-gradient(circle,rgba(255,170,70,0.12),transparent_60%)]" />
              <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/5" />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/60" />

              <div className="relative flex items-center gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 text-xl group-hover:ring-amber-200/20 transition">
                  📊
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-semibold tracking-wide text-white/95">
                    Historique 40k
                  </div>
                  <div className="text-xs text-white/55">
                    Liste + winrate 40k.
                  </div>
                </div>
                <div className="ml-auto text-white/40 group-hover:text-amber-200/40 transition">
                  →
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="mt-4 text-center text-xs text-white/35">
            The Long War is logged.
          </div>
        </div>
      </div>
    </main>
  );
}
