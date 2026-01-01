export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import GamesClient40k from "./games-client";

export default async function Page40kGames() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <GamesClient40k initialGames={games as any} />;
}
