import Link from "next/link";

export default function WH40KHub() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl p-6 pt-14">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 text-white shadow-2xl backdrop-blur-md">
          <Link
            href="/"
            className="inline-block rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
          >
            ← Accueil
          </Link>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
            Espace Warhammer 40k
          </h1>
          <p className="mt-2 text-gray-300">
            Saisie de parties + consultation de ton historique 40k.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/40k/add-game"
              className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
            >
              <div className="text-lg font-semibold">➕ Ajouter une partie 40k</div>
              <div className="mt-1 text-sm text-gray-300">
                Résultat, score, tags, notes.
              </div>
            </Link>

            <Link
              href="/40k/games"
              className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
            >
              <div className="text-lg font-semibold">📊 Historique 40k</div>
              <div className="mt-1 text-sm text-gray-300">
                Liste + winrate 40k.
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
