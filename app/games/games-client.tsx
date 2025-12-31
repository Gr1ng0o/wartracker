"use client";

import { useMemo, useState } from "react";
import type { GameDTO } from "./page";

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
      <div className="rounded-2xl bg-black/60 backdrop-blur-md p-6 text-white shadow-xl space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Parties</h1>
          <p className="text-sm text-gray-400">
            Winrate :{" "}
            <span className="font-semibold">{winrate}%</span> ({wins}/{total})
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
            placeholder="Rechercher (opponent / build)…"
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

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    g.result === "W"
                      ? "bg-green-500/20 text-green-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {g.result}
                </span>

                {g.score !== null && (
                  <span className="rounded-full bg-gray-500/20 px-2 py-1 text-xs font-semibold">
                    score : {g.score}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-400">
              <span>{g.first ? "Je commence" : "Je ne commence pas"}</span>

              {g.tag1 && (
                <span className="rounded-full bg-gray-500/20 px-2 py-1 text-xs">
                  {g.tag1}
                </span>
              )}
              {g.tag2 && (
                <span className="rounded-full bg-gray-500/20 px-2 py-1 text-xs">
                  {g.tag2}
                </span>
              )}
            </div>

            {g.notes && <p className="mt-2 text-sm">{g.notes}</p>}

            <p className="mt-2 text-xs text-gray-500">
              {new Date(g.createdAt).toLocaleString()}
            </p>

            {g.armyListPdfUrl && (
              <a
                href={g.armyListPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-blue-400 hover:underline"
              >
                📄 Liste d’armée
              </a>
            )}

            {g.photoUrls && g.photoUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {g.photoUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    📷 Photo {i + 1}
                  </a>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
