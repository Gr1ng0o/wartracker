"use client";

import { useState } from "react";

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
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      }),
    });

    setSaving(false);

    if (!res.ok) {
      alert("Erreur lors de l'enregistrement");
      return;
    }

    // Reset form
    setBuild("");
    setOpponent("");
    setFirst(true);
    setResult("W");
    setScore("");
    setTag1("");
    setTag2("");
    setNotes("");

    alert("Partie enregistrée ✅");
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-white shadow-2xl backdrop-blur-md">
        <h1 className="text-3xl font-bold">Ajouter une partie</h1>
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
                onChange={(e) =>
                  setGameType(e.target.value as "40k" | "FaB")
                }
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
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full rounded-xl bg-white/90 px-4 py-2 font-semibold text-black transition hover:bg-white disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer la partie"}
          </button>
        </form>
      </div>
    </main>
  );
}
