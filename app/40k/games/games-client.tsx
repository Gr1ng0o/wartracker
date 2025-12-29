"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

// Le type exact renvoyé par Prisma pour le modèle Game
type GameRow = Prisma.GameGetPayload<{}>;

export default function Games40kClient({
  initialGames,
}: {
  initialGames: GameRow[];
}) {
  const [games, setGames] = useState<GameRow[]>(initialGames);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return games;

    return games.filter((g) => {
      const hay = [
        g.build,
        g.opponent,
        g.myFaction,
        g.myDetachment,
        g.oppFaction,
        g.oppDetachment,
        g.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(s);
    });
  }, [games, q]);

  const winrate = useMemo(() => {
    if (filtered.length === 0) return 0;
    const wins = filtered.filter((g) => g.result === "W").length;
    return Math.round((wins / filtered.length) * 100);
  }, [filtered]);

  async function savePatch(id: string, patch: Partial<GameRow>) {
    const res = await fetch(`/api/games/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      alert("Erreur lors de la mise à jour");
      return null;
    }
    return (await res.json()) as GameRow;
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl p-6 pt-12">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-white shadow-2xl backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">Historique 40k</h1>
              <p className="mt-1 text-sm text-gray-300">
                Winrate:{" "}
                <span className="font-semibold text-white">{winrate}%</span> (
                {filtered.length}/{games.length})
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/"
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
              >
                ⬅ Accueil
              </Link>
              <Link
                href="/40k/add-game"
                className="rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
              >
                ➕ Ajouter une partie
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (build / faction / détachement / notes...)"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white placeholder:text-gray-400"
            />
          </div>

          <div className="mt-6 space-y-3">
            {filtered.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                open={openId === g.id}
                onToggle={() => setOpenId(openId === g.id ? null : g.id)}
                onSaved={(updated) => {
                  setGames((prev) =>
                    prev.map((x) => (x.id === updated.id ? updated : x))
                  );
                }}
                savePatch={savePatch}
              />
            ))}

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-gray-300">
                Aucune partie ne match ta recherche.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function GameCard({
  game,
  open,
  onToggle,
  savePatch,
  onSaved,
}: {
  game: GameRow;
  open: boolean;
  onToggle: () => void;
  savePatch: (id: string, patch: Partial<GameRow>) => Promise<GameRow | null>;
  onSaved: (g: GameRow) => void;
}) {
  const pdfUrl = game.armyListPdfUrl ?? null;
  const photos = Array.isArray(game.photoUrls) ? game.photoUrls : [];

  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(game.notes ?? "");
  const [saving, setSaving] = useState(false);

  const title = `${game.myFaction ?? "Ta faction"} vs ${
    game.oppFaction ?? game.opponent
  }`;

  const subtitle = `${game.build} • ${new Date(game.createdAt).toLocaleString(
    "fr-FR"
  )}`;

  const scoreLine =
    typeof game.myScore === "number" && typeof game.oppScore === "number"
      ? `${game.myScore} - ${game.oppScore}`
      : null;

  async function onSave() {
    setSaving(true);
    const updated = await savePatch(game.id, { notes });
    setSaving(false);
    if (updated) {
      onSaved(updated);
      setEditing(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <button
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-semibold">{title}</span>

            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                game.result === "W"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-rose-500/20 text-rose-200"
              }`}
            >
              {game.result === "W" ? "Victoire" : "Défaite"}
            </span>

            {scoreLine && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-200">
                {scoreLine}
              </span>
            )}
          </div>

          <div className="mt-1 text-sm text-gray-300">{subtitle}</div>

          <div className="mt-1 text-xs text-gray-400">
            {game.myDetachment ? `Toi: ${game.myDetachment}` : " "}
            {game.oppDetachment ? ` • Adverse: ${game.oppDetachment}` : ""}
          </div>
        </div>

        <div className="shrink-0 text-sm text-gray-300">{open ? "▲" : "▼"}</div>
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <div className="text-xs font-semibold text-gray-200">
                Liste d’armée (PDF)
              </div>

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
                      key={`${game.id}-photo-${i}`}
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

          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-gray-200">
                Commentaires
              </div>

              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/15"
                >
                  ✏️ Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setNotes(game.notes ?? "");
                      setEditing(false);
                    }}
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/15"
                  >
                    Annuler
                  </button>

                  <button
                    disabled={saving}
                    onClick={onSave}
                    className="rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold text-black hover:bg-white disabled:opacity-60"
                  >
                    {saving ? "Sauvegarde..." : "Sauvegarder"}
                  </button>
                </div>
              )}
            </div>

            {!editing ? (
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-200">
                {game.notes?.trim() ? game.notes : "—"}
              </p>
            ) : (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                placeholder="Corrige / complète tes notes..."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
