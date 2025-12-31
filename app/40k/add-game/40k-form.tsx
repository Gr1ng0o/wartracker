"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Add40kForm() {
  const router = useRouter();

  const [build, setBuild] = useState("");
  const [opponent, setOpponent] = useState("");
  const [first, setFirst] = useState(true);

  const [myFaction, setMyFaction] = useState("");
  const [myDetachment, setMyDetachment] = useState("");
  const [oppFaction, setOppFaction] = useState("");
  const [oppDetachment, setOppDetachment] = useState("");

  const [myScore, setMyScore] = useState<number>(0);
  const [oppScore, setOppScore] = useState<number>(0);

  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Fichiers (URLs renvoyées par /api/upload)
  const [armyPdfUrl, setArmyPdfUrl] = useState<string>("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const resultLabel =
    myScore === oppScore ? "Égalité" : myScore > oppScore ? "Victoire" : "Défaite";
  // Pour rester compatible avec ton modèle actuel ("W" | "L")
  const computedResult: "W" | "L" = myScore > oppScore ? "W" : "L";

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      // ignore
    }

    if (!res.ok) {
      throw new Error(json?.error ?? `Upload failed (${res.status})`);
    }
    if (!json?.url || typeof json.url !== "string") {
      throw new Error("Upload failed: no url returned");
    }
    return json.url as string;
  }

  async function onPdfChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      if (file.type !== "application/pdf") {
        throw new Error("Merci de sélectionner un fichier PDF.");
      }
      const url = await uploadFile(file);
      setArmyPdfUrl(url);
    } catch (err: any) {
      alert(err?.message ?? "Erreur upload PDF");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onPhotosChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        urls.push(await uploadFile(f));
      }
      setPhotoUrls((prev) => [...prev, ...urls]);
    } catch (err: any) {
      alert(err?.message ?? "Erreur upload photo(s)");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removePhoto(url: string) {
    setPhotoUrls((prev) => prev.filter((x) => x !== url));
  }

  function resetForm() {
    setBuild("");
    setOpponent("");
    setFirst(true);

    setMyFaction("");
    setMyDetachment("");
    setOppFaction("");
    setOppDetachment("");

    setMyScore(0);
    setOppScore(0);

    setNotes("");

    setArmyPdfUrl("");
    setPhotoUrls([]);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (uploading) {
      alert("Attends la fin de l’upload avant d’enregistrer.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "40k",
          build: build.trim(),
          opponent: opponent.trim(),
          first,

          myScore,
          oppScore,

          myFaction: myFaction.trim() || null,
          myDetachment: myDetachment.trim() || null,
          oppFaction: oppFaction.trim() || null,
          oppDetachment: oppDetachment.trim() || null,

          // IMPORTANT: garde le nom "armyListPdfUrl" comme dans ta page détail
          armyListPdfUrl: armyPdfUrl || null,
          photoUrls,

          notes,
          result: computedResult, // ✅ si ton schema l'attend déjà
        }),
      });

      if (!res.ok) {
        let msg = "Erreur lors de l'enregistrement";
        try {
          const j = await res.json();
          msg = j?.error ?? msg;
        } catch {
          const t = await res.text().catch(() => "");
          if (t) msg = t;
        }
        alert(msg);
        return;
      }

      alert("Partie 40k enregistrée ✅");
      router.push("/40k/games");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Vignette + fumée (grimdark global) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute inset-0 opacity-35 blur-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,120,40,0.10),transparent_55%),radial-gradient(circle_at_75%_70%,rgba(255,200,120,0.06),transparent_60%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-4xl items-start px-6 py-14">
        <div className="w-full rounded-[28px] border border-white/10 bg-black/55 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.85)] backdrop-blur-md">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/40k/games"
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15 transition"
            >
              ← Retour 40k
            </Link>

            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/15 transition"
              >
                Reset
              </button>
              <div className="hidden sm:block text-[10px] tracking-[0.35em] text-white/35">
                ADD • GAME • LOG
              </div>
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
              AJOUTER UNE PARTIE • 40K
            </h1>

            <div className="mt-4 h-px w-56 bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div className="mt-3 text-sm text-white/60">
              Résultat détecté via score :{" "}
              <span className="font-semibold text-white">{resultLabel}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Build */}
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-white/80">
                  Ta liste / armée
                </span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={build}
                  onChange={(e) => setBuild(e.target.value)}
                  placeholder="Ultramarines Gladius v2"
                  required
                />
              </label>

              {/* Opponent */}
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-white/80">
                  Adversaire
                </span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder="Orks"
                  required
                />
              </label>

              {/* First */}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">
                  Tu commences ?
                </span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={first ? "first" : "second"}
                  onChange={(e) => setFirst(e.target.value === "first")}
                >
                  <option value="first">Oui</option>
                  <option value="second">Non</option>
                </select>
              </label>

              {/* Result card */}
              <div className="rounded-xl border border-white/10 bg-black/50 p-4">
                <div className="text-xs tracking-[0.25em] text-white/35">
                  RÉSULTAT AUTO
                </div>
                <div className="mt-2 text-lg font-bold text-white">
                  {myScore === oppScore
                    ? "⚖️ Égalité"
                    : computedResult === "W"
                    ? "✅ Victoire"
                    : "❌ Défaite"}
                </div>
                <div className="mt-1 text-xs text-white/45">
                  Basé sur le score {myScore} - {oppScore}
                </div>
              </div>

              {/* Factions */}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">
                  Ta faction
                </span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={myFaction}
                  onChange={(e) => setMyFaction(e.target.value)}
                  placeholder="Ultramarines"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">
                  Ton détachement
                </span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={myDetachment}
                  onChange={(e) => setMyDetachment(e.target.value)}
                  placeholder="Gladius Task Force"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">
                  Faction adverse
                </span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={oppFaction}
                  onChange={(e) => setOppFaction(e.target.value)}
                  placeholder="Orks"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">
                  Détachement adverse
                </span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={oppDetachment}
                  onChange={(e) => setOppDetachment(e.target.value)}
                  placeholder="Bully Boyz"
                />
              </label>

              {/* Scores */}
              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">
                  Ton score
                </span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={myScore}
                  onChange={(e) => setMyScore(Number(e.target.value || 0))}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-white/80">
                  Score adverse
                </span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  value={oppScore}
                  onChange={(e) => setOppScore(Number(e.target.value || 0))}
                />
              </label>

              {/* PDF */}
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white/80">
                    Liste d’armée (PDF)
                  </span>

                  {armyPdfUrl && (
                    <button
                      type="button"
                      onClick={() => setArmyPdfUrl("")}
                      className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/15 transition"
                    >
                      Retirer
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={onPdfChange}
                  disabled={uploading}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white/80 outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                />

                {armyPdfUrl ? (
                  <a
                    className="inline-block text-xs underline text-white/70 hover:text-white transition"
                    href={armyPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📄 Voir le PDF
                  </a>
                ) : (
                  <div className="text-xs text-white/45">Aucun PDF uploadé</div>
                )}
              </div>

              {/* Photos */}
              <div className="space-y-2 sm:col-span-2">
                <div className="text-sm font-semibold text-white/80">
                  Photos de la partie
                </div>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPhotosChange}
                  disabled={uploading}
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white/80 outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                />

                {!!photoUrls.length ? (
                  <div className="mt-2 space-y-2">
                    <div className="text-xs text-white/55">
                      {photoUrls.length} photo(s) uploadée(s)
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {photoUrls.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => removePhoto(u)}
                          className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/15 transition"
                          title="Retirer"
                        >
                          🖼️ Retirer
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-white/45">
                    Aucune photo uploadée
                  </div>
                )}
              </div>

              {/* Notes */}
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-semibold text-white/80">Notes</span>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-amber-200/20"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Moment clé, erreur, plan de jeu…"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving || uploading}
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
              {uploading
                ? "Upload..."
                : saving
                ? "Enregistrement..."
                : "Enregistrer la partie 40k"}
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
