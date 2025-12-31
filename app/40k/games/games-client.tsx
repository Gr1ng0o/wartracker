"use client";

import { useMemo, useState } from "react";
import type { GameDTO } from "../../types";
import { useRouter } from "next/navigation";

export default function GamesClient40k({ initialGames }: { initialGames: GameDTO[] }) {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // édition notes
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();

    const only40k = initialGames.filter((g) => g.gameType === "40k");

    if (!qq) return only40k;

    return only40k.filter((g) => {
      const hay = [
        g.opponent,
        g.build,
        g.notes,
        g.myFaction,
        g.myDetachment,
        g.oppFaction,
        g.oppDetachment,
        typeof g.myScore === "number" ? String(g.myScore) : "",
        typeof g.oppScore === "number" ? String(g.oppScore) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(qq);
    });
  }, [initialGames, q]);

  const total = filtered.length;
  const wins = filtered.filter((g) => g.result === "W").length;
  const losses = filtered.filter((g) => g.result === "L").length;
  const winrate = total ? Math.round((wins / total) * 100) : 0;

  async function deleteGame(id: string) {
    const confirmed = confirm("Supprimer définitivement cette partie 40k ?");
    if (!confirmed) return;

    const res = await fetch(`/api/games/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Erreur lors de la suppression");
      return;
    }
    // on refresh côté serveur (la page va re-fetch)
    router.refresh();
  }

  async function saveNotes(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: draftNotes }),
      });

      if (!res.ok) {
        alert("Erreur lors de la mise à jour");
        return;
      }

      // refresh pour recharger les données propres depuis la DB
      setEditingId(null);
      setDraftNotes("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function formatDate(createdAt: string) {
    const d = new Date(createdAt);
    return d.toLocaleString("fr-FR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function badge(g: GameDTO) {
    const isWin = g.result === "W";
    const isLoss = g.result === "L";
    const text = isWin ? "Victoire" : isLoss ? "Défaite" : g.result ?? "—";
    const cls = isWin
      ? "bg-green-500/20 text-green-200 ring-1 ring-green-500/30"
      : isLoss
      ? "bg-red-500/20 text-red-200 ring-1 ring-red-500/30"
      : "bg-white/10 text-gray-200 ring-1 ring-white/20";
    return { text, cls };
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl bg-black/60 backdrop-blur-md p-6 text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold">Parties 40k</h1>
          <p className="text-sm text-gray-300">
            Affichées : <span className="font-semibold">{total}</span> • Victoires :{" "}
            <span className="font-semibold">{wins}</span> • Défaites :{" "}
            <span className="font-semibold">{losses}</span> • Winrate :{" "}
            <span className="font-semibold">{winrate}%</span>
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="w-full sm:w-96 rounded-lg border px-3 py-2 text-black"
            placeholder="Rechercher (opponent/build/factions/notes/score)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <ul className="mt-4 grid gap-3">
        {filtered.map((g) => {
          const dateStr = formatDate(g.createdAt);
          const isOpen = openId === g.id;
          const { text: badgeText, cls: badgeClass } = badge(g);

          const scoreLine =
            typeof g.myScore === "number" && typeof g.oppScore === "number"
              ? `${g.myScore} - ${g.oppScore}`
              : null;

          const pdfUrl = g.armyListPdfUrl ?? null;
          const photos = Array.isArray(g.photoUrls) ? g.photoUrls : [];

          return (
            <li key={g.id} className="rounded-xl shadow-lg">
              <div className="rounded-xl bg-black/50 backdrop-blur-sm p-4 text-white">
                {/* HEADER (cliquable pour déplier) */}
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : g.id)}
                  className="w-full text-left rounded-lg hover:bg-white/5 transition p-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-semibold">
                        {g.build} vs {g.opponent}
                      </div>

                      <div className="text-xs text-gray-300">
                        Enregistrée le {dateStr}
                        {scoreLine ? ` • Score ${scoreLine}` : ""}
                      </div>

                      {(g.myFaction || g.oppFaction) && (
                        <div className="text-xs text-gray-400">
                          {g.myFaction ? `Toi: ${g.myFaction}` : "Toi: —"}
                          {g.myDetachment ? ` (${g.myDetachment})` : ""}
                          {" • "}
                          {g.oppFaction ? `Adverse: ${g.oppFaction}` : "Adverse: —"}
                          {g.oppDetachment ? ` (${g.oppDetachment})` : ""}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                        {badgeText}
                      </span>
                      <span className="text-sm text-gray-300">{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </div>
                </button>

                {/* DETAILS */}
                {isOpen && (
                  <div className="mt-3 space-y-4 border-t border-white/10 pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-xs font-semibold text-gray-200">Liste d’armée (PDF)</div>
                        <div className="mt-2">
                          {pdfUrl ? (
                            <a
                              href={pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-sm text-white underline decoration-white/30 hover:decoration-white"
                            >
                              📄 Ouvrir le PDF
                            </a>
                          ) : (
                            <div className="text-sm text-gray-400">Aucun PDF</div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <div className="text-xs font-semibold text-gray-200">Photos</div>
                        <div className="mt-2 space-y-1">
                          {photos.length ? (
                            photos.map((url, i) => (
                              <a
                                key={`${g.id}-photo-${i}`}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="block text-sm text-white underline decoration-white/30 hover:decoration-white"
                              >
                                🖼️ Photo {i + 1}
                              </a>
                            ))
                          ) : (
                            <div className="text-sm text-gray-400">Aucune photo</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* NOTES */}
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-gray-200">Commentaires</div>

                        {editingId !== g.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(g.id);
                              setDraftNotes(g.notes ?? "");
                            }}
                            className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/15"
                          >
                            ✏️ Modifier
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setDraftNotes("");
                              }}
                              className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/15"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => saveNotes(g.id)}
                              className="rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold text-black hover:bg-white disabled:opacity-60"
                            >
                              {saving ? "Sauvegarde..." : "Sauvegarder"}
                            </button>
                          </div>
                        )}
                      </div>

                      {editingId !== g.id ? (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-200">
                          {g.notes?.trim() ? g.notes : "—"}
                        </p>
                      ) : (
                        <textarea
                          value={draftNotes}
                          onChange={(e) => setDraftNotes(e.target.value)}
                          rows={4}
                          className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                          placeholder="Corrige / complète tes notes..."
                        />
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => deleteGame(g.id)}
                        className="rounded-lg bg-red-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-gray-300">
          Aucune partie ne match ta recherche.
        </div>
      )}
    </main>
  );
}
