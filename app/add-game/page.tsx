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
    <main className="relative min-h-screen overflow-hidden">
      {/* Vignette + fumée (grimdark global) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute inset-0 opacity-35 blur-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,120,40,0.10),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(255,200,120,0.06),transparent_60%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl items-start px-6 py-14">
        <div className="w-full rounded-[28px] border border-white/10 bg-black/55 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.85)] backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/40k"
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15 transition"
            >
              ← Retour 40k
            </Link>

            <div className="hidden sm:block text-[10px] tracking-[0.35em] text-white/35">
              ADD • GAME • LOG
            </div>
          </div>

          {/* Title grimdark */}
          <div className="mt-6">
            <h1
              className="
                text-4xl sm:text-5xl font-extrabold
                tracking-[0.04em]
                text-white
                drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)]
              "
            >
              <span className="block text-xs tracking-[0.45em] text-white/40 mb-2">
                WARTRACKER
              </span>
              AJOUTER UNE PARTIE
            </h1>
            <div className="mt-4 h-px w-56 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Game type */}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">Jeu</span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={gameType}
                  onChange={(e) => {
                    const t = e.target.value as "40k" | "FaB";
                    setGameType(t);
                    if (t !== "40k") clearPdf();
                  }}
                >
                  <option value="40k">Warhammer 40k</option>
                  <option value="FaB">Flesh and Blood</option>
                </select>
              </label>

              {/* Result */}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">Résultat</span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={result}
                  onChange={(e) => setResult(e.target.value as "W" | "L")}
                >
                  <option value="W">Victoire</option>
                  <option value="L">Défaite</option>
                </select>
              </label>

              {/* Build */}
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-white/80">Build / Deck</span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={build}
                  onChange={(e) => setBuild(e.target.value)}
                  placeholder="Ultramarines v1 / Ira v2"
                  required
                />
              </label>

              {/* Opponent */}
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-white/80">Adversaire</span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder="Orks / Bravo"
                  required
                />
              </label>

              {/* First */}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">Initiative</span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={first ? "first" : "second"}
                  onChange={(e) => setFirst(e.target.value === "first")}
                >
                  <option value="first">Je commence</option>
                  <option value="second">Je ne commence pas</option>
                </select>
              </label>

              {/* Score */}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">Score</span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder="40k: +12 / FaB: 6"
                />
              </label>

              {/* Tags */}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">Tag 1</span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={tag1}
                  onChange={(e) => setTag1(e.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">Tag 2</span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={tag2}
                  onChange={(e) => setTag2(e.target.value)}
                />
              </label>

              {/* Notes */}
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-white/80">Notes</span>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Moment clé, erreur, ajustement…"
                />
              </label>

              {/* PDF upload (40k only) */}
              {gameType === "40k" && (
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white/80">
                      Liste d’armée (PDF)
                    </span>

                    {armyListPdfUrl && (
                      <button
                        type="button"
                        onClick={clearPdf}
                        className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/15 transition"
                      >
                        Retirer
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="application/pdf"
                    disabled={uploadingPdf}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white/80 outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadPdf(f);
                    }}
                  />

                  {uploadingPdf && (
                    <p className="text-xs text-white/45">Upload en cours...</p>
                  )}

                  {pdfMsg && <p className="text-xs text-white/55">{pdfMsg}</p>}

                  {armyListPdfUrl && (
                    <a
                      href={armyListPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-xs underline text-white/70 hover:text-white transition"
                    >
                      Voir le PDF uploadé
                    </a>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || uploadingPdf}
              className="
                mt-2 w-full rounded-xl
                border border-white/10
                bg-white/10 px-4 py-3
                font-semibold text-white
                shadow-[0_14px_40px_rgba(0,0,0,0.6)]
                transition hover:bg-white/15
                disabled:opacity-50
              "
            >
              {uploadingPdf
                ? "Upload PDF..."
                : saving
                ? "Enregistrement..."
                : "Enregistrer la partie"}
            </button>
          </form>

          <div className="mt-10 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="mt-4 text-center text-xs text-white/35">
            Record the battle. Learn the pattern.
          </div>
        </div>
      </div>
    </main>
  );
}
