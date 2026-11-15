import { prisma } from "@/lib/prisma";
import { mediaError } from "@/lib/media-http";
import { unitStatistics } from "@/lib/unit-statistics";
export async function GET(req: Request) { try {
    const side = new URL(req.url).searchParams.get("side") === "opponent" ? "opponent" : "my";
    const rosters = await prisma.armyRoster.findMany({ where: { side, gameId: { not: null } }, select: { id: true, faction: true, side: true, game: { select: { id: true, result: true, myScore: true, oppScore: true } }, units: { select: { name: true, points: true, models: true } } } });
    return Response.json({ side, units: unitStatistics(rosters), rosteredGames: rosters.length }, { headers: { "Cache-Control": "private, no-store" } });
}
catch (e) {
    return mediaError(e);
} }
