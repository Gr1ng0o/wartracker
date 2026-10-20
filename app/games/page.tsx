import { prisma } from "@/lib/prisma";
import GamesClient from "./games-client";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export default async function Page() {
 const games = await prisma.game.findMany({ orderBy: { createdAt: "desc" } });
 return <GamesClient initialGames={games.map(g => ({...g,createdAt:g.createdAt.toISOString(),playedAt:g.playedAt?.toISOString()??null}))} />;
}
