"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

type Game = Omit<Prisma.GameGetPayload<{}>, "createdAt"> & { createdAt: string };

export default function GamesClient({ initialGames }: { initialGames: Game[] }) {
  const [games] = useState<Game[]>(initialGames);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return games;
    return games.filter((g) => {
      const hay = [g.gameType, g.build, g.opponent, g.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(s);
    });
  }, [games, q]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl p-6 pt-12">
        <div className="rounded-3xl border border-white/10 bg-black/60 p-6 text-white shadow-2xl backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold">Historique (global)</h1>
              <p className="mt-1 text-sm text-gray-300">
                {filtered.length}/{games.length} partie(s)
              </p>
            </div>

            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            >
              ⬅ Accueil
            </Link>
          </div>

          <div className="mt-6">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (jeu / build / adversaire / notes...)"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-white placeholder:text-gray-400"
            />
          </div>

          <div className="mt-6 space-y-3">
            {filtered.map((g) => (
              <div
                key={g.id}
                className="rounded-2xl border border-white/10 bg-black/40 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold">
                    {g.gameType.toUpperCase()} • {g.build} vs {g.opponent}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      g.result === "W"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-rose-500/20 text-rose-200"
                    }`}
                  >
                    {g.result === "W" ? "Victoire" : "Défaite"}
                  </span>
                </div>

                <div className="mt-1 text-sm text-gray-300">
                  {new Date(g.createdAt).toLocaleString("fr-FR")}
                </div>

                {g.notes?.trim() && (
                  <div className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">
                    {g.notes}
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-gray-300">
                Aucune partie ne match ta recherche.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
