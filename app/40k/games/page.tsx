export const dynamic = "force-dynamic";
export const revalidate = 0;

import { PrismaClient } from "@prisma/client";
import Games40kClient from "./games-client";

const prisma = new PrismaClient();

export default async function Games40kPage() {
  const games = await prisma.game.findMany({
  where: { gameType: "40k" },
  orderBy: { createdAt: "desc" },
});


  return <Games40kClient initialGames={games} />;
}
