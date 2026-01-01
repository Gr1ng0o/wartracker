"use client";

import { useMemo, useState } from "react";
import type { GameDTO } from "../types";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
      <div className="text-xs font-semibold text-gray-300">{label}</div>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}

function fmtFR(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function GameDetailClient({ game }: { game: GameDTO }) {
  const [notes, setNotes] = useState(game.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const dateStr = useMemo(() => {
    const iso = game.playedAt || game.createdAt;
    return fmtFR(iso);
  }, [game.playedAt, game.createdAt]);

  const missionLine = useMemo(() => {
    const parts = [
      game.missionPack?.trim(),
      game.primaryMission?.trim(),
      game.deployment?.trim(),
      game.terrainLayout?.trim(),
    ].filter(Boolean) as string[];
    return parts.length ? parts.join(" – ") : null;
  }, [game.missionPack, game.primaryMission, game.deployment, game.terrainLayout]);

  const isWin = game.result === "W";
  const isLoss = game.result === "L";
  const isDraw = game.result === "D";
  const badgeText = isWin ? "Victoire" : isLoss ? "Défaite" : isDraw ? "Nul" : game.result ?? "—";
  const badgeClass = isWin
    ? "bg-green-500/20 text-green-200 ring-1 ring-green-500/30"
    : isLoss
    ? "bg-red-500/20 text-red-200 ring-1 ring-red-500/30"
    : "bg-white/10 text-gray-200 ring-1 ring-white/20";

  const scoreLine =
    typeof game.myScore === "number" && typeof game.oppScore === "number"
      ? `${game.myScore} — ${game.oppScore}`
      : null;

  async function saveNotes() {
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

      setMsg("✅ Notes sauvegardées.");
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Erreur"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-black/60 p-6 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xl font-bold truncate">
            40k — {game.myFaction ?? "—"}
            {game.oppFaction ? ` vs ${game.oppFaction}` : game.opponent ? ` vs ${game.opponent}` : ""}
          </div>
          <div className="text-sm text-gray-300">Jouée le {dateStr}</div>
          {typeof game.points === "number" ? (
            <div className="mt-1 text-xs text-gray-400">{game.points} pts</div>
          ) : null}
        </div>

        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
          {badgeText}
        </span>
      </div>

      {/* Mission line */}
      {missionLine ? (
        <div className="rounded-xl bg-white/5 p-4">
          <div className="text-xs tracking-[0.25em] text-gray-400">MISSION</div>
          <div className="mt-2 text-sm text-white">{missionLine}</div>
        </div>
      ) : null}

      {/* Infos générales */}
      <div className="grid gap-2">
        <Field label="Adversaire (nom/pseudo)" value={game.opponent ?? "—"} />
        <Field label="Score final" value={scoreLine ?? "—"} />
      </div>

      {/* Armées */}
      <div className="grid gap-2">
        <Field label="Ta faction" value={game.myFaction ?? "—"} />
        <Field label="Ton détachement" value={game.myDetachment ?? "—"} />
        <Field label="Faction adverse" value={game.oppFaction ?? "—"} />
        <Field label="Détachement adverse" value={game.oppDetachment ?? "—"} />
      </div>

      {/* PDFs Drive */}
      <div className="rounded-xl bg-white/5 p-4 space-y-3">
        <div className="text-sm font-semibold text-gray-200">Listes d’armée (Google Drive)</div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-black/30 p-3">
            <div className="text-xs text-gray-400 mb-2">Toi</div>
            {game.myArmyPdfUrl ? (
              <a
                href={game.myArmyPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm underline text-white/90"
              >
                📄 Ouvrir le PDF (toi)
              </a>
            ) : (
              <div className="text-xs text-gray-400">Aucun PDF</div>
            )}
          </div>

          <div className="rounded-lg bg-black/30 p-3">
            <div className="text-xs text-gray-400 mb-2">Adversaire</div>
            {game.oppArmyPdfUrl ? (
              <a
                href={game.oppArmyPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm underline text-white/90"
              >
                📄 Ouvrir le PDF (adversaire)
              </a>
            ) : (
              <div className="text-xs text-gray-400">Aucun PDF</div>
            )}
          </div>
        </div>

        {game.myListText ? (
          <div className="pt-2">
            <div className="text-xs text-gray-400">Texte enrichi (toi)</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-white/85">{game.myListText}</div>
          </div>
        ) : null}

        {game.oppListText ? (
          <div className="pt-2">
            <div className="text-xs text-gray-400">Texte enrichi (adversaire)</div>
            <div className="mt-1 whitespace-pre-wrap text-sm text-white/85">{game.oppListText}</div>
          </div>
        ) : null}
      </div>

      {/* Notes */}
      <div className="rounded-xl bg-white/5 p-4 space-y-2">
        <div className="text-sm font-semibold text-gray-200">Notes post-partie</div>
        <textarea
          className="w-full rounded-lg bg-black/40 p-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/20"
          rows={7}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Erreurs, idées à tester, ajustements..."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={saveNotes}
            disabled={saving}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          {msg && <span className="text-xs text-gray-300">{msg}</span>}
        </div>
      </div>

      {/* Photos Drive */}
      {game.photoUrls && game.photoUrls.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-200">Photos (Google Drive)</div>
          <div className="flex flex-wrap gap-2">
            {game.photoUrls.map((u, i) => (
              <a
                key={u + i}
                href={u}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline text-white/90"
              >
                📷 Photo {i + 1}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-400">📷 Pas de photos renseignées.</div>
      )}
    </div>
  );
}
