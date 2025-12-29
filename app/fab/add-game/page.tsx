import Link from "next/link";

export default function FaBHub() {
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
            Espace Flesh and Blood
          </h1>
          <p className="mt-2 text-gray-300">
            Saisie de parties + consultation de ton historique FaB.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/fab/add-game"
              className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
            >
              <div className="text-lg font-semibold">➕ Ajouter une partie FaB</div>
              <div className="mt-1 text-sm text-gray-300">
                Deck, adversaire, résultat, notes.
              </div>
            </Link>

            <Link
              href="/fab/games"
              className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
            >
              <div className="text-lg font-semibold">📊 Historique FaB</div>
              <div className="mt-1 text-sm text-gray-300">
                Liste + winrate FaB.
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
