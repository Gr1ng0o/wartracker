"use client";

import { useMemo, useState } from "react";
import type { GameDTO } from "../types";
import { formatGameDate } from "@/lib/date";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, errorMessage } from "@/lib/client-api";

export default function GamesClient({
  initialGames,
  gameType,
}: {
  initialGames: GameDTO[];
  gameType?: "40k" | "FaB";
}) {
  const router = useRouter();

  const [type, setType] = useState<"all" | "40k" | "FaB">(gameType ?? "all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return initialGames.filter((g) => {
      const okType = type === "all" ? true : g.gameType === type;
      const okQ =
        qq === ""
          ? true
          : (g.opponent || "").toLowerCase().includes(qq) ||
            (g.build || "").toLowerCase().includes(qq);
      return okType && okQ;
    });
  }, [initialGames, type, q]);

  const total = filtered.length;
  const wins = filtered.filter((g) => g.result === "W").length;
  const losses = filtered.filter((g) => g.result === "L").length;
  const draws = filtered.filter((g) => g.result === "D").length;
  const decisive = wins + losses;
  const winrate = decisive ? Math.round((wins / decisive) * 100) : 0;

  async function deleteGame(id: string) {
    const confirmed = confirm("Supprimer définitivement cette partie ?");
    if (!confirmed) return;

    try {
      await apiRequest(`/api/games/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (error) {
      alert(errorMessage(error));
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl bg-black/60 backdrop-blur-md p-6 text-white shadow-xl">
        <div>
          <Link
            href={gameType === "FaB" ? "/fab" : "/"}
            className="text-sm text-amber-100"
          >
            ← Accueil
          </Link>
          <h1 className="mt-4 text-3xl font-bold">
            {gameType === "FaB"
              ? "Parties Flesh and Blood"
              : "Toutes les parties"}
          </h1>
          <Link
            href={gameType === "FaB" ? "/fab/add-game" : "/40k/add-game"}
            className="mt-3 inline-block rounded-xl bg-white/15 px-4 py-2"
          >
            Ajouter une partie
          </Link>
          <Link href="/api/import" className="ml-4 text-sm text-white/70">
            Importer un CSV
          </Link>
          <p className="text-sm text-gray-300">
            Affichées : <span className="font-semibold">{total}</span> •
            Victoires : <span className="font-semibold">{wins}</span> • Défaites
            : <span className="font-semibold">{losses}</span> • Égalités :{" "}
            <span className="font-semibold">{draws}</span> • Winrate :{" "}
            <span className="font-semibold">{winrate}%</span> (sur W/L)
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select
            className="rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-white"
            value={type}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "all" || value === "40k" || value === "FaB")
                setType(value);
            }}
            disabled={Boolean(gameType)}
          >
            <option value="all">Tous</option>
            <option value="40k">40k</option>
            <option value="FaB">FaB</option>
          </select>

          <input
            className="w-full min-w-0 rounded-lg border border-white/20 bg-black/60 px-3 py-2 text-white placeholder:text-white/40 sm:w-64"
            placeholder="Rechercher (opponent/build)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-xl bg-black/60 p-6 text-white/70">
          Aucune partie à afficher.
        </p>
      ) : null}
      <ul className="mt-4 grid gap-3">
        {filtered.map((g) => {
          const dateStr = formatGameDate(g.playedAt ?? g.createdAt);

          const isWin = g.result === "W";
          const isLoss = g.result === "L";

          const badgeText = isWin ? "Victoire" : isLoss ? "Défaite" : g.result;
          const badgeClass = isWin
            ? "bg-green-500/20 text-green-200 ring-1 ring-green-500/30"
            : isLoss
              ? "bg-red-500/20 text-red-200 ring-1 ring-red-500/30"
              : "bg-white/10 text-gray-200 ring-1 ring-white/20";

          return (
            <li key={g.id} className="rounded-xl shadow-lg">
              <div className="relative rounded-xl bg-black/50 backdrop-blur-sm p-4 pb-12 text-white">
                {/* lien détail */}
                <Link
                  href={`/${g.gameType === "FaB" ? "fab" : "40k"}/games/${g.id}`}
                  className="block hover:bg-white/5 transition rounded-lg"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-semibold">
                        {g.gameType} — {g.build} vs {g.opponent}
                      </div>

                      <div className="text-xs text-gray-300">
                        Jouée le {dateStr}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                    >
                      {badgeText}
                    </span>
                  </div>
                </Link>

                {/* bouton suppression */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteGame(g.id);
                  }}
                  className="absolute right-3 bottom-3 rounded-lg bg-red-600/80 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
