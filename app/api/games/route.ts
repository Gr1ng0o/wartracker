import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";

function parseNullableNumber(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseNullableInt(v: unknown): number | null {
  const n = parseNullableNumber(v);
  if (n === null) return null;
  const i = Math.trunc(n);
  return Number.isFinite(i) ? i : null;
}

function parseNullableString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function parsePhotoUrls(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .filter((x) => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  if (typeof v === "string") {
    return v
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function isMissingColumnError(e: any) {
  const msg = String(e?.message ?? "");
  return e?.code === "P2022" || msg.includes("does not exist");
}

function buildTimelineNotesBlock(input: {
  deploymentNotes: string | null;
  t1Notes: string | null;
  t2Notes: string | null;
  t3Notes: string | null;
  t4Notes: string | null;
  t5Notes: string | null;
}): string {
  const payload = {
    deploymentNotes: input.deploymentNotes,
    t1Notes: input.t1Notes,
    t2Notes: input.t2Notes,
    t3Notes: input.t3Notes,
    t4Notes: input.t4Notes,
    t5Notes: input.t5Notes,
  };

  const hasAny = Object.values(payload).some((v) => Boolean(v && v.trim()));
  if (!hasAny) return "";

  return `\n\n/*WT_TIMELINE_V1:${JSON.stringify(payload)}:WT_TIMELINE_V1*/`;
}

/**
 * ✅ IMPORTANT:
 * Tant que la DB n’a pas les colonnes timeline, Prisma ne doit PAS les “RETURN”.
 * Donc on force un select sans les champs timeline.
 */
const SAFE_SELECT_BASE = {
  id: true,
  createdAt: true,
  gameType: true,

  build: true,
  opponent: true,
  first: true,
  result: true,
  score: true,
  tag1: true,
  tag2: true,
  notes: true,

  myFaction: true,
  myDetachment: true,
  oppFaction: true,
  oppDetachment: true,
  myScore: true,
  oppScore: true,

  myArmyPdfUrl: true,
  oppArmyPdfUrl: true,
  scoreSheetUrl: true,

  photoUrls: true,
} as const;

const SAFE_SELECT_WITH_LIST_TEXT = {
  ...SAFE_SELECT_BASE,
  myListText: true,
  oppListText: true,
} as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const gameType = parseNullableString(body.gameType) ?? "40k";

    const build = parseNullableString(body.build) ?? "—";
    const opponent = parseNullableString(body.opponent);
    if (!opponent) {
      return Response.json(
        { error: "Champs requis manquants: opponent" },
        { status: 400 }
      );
    }

    const first = typeof body.first === "boolean" ? body.first : true;

    const result =
      body.result === "W" || body.result === "L" || body.result === "D"
        ? body.result
        : "W";

    const score = parseNullableInt(body.score);
    const tag1 = parseNullableString(body.tag1);
    const tag2 = parseNullableString(body.tag2);

    // notes "globales"
    const notesBase = parseNullableString(body.notes);

    const myFaction = parseNullableString(body.myFaction);
    const myDetachment = parseNullableString(body.myDetachment);
    const oppFaction = parseNullableString(body.oppFaction);
    const oppDetachment = parseNullableString(body.oppDetachment);

    const myScore = parseNullableInt(body.myScore);
    const oppScore = parseNullableInt(body.oppScore);

    const myArmyPdfUrl = parseNullableString(body.myArmyPdfUrl);
    const oppArmyPdfUrl = parseNullableString(body.oppArmyPdfUrl);
    const myListText = parseNullableString(body.myListText);
    const oppListText = parseNullableString(body.oppListText);
    const scoreSheetUrl = parseNullableString(body.scoreSheetUrl);

    const photoUrls = parsePhotoUrls(body.photoUrls);

    // ✅ on parse les champs timeline
    const deploymentNotes = parseNullableString(body.deploymentNotes);
    const t1Notes = parseNullableString(body.t1Notes);
    const t2Notes = parseNullableString(body.t2Notes);
    const t3Notes = parseNullableString(body.t3Notes);
    const t4Notes = parseNullableString(body.t4Notes);
    const t5Notes = parseNullableString(body.t5Notes);

    // photos timeline
    const deploymentPhotoUrl = parseNullableString(body.deploymentPhotoUrl);
    const t1PhotoUrl = parseNullableString(body.t1PhotoUrl);
    const t2PhotoUrl = parseNullableString(body.t2PhotoUrl);
    const t3PhotoUrl = parseNullableString(body.t3PhotoUrl);
    const t4PhotoUrl = parseNullableString(body.t4PhotoUrl);
    const t5PhotoUrl = parseNullableString(body.t5PhotoUrl);

    const baseData: any = {
      gameType,
      build,
      opponent,
      first,
      result,

      score: score ?? undefined,
      tag1: tag1 ?? undefined,
      tag2: tag2 ?? undefined,

      // ✅ notes post-partie uniquement (sans timeline)
      notes: notesBase ?? undefined,

      myFaction: myFaction ?? undefined,
      myDetachment: myDetachment ?? undefined,
      oppFaction: oppFaction ?? undefined,
      oppDetachment: oppDetachment ?? undefined,
      myScore: myScore ?? undefined,
      oppScore: oppScore ?? undefined,

      myArmyPdfUrl: myArmyPdfUrl ?? undefined,
      oppArmyPdfUrl: oppArmyPdfUrl ?? undefined,
      myListText: myListText ?? undefined,
      oppListText: oppListText ?? undefined,
      scoreSheetUrl: scoreSheetUrl ?? undefined,

      photoUrls,
    };

    const fullData: any = {
      ...baseData,
      // ✅ Timeline -> colonnes dédiées
      deploymentNotes: deploymentNotes ?? undefined,
      t1Notes: t1Notes ?? undefined,
      t2Notes: t2Notes ?? undefined,
      t3Notes: t3Notes ?? undefined,
      t4Notes: t4Notes ?? undefined,
      t5Notes: t5Notes ?? undefined,

      deploymentPhotoUrl: deploymentPhotoUrl ?? undefined,
      t1PhotoUrl: t1PhotoUrl ?? undefined,
      t2PhotoUrl: t2PhotoUrl ?? undefined,
      t3PhotoUrl: t3PhotoUrl ?? undefined,
      t4PhotoUrl: t4PhotoUrl ?? undefined,
      t5PhotoUrl: t5PhotoUrl ?? undefined,
    };

    try {
      const game = await prisma.game.create({
        data: fullData,
        select: SAFE_SELECT_WITH_LIST_TEXT,
      });
      return Response.json({ ...game, warning: null }, { status: 201 });
    } catch (e: any) {
      if (!isMissingColumnError(e)) throw e;
    }

    const timelineBlock = buildTimelineNotesBlock({
      deploymentNotes,
      t1Notes,
      t2Notes,
      t3Notes,
      t4Notes,
      t5Notes,
    });

    const mergedNotesRaw = `${notesBase ?? ""}${timelineBlock}`.trim();
    const mergedNotes = mergedNotesRaw.length ? mergedNotesRaw : null;

    const fallbackData = {
      ...baseData,
      notes: mergedNotes ?? undefined,
    };

    try {
      const game = await prisma.game.create({
        data: fallbackData,
        select: SAFE_SELECT_WITH_LIST_TEXT,
      });

      return Response.json(
        {
          ...game,
          warning:
            timelineBlock.trim().length > 0
              ? "DB non migrée: timeline stockée dans notes (bloc WT_TIMELINE_V1)."
              : null,
        },
        { status: 201 }
      );
    } catch (e: any) {
      if (!isMissingColumnError(e)) throw e;
    }

    const fallbackDataWithoutListText = {
      ...fallbackData,
      myListText: undefined,
      oppListText: undefined,
    };

    const game = await prisma.game.create({
      data: fallbackDataWithoutListText,
      select: SAFE_SELECT_BASE,
    });

    return Response.json(
      {
        ...game,
        warning:
          "DB non migrée: colonnes myListText/oppListText absentes, texte enrichi ignoré.",
      },
      { status: 201 }
    );
  } catch (e: any) {
    console.error("POST /api/games ERROR =", e);
    return Response.json(
      {
        error: "Erreur serveur lors de l'enregistrement",
        details: e?.message ?? String(e),
        code: e?.code ?? null,
      },
      { status: 500 }
    );
  }
}
