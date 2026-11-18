import { prisma } from "@/lib/prisma";
import GamesClient from "../../games/games-client";
export const dynamic = "force-dynamic";
export default async function Page() {
 const games = await prisma.game.findMany({where:{gameType:"FaB"},orderBy:{createdAt:"desc"}});
 return <GamesClient initialGames={games.map(g=>({...g,createdAt:g.createdAt.toISOString(),playedAt:g.playedAt?.toISOString()??null}))} />;
}
