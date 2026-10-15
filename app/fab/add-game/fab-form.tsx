"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, errorMessage } from "@/lib/client-api";

export default function FabForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const inputClass =
    "mt-2 w-full rounded-xl border border-white/20 bg-black/60 p-3 text-white";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const localDate = String(form.get("playedAt") || "");
    const playedAt = new Date(localDate);
    if (Number.isNaN(playedAt.getTime())) {
      setMessage("Choisis une date valide.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await apiRequest("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "FaB",
          build: form.get("build"),
          opponent: form.get("opponent"),
          first: form.get("first") === "on",
          result: form.get("result"),
          score: form.get("score"),
          tag1: form.get("tag1"),
          tag2: form.get("tag2"),
          notes: form.get("notes"),
          playedAt: playedAt.toISOString(),
        }),
      });
      router.push("/fab/games");
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-14 text-white">
      <div className="rounded-3xl border border-white/10 bg-black/75 p-6 sm:p-8">
        <Link href="/fab" className="text-sm text-amber-100">
          ← Espace Flesh and Blood
        </Link>
        <h1 className="mt-6 text-3xl font-bold">Ajouter une partie FaB</h1>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block">
            Date et heure
            <input
              name="playedAt"
              type="datetime-local"
              required
              className={inputClass}
            />
          </label>
          <label className="block">
            Ton deck / héros
            <input
              name="build"
              required
              maxLength={200}
              placeholder="Enigma — version du deck"
              className={inputClass}
            />
          </label>
          <label className="block">
            Adversaire / héros
            <input
              name="opponent"
              required
              maxLength={200}
              placeholder="Nom ou héros adverse"
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-3">
            <input name="first" type="checkbox" defaultChecked /> Tu as commencé
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label>
              Résultat
              <select name="result" className={inputClass}>
                <option value="W">Victoire</option>
                <option value="L">Défaite</option>
                <option value="D">Égalité</option>
              </select>
            </label>
            <label>
              Score / PV restants (optionnel)
              <input
                name="score"
                type="number"
                step="1"
                className={inputClass}
              />
            </label>
            <label>
              Format / tag
              <input
                name="tag1"
                maxLength={200}
                placeholder="Classic Constructed, Armory…"
                className={inputClass}
              />
            </label>
            <label>
              Événement / tag
              <input name="tag2" maxLength={200} className={inputClass} />
            </label>
          </div>
          <label className="block">
            Notes
            <textarea
              name="notes"
              maxLength={20_000}
              rows={7}
              placeholder="Décisions clés, erreurs, ajustements à tester…"
              className={inputClass}
            />
          </label>
          {message ? (
            <p role="alert" className="text-red-200">
              {message}
            </p>
          ) : null}
          <button
            disabled={saving}
            className="w-full rounded-xl bg-amber-100 p-3 font-semibold text-black disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer la partie"}
          </button>
        </form>
      </div>
    </main>
  );
}
