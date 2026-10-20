import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireMediaAccess, mediaError } from "@/lib/media-auth";
import { rosterInput } from "@/lib/roster-input";
import { unitKey } from "@/lib/aln-parser";
export const runtime = "nodejs";
export async function GET(req: Request) { try {
    await requireMediaAccess(req);
    const gameId = new URL(req.url).searchParams.get("gameId") || undefined;
    const [rosters, games] = await Promise.all([prisma.armyRoster.findMany({ where: gameId ? { gameId } : {}, include: { units: { orderBy: { position: "asc" } } }, orderBy: { createdAt: "desc" }, take: 100 }), prisma.game.findMany({ where: { gameType: "40k" }, select: { id: true, opponent: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 500 })]);
    return Response.json({ rosters, games }, { headers: { "Cache-Control": "private, no-store" } });
}
catch (e) {
    return mediaError(e);
} }
export async function POST(req: Request) {
    try {
        await requireMediaAccess(req);
        const parsed = rosterInput.safeParse(await req.json());
        if (!parsed.success)
            return Response.json({ error: "Vérifie les unités, la faction et les attachements." }, { status: 400 });
        const { units, gameId, side, replace, ...data } = parsed.data;
        if (gameId) {
            const game = await prisma.game.findUnique({ where: { id: gameId }, select: { gameType: true } });
            if (!game || game.gameType !== "40k")
                return Response.json({ error: "Choisis une partie Warhammer 40k." }, { status: 400 });
        }
        const existing = await prisma.armyRoster.findUnique({ where: { importKey: data.importKey } });
        if (existing)
            return Response.json({ id: existing.id, alreadySaved: true });
        const collision = gameId ? await prisma.armyRoster.findUnique({ where: { gameId_side: { gameId, side } } }) : null;
        if (collision && !replace)
            return Response.json({ error: "Une liste existe déjà pour ce camp. Coche le remplacement après vérification." }, { status: 409 });
        const nested = units.map(u => ({ ...u, unitKey: unitKey(u.name), profile: u.profile ?? Prisma.DbNull }));
        const roster = await prisma.$transaction(async (tx) => { if (collision) {
            await tx.rosterUnit.deleteMany({ where: { rosterId: collision.id } });
            return tx.armyRoster.update({ where: { id: collision.id }, data: { ...data, gameId, side, units: { create: nested } }, select: { id: true } });
        } return tx.armyRoster.create({ data: { ...data, gameId, side, units: { create: nested } }, select: { id: true } }); });
        return Response.json(roster, { status: 201 });
    }
    catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
            return Response.json({ error: "Cette liste vient d’être enregistrée. Actualise avant de recommencer." }, { status: 409 });
        return mediaError(e);
    }
}
