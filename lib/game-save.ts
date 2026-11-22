import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseAlnText, hasAlnProfiles } from "@/lib/aln-parser";
import { rosterInput } from "@/lib/roster-input";
import { rosterUnits } from "@/lib/roster-persistence";
import { z } from "zod";



const numberInput = (schema: z.ZodNumber) => z.preprocess(value => value === "" || value === null ? undefined : typeof value === "string" ? Number(value) : value, schema);
const url = z.string().trim().max(2000).refine(value => !value || /^https?:\/\//i.test(value) && URL.canParse(value), "Lien invalide").nullable().optional();
const playedDate = z.preprocess(value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && z.iso.date().safeParse(value).success ? value + "T00:00:00.000Z" : value, z.iso.datetime());
const text = z.string().trim().max(10000).nullable().optional();
const rosterSource = z.union([
    z.object({ savedId: z.string().min(1).max(100) }),
    z.object({ draft: z.unknown() }),
]);
const input = z.object({
    gameType: z.enum(["40k", "FaB"]),
    opponent: z.string().trim().min(1).max(200),
    build: z.string().trim().min(1).max(200),
    first: z.boolean().default(true),
    status: z.enum(["in_progress", "submitted"]).default("submitted"),
    result: z.enum(["W", "L", "D"]).default("W"),
    playedAt: playedDate,
    points: numberInput(z.number().int().min(1).max(100000)).optional(),
    missionPack: text, primaryMission: text, deployment: text, terrainLayout: text,
    myFaction: text, myDetachment: text, oppFaction: text, oppDetachment: text,
    myScore: numberInput(z.number().int().min(0).max(1000)).optional(),
    oppScore: numberInput(z.number().int().min(0).max(1000)).optional(),
    myListText: text, oppListText: text, notes: text,
    scoreSheetUrl: url, myArmyPdfUrl: url, oppArmyPdfUrl: url,
    deploymentPhotoUrl: url, t1PhotoUrl: url, t2PhotoUrl: url, t3PhotoUrl: url, t4PhotoUrl: url, t5PhotoUrl: url,
    photoUrls: z.array(z.string().url().max(2000).refine(value => /^https?:\/\//i.test(value))).max(100).optional(),
    score: z.preprocess(value => value === "" || value === null ? null : typeof value === "string" ? Number(value) : value, z.number().int().min(-2147483648).max(2147483647).nullable()).optional(), tag1: text, tag2: text,
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

export async function saveGame(req: Request, id?: string) {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return Response.json({ error: "Données invalides." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Données invalides." }, { status: 400 });
    const raw = body as Record<string, unknown>;
    if (raw.status === "in_progress") {
        if (!["40k", "FaB"].includes(String(raw.gameType))) return Response.json({ error: "Jeu inconnu." }, { status: 400 });
        if (JSON.stringify(raw).length > 4 * 1024 * 1024) return Response.json({ error: "Brouillon trop volumineux." }, { status: 413 });
        const columns: Record<string, unknown> = {};
        const excluded = new Set(["status", "myRoster", "opponentRoster", "result", "playedAt"]);
        for (const [key, schema] of Object.entries(input.shape)) {
            if (excluded.has(key) || !(key in raw)) continue;
            const field = schema.safeParse(raw[key]);
            if (field.success && field.data !== undefined) columns[key] = field.data;
        }
        const date = playedDate.safeParse(raw.playedAt);
        if (date.success) columns.playedAt = new Date(date.data);
        const result = ["W", "L", "D"].includes(String(raw.result)) ? String(raw.result) : "W";
        const data = { ...columns, gameType: String(raw.gameType), result: "IN_PROGRESS:" + result, draftData: { version: 1, fields: raw } as Prisma.InputJsonValue };
        try {
            const game = id
                ? await prisma.game.update({ where: { id }, data, select: { id: true } })
                : await prisma.game.create({ data: { ...data, opponent: typeof columns.opponent === "string" ? columns.opponent : "", build: typeof columns.build === "string" ? columns.build : "" }, select: { id: true } });
            return Response.json({ ...game, status: "in_progress" }, { status: id ? 200 : 201 });
        } catch (error) {
            console.error("Save draft failed", error);
            return Response.json({ error: "Sauvegarde du brouillon impossible. Réessaie après avoir vérifié la connexion." }, { status: 503 });
        }
    }
    const parsed = input.safeParse(body);
    if (!parsed.success) {
        return Response.json({ error: "La validation nécessite de corriger les champs signalés.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    try {
        const { playedAt, myRoster, opponentRoster, status, ...data } = parsed.data;
        const is40k = data.gameType === "40k";
        if (is40k && (data.myScore === undefined || data.oppScore === undefined)) return Response.json({ error: "Renseigne les deux scores pour valider la partie." }, { status: 400 });
        const pending = raw.pendingImports && typeof raw.pendingImports === "object" ? raw.pendingImports as Record<string, unknown> : {};
        if ((pending.my && !myRoster) || (pending.opponent && !opponentRoster)) return Response.json({ error: "Un PDF reste à corriger : sélectionne-le à nouveau, choisis une liste enregistrée ou retire ce PDF du brouillon." }, { status: 422 });
        const [my, opponent] = is40k ? await Promise.all([
            prepareRoster("my", myRoster, data.myListText, data.myFaction),
            prepareRoster("opponent", opponentRoster, data.oppListText, data.oppFaction),
        ]) : [{}, {}];
        const errors = [my.error, opponent.error].filter(Boolean);
        if (errors.length) return Response.json({ error: errors.join("\n") }, { status: 422 });
        const rosters = [my.roster, opponent.roster].filter(roster => roster !== undefined);
        const gameData = {
                ...data,
                draftData: Prisma.DbNull,
                playedAt: playedAt ? new Date(playedAt) : undefined,
                result: is40k ? (data.myScore === data.oppScore ? "D" : data.myScore! > data.oppScore! ? "W" : "L") : data.result,
                myFaction: data.myFaction || my.roster?.faction || null,
                myDetachment: data.myDetachment || my.roster?.detachment || null,
                oppFaction: data.oppFaction || opponent.roster?.faction || null,
                oppDetachment: data.oppDetachment || opponent.roster?.detachment || null,
                ...(rosters.length ? { rosters: { ...(id ? { deleteMany: { side: { in: rosters.map(roster => roster.side) } } } : {}), create: rosters } } : {}),
        };
        const game = id
            ? await prisma.game.update({ where: { id }, data: gameData, select: { id: true } })
            : await prisma.game.create({ data: gameData, select: { id: true } });
        return Response.json(game, { status: id ? 200 : 201 });
    } catch (error) {
        console.error("Create game failed", error);
        return Response.json({ error: "Enregistrement impossible. Vérifie la connexion et les migrations de la base." }, { status: 503 });
    }
}
