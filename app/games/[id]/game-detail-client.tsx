"use client";

import { useState } from "react";
import type { GameDTO } from "../../types";

export default function GameDetailClient({ game }: { game: GameDTO }) {
  const [notes, setNotes] = useState(game.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `PATCH failed (${res.status})`);
      }

      setMsg("✅ Commentaire sauvegardé.");
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Erreur"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-black/60 p-6 text-white space-y-4">
      <div className="space-y-1">
        <div className="text-xl font-bold">
          {game.gameType} — {game.build} vs {game.opponent}
        </div>
        <div className="text-sm text-gray-300">
          {new Date(game.createdAt).toLocaleString()} •{" "}
          {game.first ? "Je commence" : "Je ne commence pas"} • Résultat :{" "}
          <span className="font-semibold">{game.result}</span>
          {game.score !== null ? ` • Score : ${game.score}` : ""}
        </div>
      </div>

      <div className="rounded-xl bg-white/5 p-4 space-y-2">
        <div className="text-sm font-semibold text-gray-200">Commentaires</div>
        <textarea
          className="w-full rounded-lg bg-black/40 p-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/20"
          rows={7}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Écris ton review ici…"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Save"}
          </button>
          {msg && <span className="text-xs text-gray-300">{msg}</span>}
        </div>
      </div>

      {game.armyListPdfUrl && (
        <a
          href={game.armyListPdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-sm underline"
        >
          📄 Liste d’armée (PDF)
        </a>
      )}

      {game.photoUrls && game.photoUrls.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-200">Photos</div>
          <div className="flex flex-wrap gap-2">
            {game.photoUrls.map((u, i) => (
              <a
                key={i}
                href={u}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline"
              >
                📷 Photo {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
