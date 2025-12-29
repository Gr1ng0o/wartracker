"use client";

import { useState } from "react";
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

  const computedResult = myScore > oppScore ? "W" : "L";

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

  async function onPdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadFile(file);
      setArmyPdfUrl(url);
    } catch (err: any) {
      alert(err?.message ?? "Erreur upload PDF");
    } finally {
      setUploading(false);
      // reset input pour pouvoir re-uploader le même fichier
      e.target.value = "";
    }
  }

  async function onPhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Empêche l’enregistrement si upload en cours
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
          build,
          opponent,
          first,

          myScore,
          oppScore,

          myFaction,
          myDetachment,
          oppFaction,
          oppDetachment,

          armyListPdfUrl: armyPdfUrl || null,
          photoUrls,

          notes,
        }),
      });

      if (!res.ok) {
        let msg = "Erreur lors de l'enregistrement";
        try {
          const j = await res.json();
          msg = j?.error ?? msg;
        } catch {}
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
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-white shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/40k"
            className="inline-block rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            ← Menu 40k
          </Link>

          <Link
            href="/"
            className="inline-block rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            ⬅ Accueil
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Ajouter une partie • Warhammer 40k</h1>
          <p className="mt-1 text-sm text-gray-300">
            Résultat détecté via score :{" "}
            <span className="font-semibold text-white">
              {computedResult === "W" ? "Victoire" : "Défaite"}
            </span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">Ta liste / armée</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={build}
                onChange={(e) => setBuild(e.target.value)}
                placeholder="Ultramarines Gladius v2"
                required
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">Adversaire</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                placeholder="Orks"
                required
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Tu commences ?</span>
              <select
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={first ? "first" : "second"}
                onChange={(e) => setFirst(e.target.value === "first")}
              >
                <option value="first">Oui</option>
                <option value="second">Non</option>
              </select>
            </label>

            <div className="rounded-xl border border-white/10 bg-black/40 p-3 text-sm">
              <div className="text-gray-300">Résultat auto</div>
              <div className="mt-1 font-semibold">
                {computedResult === "W" ? "✅ Victoire" : "❌ Défaite"}
              </div>
            </div>

            <label className="space-y-1">
              <span className="text-sm font-medium">Ta faction</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={myFaction}
                onChange={(e) => setMyFaction(e.target.value)}
                placeholder="Ultramarines"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Ton détachement</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={myDetachment}
                onChange={(e) => setMyDetachment(e.target.value)}
                placeholder="Gladius Task Force"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Faction adverse</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={oppFaction}
                onChange={(e) => setOppFaction(e.target.value)}
                placeholder="Orks"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Détachement adverse</span>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={oppDetachment}
                onChange={(e) => setOppDetachment(e.target.value)}
                placeholder="Bully Boyz"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Ton score</span>
              <input
                type="number"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={myScore}
                onChange={(e) => setMyScore(Number(e.target.value))}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium">Score adverse</span>
              <input
                type="number"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                value={oppScore}
                onChange={(e) => setOppScore(Number(e.target.value))}
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">Liste d’armée (PDF)</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={onPdfChange}
                className="block w-full text-sm"
              />
              {armyPdfUrl ? (
                <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                  <a className="underline" href={armyPdfUrl} target="_blank" rel="noreferrer">
                    Voir le PDF
                  </a>
                  <button
                    type="button"
                    onClick={() => setArmyPdfUrl("")}
                    className="rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <div className="mt-1 text-xs text-gray-400">Aucun PDF uploadé</div>
              )}
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">Photos de la partie</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onPhotosChange}
                className="block w-full text-sm"
              />

              {!!photoUrls.length ? (
                <div className="mt-2 space-y-2">
                  <div className="text-sm text-gray-300">{photoUrls.length} photo(s) uploadée(s)</div>
                  <div className="flex flex-wrap gap-2">
                    {photoUrls.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => removePhoto(u)}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs hover:bg-white/15"
                        title="Retirer"
                      >
                        🖼️ Photo • retirer
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-xs text-gray-400">Aucune photo uploadée</div>
              )}
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">Notes</span>
              <textarea
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Moment clé, erreur, plan de jeu…"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="w-full rounded-xl bg-white/90 px-4 py-2 font-semibold text-black transition hover:bg-white disabled:opacity-50"
          >
            {uploading ? "Upload..." : saving ? "Enregistrement..." : "Enregistrer la partie 40k"}
          </button>
        </form>
      </div>
    </main>
  );
}
