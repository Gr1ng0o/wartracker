"use client";

import { useState } from "react";
import Link from "next/link";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (!file) {
      setMsg("Choisis un fichier CSV.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/import/csv", {
      method: "POST",
      body: fd,
      // Optionnel: si tu actives ADMIN_KEY
      // headers: { "x-admin-key": "TON_ADMIN_KEY" },
    });

    const json = await res.json();

    if (!res.ok) {
      setMsg(`Erreur: ${json.error ?? "unknown"} ${json.errors ? JSON.stringify(json.errors) : ""}`);
      return;
    }

    setMsg(`✅ Import OK : ${json.inserted} lignes`);
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-white shadow-2xl backdrop-blur-md space-y-4">
        <Link
          href="/"
          className="inline-block rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
        >
          ← Retour à l’accueil
        </Link>

        <h1 className="text-3xl font-bold">Importer un CSV</h1>
        <p className="text-sm text-gray-300">
          Format attendu : en-têtes = gameType, build, opponent, first, result, score, tag1, tag2, notes, createdAt (optionnel).
        </p>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />

          <button
            className="w-full rounded-xl bg-white/90 px-4 py-2 font-semibold text-black transition hover:bg-white"
            type="submit"
          >
            Importer
          </button>

          {msg && <div className="text-sm text-gray-200">{msg}</div>}
        </form>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-gray-300">
          <div className="font-semibold text-white mb-2">Exemple CSV</div>
          <pre className="whitespace-pre-wrap">
gameType,build,opponent,first,result,score,tag1,tag2,notes,createdAt
40k,Ultramarines v1,Orks,true,W,+12,GT,Test,"Bon plan de jeu",2025-12-27T10:00:00Z
FaB,Ira v2,Bravo,false,L,2,Armory,,,"2025-12-26T20:00:00Z"
          </pre>
        </div>
      </div>
    </main>
  );
}
