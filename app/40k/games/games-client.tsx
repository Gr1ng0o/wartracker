"use client";

import { useMemo, useState } from "react";
import type { GameDTO } from "../../types";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GamesClient40k({
  initialGames,
}: {
  initialGames: GameDTO[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return initialGames
      .filter((g) => g.gameType === "40k")
      .filter((g) => {
        if (!qq) return true;
        return (
          (g.opponent || "").toLowerCase().includes(qq) ||
          (g.build || "").toLowerCase().includes(qq)
        );
      });
  }, [initialGames, q]);

  const total = filtered.length;
  const wins = filtered.filter((g) => g.result === "W").length;
  const losses = filtered.filter((g) => g.result === "L").length;
  const winrate = total ? Math.round((wins / total) * 100) : 0;

  async function deleteGame(id: string) {
    const confirmed = confirm("Supprimer définitivement cette partie 40k ?");
    if (!confirmed) return;

    const res = await fetch(`/api/games/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Erreur lors de la suppression");
      return;
    }
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl bg-black/60 backdrop-blur-md p-6 text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold">Parties 40k</h1>
          <p className="text-sm text-gray-300">
            Affichées : <span className="font-semibold">{total}</span> •
            Victoires : <span className="font-semibold">{wins}</span> •
            Défaites : <span className="font-semibold">{losses}</span> •
            Winrate : <span className="font-semibold">{winrate}%</span>
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="w-72 rounded-lg border px-3 py-2 text-black"
            placeholder="Rechercher (opponent/build)…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <ul className="mt-4 grid gap-3">
        {filtered.map((g) => {
          const created = new Date(g.createdAt);
          const dateStr = created.toLocaleString("fr-FR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });

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
              <div className="relative rounded-xl bg-black/50 backdrop-blur-sm p-4 text-white">
                <Link
                  href={`/40k/games/${g.id}`}
                  className="block hover:bg-white/5 transition rounded-lg"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="font-semibold">
                        {g.build} vs {g.opponent}
                      </div>
                      <div className="text-xs text-gray-300">
                        Enregistrée le {dateStr}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                    >
                      {badgeText}
                    </span>
                  </div>
                </Link>

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
