"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg p-8 pt-24 text-white">
      <div className="rounded-2xl border border-white/10 bg-black/75 p-6">
        <h1 className="text-2xl font-semibold">Chargement impossible</h1>
        <p className="mt-3 text-white/70">
          Tes parties sont temporairement indisponibles. Réessaie dans quelques
          instants.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-white px-4 py-2 text-black"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}
