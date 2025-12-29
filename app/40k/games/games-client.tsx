"use client";

import { useState } from "react";
import type { Prisma } from "@prisma/client";

type Game = Omit<Prisma.GameGetPayload<{}>, "createdAt"> & {
  createdAt: string;
};

export default function GamesClient({ initialGames }: { initialGames: Game[] }) {
  const [games] = useState<Game[]>(initialGames);

  return (
    <main className="min-h-screen p-6 text-white">
      <h1 className="text-3xl font-bold">Parties</h1>

      <div className="mt-6 space-y-3">
        {games.map((g) => (
          <div key={g.id} className="rounded-xl border border-white/10 bg-black/40 p-4">
            <div className="font-semibold">
              {g.build} vs {g.opponent}
            </div>
            <div className="text-sm text-gray-300">
              {new Date(g.createdAt).toLocaleString("fr-FR")}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
