import { PrismaClient } from "@prisma/client";
import GamesClient from "./games-client";

const prisma = new PrismaClient();

export default async function GamesPage() {
  const games = await prisma.game.findMany({ orderBy: { createdAt: "desc" } });
  return <GamesClient initialGames={games} />;
}
