"use client";

import { useState } from "react";
import type { GameDTO } from "../../types";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
      <div className="text-xs font-semibold text-gray-300">{label}</div>
      <div className="text-sm text-white">{value}</div>
    </div>
  );
}

export default function GameDetailClient({ game }: { game: GameDTO }) {
  const [notes, setNotes] = useState(game.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // PDF upload state
  const [pdfUrl, setPdfUrl] = useState<string>(game.armyListPdfUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  const dateStr = new Date(game.createdAt).toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isWin = game.result === "W";
  const isLoss = game.result === "L";
  const badgeText = isWin ? "Victoire" : isLoss ? "Défaite" : game.result;
  const badgeClass = isWin
    ? "bg-green-500/20 text-green-200 ring-1 ring-green-500/30"
    : isLoss
    ? "bg-red-500/20 text-red-200 ring-1 ring-red-500/30"
    : "bg-white/10 text-gray-200 ring-1 ring-white/20";

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

      setMsg("✅ Commentaire sauvegardé.");
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Erreur"}`);
    } finally {
      setSaving(false);
    }
  }

  async function uploadPdf(file: File) {
    setUploading(true);
    setUploadMsg(null);

    try {
      if (file.type !== "application/pdf") {
        throw new Error("Merci de sélectionner un fichier PDF.");
      }

      // 1) Upload vers Vercel Blob via /api/upload
      const fd = new FormData();
      fd.append("file", file);

      const up = await fetch("/api/upload", { method: "POST", body: fd });
      if (!up.ok) {
        const t = await up.text().catch(() => "");
        throw new Error(t || `Upload failed (${up.status})`);
      }

      const { url } = (await up.json()) as { url: string };
      setPdfUrl(url);

      // 2) Sauvegarde URL en DB via PATCH /api/games/[id]
      const res = await fetch(`/api/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ armyListPdfUrl: url }),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `DB update failed (${res.status})`);
      }

      setUploadMsg("✅ PDF uploadé et lié à la partie.");
    } catch (e: any) {
      setUploadMsg(`❌ ${e?.message ?? "Erreur upload"}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-black/60 p-6 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xl font-bold">
            {game.gameType} — {game.build} vs {game.opponent}
          </div>
          <div className="text-sm text-gray-300">Enregistrée le {dateStr}</div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
          {badgeText}
        </span>
      </div>

      {/* Infos générales */}
      <div className="grid gap-2">
        <Field label="Je commence" value={game.first ? "Oui" : "Non"} />
        <Field label="Score (global)" value={game.score === null ? "—" : String(game.score)} />
        <Field label="Tag 1" value={game.tag1 ?? "—"} />
        <Field label="Tag 2" value={game.tag2 ?? "—"} />
      </div>

      {/* 40k */}
      <div className="grid gap-2">
        <Field label="Ma faction" value={game.myFaction ?? "—"} />
        <Field label="Mon détachement" value={game.myDetachment ?? "—"} />
        <Field label="Faction adverse" value={game.oppFaction ?? "—"} />
        <Field label="Détachement adverse" value={game.oppDetachment ?? "—"} />
        <Field label="Mon score (40k)" value={game.myScore === null ? "—" : String(game.myScore)} />
        <Field
          label="Score adverse (40k)"
          value={game.oppScore === null ? "—" : String(game.oppScore)}
        />
      </div>

      {/* Commentaire */}
      <div className="rounded-xl bg-white/5 p-4 space-y-2">
        <div className="text-sm font-semibold text-gray-200">Commentaire</div>
        <textarea
          className="w-full rounded-lg bg-black/40 p-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-white/20"
          rows={7}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Écris ton review ici…"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={saveNotes}
            disabled={saving}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
          >
            {saving ? "Sauvegarde..." : "Save"}
          </button>
          {msg && <span className="text-xs text-gray-300">{msg}</span>}
        </div>
      </div>

      {/* PDF + Upload */}
      <div className="rounded-xl bg-white/5 p-4 space-y-3">
        <div className="text-sm font-semibold text-gray-200">Liste d’armée (PDF)</div>

        <input
          type="file"
          accept="application/pdf"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadPdf(f);
          }}
          className="block w-full text-sm text-gray-200"
        />

        {uploading && <div className="text-xs text-gray-300">Upload en cours...</div>}
        {uploadMsg && <div className="text-xs text-gray-300">{uploadMsg}</div>}

        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm underline"
          >
            📄 Ouvrir le PDF
          </a>
        ) : (
          <div className="text-xs text-gray-400">📄 Pas de PDF renseigné.</div>
        )}
      </div>

      {/* Photos (URLs uniquement pour l’instant) */}
      {game.photoUrls && game.photoUrls.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-gray-200">Photos</div>
          <div className="flex flex-wrap gap-2">
            {game.photoUrls.map((u, i) => (
              <a key={i} href={u} target="_blank" rel="noreferrer" className="text-sm underline">
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
