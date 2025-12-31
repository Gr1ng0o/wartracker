"use client";

import { useMemo, useState } from "react";
import type { GameDTO } from "../types";

export default function GamesClient({
  initialGames,
}: {
  initialGames: GameDTO[];
}) {
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
  const winrate = total ? Math.round((wins / total) * 100) : 0;

  return (
    <main className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl bg-black/60 backdrop-blur-md p-6 text-white shadow-xl">
        <div>
          <h1 className="text-3xl font-bold">Parties</h1>
          <p className="text-sm text-gray-500">
            Winrate :{" "}
            <span className="font-semibold">{winrate}%</span> ({wins}/{total})
          </p>
        </div>

        <div className="flex gap-2">
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
        {filtered.map((g) => (
          <li
            key={g.id}
            className="rounded-xl bg-black/50 backdrop-blur-sm p-4 text-white shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold">
                {g.gameType} — {g.build} vs {g.opponent}
              </div>
            </div>

            {g.notes && <p className="mt-2 text-sm">{g.notes}</p>}

            <p className="mt-2 text-xs text-gray-400">
              {new Date(g.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
