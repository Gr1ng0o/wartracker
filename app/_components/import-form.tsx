"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { apiRequest, errorMessage } from "@/lib/client-api";

const example = `gameType,build,opponent,first,result,score,tag1,tag2,notes,createdAt
40k,Ultramarines v1,Orks,true,W,+12,GT,Test,Bon plan de jeu,2025-12-27T10:00:00Z
FaB,Enigma,Bravo,false,L,2,Armory,,,2025-12-26T20:00:00Z`;

export default function ImportForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const result = await apiRequest("/api/import/csv", {
        method: "POST",
        body: form,
      });
      const count =
        result && typeof result === "object" && "inserted" in result
          ? result.inserted
          : 0;
      setMessage(`Import terminé : ${count} parties.`);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-2xl px-6 py-14 text-white">
      <div className="space-y-5 rounded-3xl border border-white/10 bg-black/75 p-6">
        <Link href="/games">← Toutes les parties</Link>
        <h1 className="text-3xl font-bold">Importer un CSV</h1>
        <p className="text-sm text-white/70">
          2 Mo et 5 000 parties maximum. Toutes les lignes sont vérifiées avant
          l’import. Réimporter un même fichier ajoute de nouvelles parties.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <input
            name="file"
            type="file"
            required
            accept=".csv,text/csv"
            className="block w-full"
          />
          <button
            disabled={busy}
            className="rounded-xl bg-amber-100 px-4 py-3 font-semibold text-black disabled:opacity-50"
          >
            {busy ? "Import…" : "Importer"}
          </button>
        </form>
        {message ? <p role="status">{message}</p> : null}
        <p className="text-sm text-white/70">
          Exemple : true = tu as commencé, false = l’adversaire a commencé. Les
          dates utilisent le format ISO avec fuseau horaire.
        </p>
        <pre className="overflow-x-auto rounded-xl bg-black/50 p-4 text-xs">
          {example}
        </pre>
      </div>
    </main>
  );
}
