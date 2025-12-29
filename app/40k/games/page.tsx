export const dynamic = "force-dynamic";
export const revalidate = 0;

import { PrismaClient } from "@prisma/client";
import GamesClient from "./games-client";

const prisma = new PrismaClient();

export default async function GamesPage() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
  });

  const safeGames = games.map((g) => ({
    ...g,
    createdAt: g.createdAt.toISOString(), // Date -> string
  }));

  return <GamesClient initialGames={safeGames} />;
}
