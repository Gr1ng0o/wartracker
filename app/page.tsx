import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl p-6 pt-14">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-8 text-white shadow-2xl backdrop-blur-md">
          <h1 className="text-4xl font-extrabold tracking-tight">WarTracker</h1>
          <p className="mt-2 text-gray-300">
            Tracker minimal (40k / Flesh and Blood) : enregistre tes parties,
            consulte ta base, calcule ton winrate.
          </p>

          {/* Actions */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Link
              href="/add-game"
              className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
            >
              <div className="text-lg font-semibold">➕ Ajouter une partie</div>
              <div className="mt-1 text-sm text-gray-300">
                Enregistrement rapide : résultat, score, tags, notes.
              </div>
            </Link>

            <Link
              href="/games"
              className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
            >
              <div className="text-lg font-semibold">📊 Consulter la base</div>
              <div className="mt-1 text-sm text-gray-300">
                Liste, filtres, winrate global, historique.
              </div>
            </Link>

            <Link
              href="/import"
              className="rounded-2xl border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
            >
              <div className="text-lg font-semibold">📥 Importer des parties</div>
              <div className="mt-1 text-sm text-gray-300">
                Import CSV ou historique existant.
              </div>
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5">
            <div className="text-sm font-semibold text-gray-200">
              Prochaine étape (quand tu veux)
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-300">
              <li>Winrate par matchup (opponent)</li>
              <li>Comparaison de builds (v1 vs v2)</li>
              <li>Page stats dédiée + export CSV</li>
              <li>Accès mobile + sync cloud</li>
            </ul>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-300">
          Local: <span className="font-semibold text-white">localhost:3000</span>
        </p>
      </div>
    </main>
  );
}
