import { prisma } from "@/lib/prisma";
import GamesClient from "./games-client";
export const dynamic="force-dynamic";
export default async function Page(){const games=await prisma.game.findMany({where:{gameType:"40k"},orderBy:[{playedAt:"desc"},{createdAt:"desc"}]});return <GamesClient initialGames={games.map(g=>({...g,createdAt:g.createdAt.toISOString(),playedAt:g.playedAt?.toISOString()??null}))}/>;}
