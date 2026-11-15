import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { parseAlnText, hasAlnProfiles } from "@/lib/aln-parser";
import { rosterInput } from "@/lib/roster-input";
import { rosterUnits } from "@/lib/roster-persistence";
import { z } from "zod";

export const runtime = "nodejs";

const text = z.string().trim().max(10000).nullable().optional();
const rosterSource = z.union([
    z.object({ savedId: z.string().min(1).max(100) }),
    z.object({ draft: z.unknown() }),
]);
const input = z.object({
    gameType: z.enum(["40k", "FaB"]),
    opponent: z.string().trim().min(1).max(200),
    build: z.string().trim().min(1).max(200).default("—"),
    first: z.boolean().default(true),
    result: z.enum(["W", "L", "D"]).default("W"),
    playedAt: z.iso.datetime().optional(),
    points: z.coerce.number().int().min(1).max(100000).optional(),
    missionPack: text, primaryMission: text, deployment: text, terrainLayout: text,
    myFaction: text, myDetachment: text, oppFaction: text, oppDetachment: text,
    myScore: z.coerce.number().int().min(0).max(1000).default(0),
    oppScore: z.coerce.number().int().min(0).max(1000).default(0),
    myListText: text, oppListText: text, notes: text,
    deploymentNotes: text, t1Notes: text, t2Notes: text, t3Notes: text, t4Notes: text, t5Notes: text,
    myRoster: rosterSource.optional(), opponentRoster: rosterSource.optional(),
});

async function prepareRoster(
    side: "my" | "opponent",
    source: z.infer<typeof rosterSource> | undefined,
    listText: string | null | undefined,
    faction: string | null | undefined,
) {
    const label = side === "my" ? "Ma liste" : "Liste adverse";
    let draft: unknown;
    if (source && "savedId" in source) {
        const saved = await prisma.armyRoster.findUnique({
            where: { id: source.savedId },
            include: { units: { orderBy: { position: "asc" } } },
        });
        if (!saved) return { error: label + " — la liste sélectionnée a été supprimée." };
        draft = saved;
    } else if (source && "draft" in source) {
        draft = source.draft;
    } else if (listText && hasAlnProfiles(listText)) {
        try {
            draft = {
                ...parseAlnText(listText),
                sourceHash: createHash("sha256").update(listText).digest("hex"),
            };
        } catch (error) {
            return { error: label + " — " + (error instanceof Error ? error.message : "Lecture impossible.") };
        }
    } else {
        return {};
    }

    if (!draft || typeof draft !== "object") return { error: label + " — liste invalide." };
    const parsed = rosterInput.safeParse({
        ...draft,
        faction: ("faction" in draft && draft.faction) || faction,
        importKey: randomUUID(),
        gameId: null,
        side,
        replace: false,
    });
    if (!parsed.success) {
        return { error: label + " — vérifie la faction, les unités et les attachements." };
    }
    const { gameId, replace, units, ...roster } = parsed.data;
    return { roster: { ...roster, units: { create: rosterUnits(units) } } };
}

export async function POST(req: Request) {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return Response.json({ error: "Données invalides." }, { status: 400 });
    }
    const parsed = input.safeParse(body);
    if (!parsed.success) {
        return Response.json({ error: "Vérifie les champs de la partie (adversaire, date et scores)." }, { status: 400 });
    }
    try {
        const { playedAt, myRoster, opponentRoster, ...data } = parsed.data;
        const is40k = data.gameType === "40k";
        const [my, opponent] = is40k ? await Promise.all([
            prepareRoster("my", myRoster, data.myListText, data.myFaction),
            prepareRoster("opponent", opponentRoster, data.oppListText, data.oppFaction),
        ]) : [{}, {}];
        const errors = [my.error, opponent.error].filter(Boolean);
        if (errors.length) return Response.json({ error: errors.join("\n") }, { status: 422 });
        const rosters = [my.roster, opponent.roster].filter(roster => roster !== undefined);
        const game = await prisma.game.create({
            data: {
                ...data,
                playedAt: playedAt ? new Date(playedAt) : undefined,
                result: is40k ? (data.myScore === data.oppScore ? "D" : data.myScore > data.oppScore ? "W" : "L") : data.result,
                myFaction: data.myFaction || my.roster?.faction,
                myDetachment: data.myDetachment || my.roster?.detachment,
                oppFaction: data.oppFaction || opponent.roster?.faction,
                oppDetachment: data.oppDetachment || opponent.roster?.detachment,
                ...(rosters.length ? { rosters: { create: rosters } } : {}),
            },
            select: { id: true },
        });
        return Response.json(game, { status: 201 });
    } catch (error) {
        console.error("Create game failed", error);
        return Response.json({ error: "Enregistrement impossible. Vérifie la connexion et les migrations de la base." }, { status: 503 });
    }
}
