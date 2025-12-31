import { PrismaClient } from "@prisma/client";
import GamesClient40k from "./games-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient();

export default async function Page() {
  const games = await prisma.game.findMany({
    where: { gameType: "40k" },
    orderBy: { createdAt: "desc" },
  });

  const safeGames = JSON.parse(JSON.stringify(games));
  return <GamesClient40k initialGames={safeGames} />;
}
