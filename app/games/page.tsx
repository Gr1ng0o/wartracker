export const dynamic = "force-dynamic";
export const revalidate = 0;

import { PrismaClient } from "@prisma/client";
import GamesClient from "./games-client";
import Link from "next/link";
import type { GameDTO } from "../types";

const prisma = new PrismaClient();

export default async function GamesPage() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
  });

  const safeGames: GameDTO[] = games.map((g) => ({
    id: g.id,
    createdAt: g.createdAt.toISOString(),
    gameType: g.gameType,
    build: g.build,
    opponent: g.opponent,
    first: g.first,
    result: g.result,
    score: g.score,
    tag1: g.tag1,
    tag2: g.tag2,
    notes: g.notes,

    myFaction: g.myFaction,
    myDetachment: g.myDetachment,
    oppFaction: g.oppFaction,
    oppDetachment: g.oppDetachment,
    myScore: g.myScore,
    oppScore: g.oppScore,

    armyListPdfUrl: g.armyListPdfUrl,
    photoUrls: g.photoUrls,
  }));

  return (
    <main className="relative z-10 mx-auto max-w-4xl p-6 space-y-4">
      <Link
        href="/"
        className="inline-block rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
      >
        ← Accueil
      </Link>

      <GamesClient initialGames={safeGames} />
    </main>
  );
}
