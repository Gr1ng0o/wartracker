"use client";

import { useState } from "react";
import Link from "next/link";

export default function AddGamePage() {
  const [gameType, setGameType] = useState<"40k" | "FaB">("40k");
  const [build, setBuild] = useState("");
  const [opponent, setOpponent] = useState("");
  const [first, setFirst] = useState(true);
  const [result, setResult] = useState<"W" | "L">("W");
  const [score, setScore] = useState("");
  const [tag1, setTag1] = useState("");
  const [tag2, setTag2] = useState("");
  const [notes, setNotes] = useState("");

  // PDF (URL en DB)
  const [armyListPdfUrl, setArmyListPdfUrl] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfMsg, setPdfMsg] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  async function uploadPdf(file: File) {
    setUploadingPdf(true);
    setPdfMsg(null);

    try {
      if (file.type !== "application/pdf") {
        throw new Error("Merci de sélectionner un fichier PDF.");
      }

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Upload failed (${res.status})`);
      }

      const data = (await res.json()) as { url: string };
      setArmyListPdfUrl(data.url);
      setPdfMsg("✅ PDF uploadé.");
    } catch (e: any) {
      setArmyListPdfUrl(null);
      setPdfMsg(`❌ ${e?.message ?? "Erreur upload PDF"}`);
    } finally {
      setUploadingPdf(false);
    }
  }

  function clearPdf() {
    setArmyListPdfUrl(null);
    setPdfMsg(null);
  }

  function resetForm() {
    setBuild("");
    setOpponent("");
    setFirst(true);
    setResult("W");
    setScore("");
    setTag1("");
    setTag2("");
    setNotes("");
    clearPdf();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // évite le submit pendant upload
    if (uploadingPdf) return;

    setSaving(true);

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameType,
        build,
        opponent,
        first,
        result,
        score,
        tag1,
        tag2,
        notes,
        armyListPdfUrl: gameType === "40k" ? armyListPdfUrl : null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(t || "Erreur lors de l'enregistrement");
      return;
    }

    resetForm();
    alert("Partie enregistrée ✅");
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-white shadow-2xl backdrop-blur-md">
        <Link
          href="/"
          className="inline-block rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
        >
          ← Retour à l’accueil
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Ajouter une partie</h1>
        <p className="mt-1 text-sm text-gray-300">
          Warhammer 40k / Flesh and Blood
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Game type */}
            <label className="space-y-1">
              <span className="text-sm font-medium">Jeu</span>
              <select
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={gameType}
                onChange={(e) => {
                  const t = e.target.value as "40k" | "FaB";
                  setGameType(t);

                  // si on passe sur FaB, on vire le PDF (optionnel mais clean)
                  if (t !== "40k") clearPdf();
                }}
              >
                <option value="40k">Warhammer 40k</option>
                <option value="FaB">Flesh and Blood</option>
              </select>
            </label>

            {/* Result */}
            <label className="space-y-1">
              <span className="text-sm font-medium">Résultat</span>
              <select
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={result}
                onChange={(e) => setResult(e.target.value as "W" | "L")}
              >
                <option value="W">Victoire</option>
                <option value="L">Défaite</option>
              </select>
            </label>

            {/* Build */}
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">Build / Deck</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={build}
                onChange={(e) => setBuild(e.target.value)}
                placeholder="Ultramarines v1 / Ira v2"
                required
              />
            </label>

            {/* Opponent */}
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">Adversaire</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Orks / Bravo"
                required
              />
            </label>

            {/* First */}
            <label className="space-y-1">
              <span className="text-sm font-medium">Initiative</span>
              <select
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={first ? "first" : "second"}
                onChange={(e) => setFirst(e.target.value === "first")}
              >
                <option value="first">Je commence</option>
                <option value="second">Je ne commence pas</option>
              </select>
            </label>

            {/* Score */}
            <label className="space-y-1">
              <span className="text-sm font-medium">Score</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="40k: +12 / FaB: 6"
              />
            </label>

            {/* Tags */}
            <label className="space-y-1">
              <span className="text-sm font-medium">Tag 1</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={tag1}
                onChange={(e) => setTag1(e.target.value)}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Tag 2</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={tag2}
                onChange={(e) => setTag2(e.target.value)}
              />
            </label>

            {/* Notes */}
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">Notes</span>
              <textarea
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Moment clé, erreur, ajustement…"
              />
            </label>

            {/* PDF upload (40k only) */}
            {gameType === "40k" && (
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm font-medium">Liste d’armée (PDF)</span>

                <input
                  type="file"
                  accept="application/pdf"
                  disabled={uploadingPdf}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadPdf(f);
                  }}
                />

                {uploadingPdf && (
                  <p className="text-xs text-gray-300">Upload en cours...</p>
                )}

                {pdfMsg && <p className="text-xs text-gray-300">{pdfMsg}</p>}

                {armyListPdfUrl && (
                  <div className="flex items-center gap-3">
                    <a
                      href={armyListPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline text-gray-200"
                    >
                      Voir le PDF uploadé
                    </a>
                    <button
                      type="button"
                      onClick={clearPdf}
                      className="text-xs rounded-lg bg-white/10 px-2 py-1 hover:bg-white/20"
                    >
                      Retirer
                    </button>
                  </div>
                )}
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || uploadingPdf}
            className="mt-4 w-full rounded-xl bg-white/90 px-4 py-2 font-semibold text-black transition hover:bg-white disabled:opacity-50"
          >
            {uploadingPdf
              ? "Upload PDF..."
              : saving
              ? "Enregistrement..."
              : "Enregistrer la partie"}
          </button>
        </form>
      </div>
    </main>
  );
}
