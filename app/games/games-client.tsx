"use client";

import { useMemo, useState } from "react";
import type { GameDTO } from "../types";
import Link from "next/link";

export default function GamesClient({ initialGames }: { initialGames: GameDTO[] }) {
  const [type, setType] = useState<"all" | "40k" | "FaB">("all");
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
  const winrate = total ? Math.round((wins / total) * 100) : 0;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl bg-black/60 backdrop-blur-md p-6 text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold">Parties</h1>
          <p className="text-sm text-gray-300">
            Affichées : <span className="font-semibold">{total}</span> •
            Victoires : <span className="font-semibold">{wins}</span> •
            Défaites : <span className="font-semibold">{losses}</span> •
            Winrate : <span className="font-semibold">{winrate}%</span>
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <select
            className="rounded-lg border px-3 py-2 text-black"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="all">Tous</option>
            <option value="40k">40k</option>
            <option value="FaB">FaB</option>
          </select>

          <input
            className="w-56 rounded-lg border px-3 py-2 text-black"
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
              <Link
                href={`/games/${g.id}`}
                className="block rounded-xl bg-black/50 backdrop-blur-sm p-4 text-white hover:bg-white/5 transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    {/* ❌ plus de soulignement */}
                    <div className="font-semibold">
                      {g.gameType} — {g.build} vs {g.opponent}
                    </div>

                    {/* ✅ date + heure */}
                    <div className="text-xs text-gray-300">
                      Enregistrée le {dateStr}
                    </div>
                  </div>

                  {/* ✅ badge victoire / défaite */}
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
