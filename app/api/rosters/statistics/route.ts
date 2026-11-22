import { prisma } from "@/lib/prisma";
import { mediaError } from "@/lib/media-http";
import { unitStatistics } from "@/lib/unit-statistics";

export async function GET(req: Request) {
    try {
        const params = new URL(req.url).searchParams;
        const side = params.get("side") === "opponent" ? "opponent" : "my";
        const otherSide = side === "my" ? "opponent" : "my";
        const against = params.get("against")?.trim().slice(0, 200);
        const [rosters, factions] = await Promise.all([
            prisma.armyRoster.findMany({
                where: {
                    side,
                    gameId: { not: null },
                    ...(against ? { game: { rosters: { some: { side: otherSide, faction: { equals: against, mode: "insensitive" } } } } } : {}),
                },
                select: {
                    id: true, faction: true, side: true,
                    game: { select: { id: true, result: true, myScore: true, oppScore: true } },
                    units: { select: { name: true, points: true, models: true } },
                },
            }),
            prisma.armyRoster.findMany({
                where: { side: otherSide, game: { rosters: { some: { side } } } },
                distinct: ["faction"],
                orderBy: { faction: "asc" },
                select: { faction: true },
            }),
        ]);
        return Response.json({
            side, units: unitStatistics(rosters), rosteredGames: rosters.filter(roster => !roster.game?.result.startsWith("IN_PROGRESS")).length,
            opposingFactions: factions.map(({ faction }) => faction),
        }, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
        return mediaError(error);
    }
}
