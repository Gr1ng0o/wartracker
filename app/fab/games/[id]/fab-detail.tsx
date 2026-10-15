"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { GameDTO } from "@/app/types";
import { formatGameDate } from "@/lib/date";
import { apiRequest, errorMessage } from "@/lib/client-api";

export default function FabDetail({ game }: { game: GameDTO }) {
  const router = useRouter();
  const [notes, setNotes] = useState(game.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      await apiRequest(`/api/games/${game.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setMessage("Notes sauvegardées.");
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Supprimer définitivement cette partie FaB ?")) return;
    setBusy(true);
    setMessage("");
    try {
      await apiRequest(`/api/games/${game.id}`, { method: "DELETE" });
      router.push("/fab/games");
      router.refresh();
    } catch (error) {
      setMessage(errorMessage(error));
      setBusy(false);
    }
  }

  const result =
    game.result === "W"
      ? "Victoire"
      : game.result === "L"
        ? "Défaite"
        : "Égalité";
  return (
    <main className="mx-auto max-w-3xl px-6 py-14 text-white">
      <div className="rounded-3xl border border-white/10 bg-black/75 p-6 sm:p-8">
        <Link href="/fab/games" className="text-sm text-amber-100">
          ← Historique FaB
        </Link>
        <h1 className="mt-6 break-words text-3xl font-bold">
          {game.build} vs {game.opponent}
        </h1>
        <p className="mt-4 text-white/70">
          {result} •{" "}
          {formatGameDate(game.playedAt ?? game.createdAt)} •{" "}
          {game.first ? "Tu as commencé" : "L’adversaire a commencé"}
        </p>
        {game.score != null ? (
          <p className="mt-3">Score / PV restants : {game.score}</p>
        ) : null}
        {[game.tag1, game.tag2].some(Boolean) ? (
          <p className="mt-3 text-white/70">
            {[game.tag1, game.tag2].filter(Boolean).join(" • ")}
          </p>
        ) : null}
        <label htmlFor="fab-notes" className="mt-8 block">
          Notes
        </label>
          <textarea
            id="fab-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={20_000}
            rows={10}
            className="mt-3 w-full rounded-xl border border-white/20 bg-black/60 p-3"
          />
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={save}
            className="rounded-xl bg-amber-100 px-4 py-3 font-semibold text-black disabled:opacity-50"
          >
            {busy ? "En cours…" : "Sauvegarder"}
          </button>
          <button
            disabled={busy}
            onClick={remove}
            className="rounded-xl border border-red-300/30 px-4 py-3 text-red-200 disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
        {message ? (
          <p role="status" className="mt-4 text-sm">
            {message}
          </p>
        ) : null}
      </div>
    </main>
  );
}
