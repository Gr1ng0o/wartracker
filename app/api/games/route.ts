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

/**
 * ✅ IMPORTANT:
 * Tant que la DB n’a pas les colonnes timeline, Prisma ne doit PAS les “RETURN”.
 * Donc on force un select sans les champs timeline.
 */
const SAFE_SELECT = {
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
    const notes = parseNullableString(body.notes);

    const myFaction = parseNullableString(body.myFaction);
    const myDetachment = parseNullableString(body.myDetachment);
    const oppFaction = parseNullableString(body.oppFaction);
    const oppDetachment = parseNullableString(body.oppDetachment);

    const myScore = parseNullableInt(body.myScore);
    const oppScore = parseNullableInt(body.oppScore);

    const myArmyPdfUrl = parseNullableString(body.myArmyPdfUrl);
    const oppArmyPdfUrl = parseNullableString(body.oppArmyPdfUrl);
    const scoreSheetUrl = parseNullableString(body.scoreSheetUrl);

    const photoUrls = parsePhotoUrls(body.photoUrls);

    // ✅ on continue de parser tes nouveaux champs (ça ne casse pas)
    // MAIS on ne les enverra PAS à Prisma tant que la DB n’est pas à jour
    // (sinon P2022 garanti).
    const deploymentPhotoUrl = parseNullableString(body.deploymentPhotoUrl);
    const t1PhotoUrl = parseNullableString(body.t1PhotoUrl);
    const t2PhotoUrl = parseNullableString(body.t2PhotoUrl);
    const t3PhotoUrl = parseNullableString(body.t3PhotoUrl);
    const t4PhotoUrl = parseNullableString(body.t4PhotoUrl);
    const t5PhotoUrl = parseNullableString(body.t5PhotoUrl);

    const deploymentNotes = parseNullableString(body.deploymentNotes);
    const t1Notes = parseNullableString(body.t1Notes);
    const t2Notes = parseNullableString(body.t2Notes);
    const t3Notes = parseNullableString(body.t3Notes);
    const t4Notes = parseNullableString(body.t4Notes);
    const t5Notes = parseNullableString(body.t5Notes);

    const baseData: any = {
      gameType,
      build,
      opponent,
      first,
      result,

      score: score ?? undefined,
      tag1: tag1 ?? undefined,
      tag2: tag2 ?? undefined,
      notes: notes ?? undefined,

      myFaction: myFaction ?? undefined,
      myDetachment: myDetachment ?? undefined,
      oppFaction: oppFaction ?? undefined,
      oppDetachment: oppDetachment ?? undefined,
      myScore: myScore ?? undefined,
      oppScore: oppScore ?? undefined,

      myArmyPdfUrl: myArmyPdfUrl ?? undefined,
      oppArmyPdfUrl: oppArmyPdfUrl ?? undefined,
      scoreSheetUrl: scoreSheetUrl ?? undefined,

      photoUrls,
    };

    // ✅ Tant que la DB n’a pas les colonnes, NE PAS inclure timeline dans data.
    // (Sinon crash P2022 à l’INSERT)
    // Quand ta DB sera migrée, tu pourras remettre ces champs ici.
    void deploymentPhotoUrl;
    void t1PhotoUrl;
    void t2PhotoUrl;
    void t3PhotoUrl;
    void t4PhotoUrl;
    void t5PhotoUrl;
    void deploymentNotes;
    void t1Notes;
    void t2Notes;
    void t3Notes;
    void t4Notes;
    void t5Notes;

    const game = await prisma.game.create({
      data: baseData,
      select: SAFE_SELECT, // ✅ ça empêche Prisma de “RETURN” les colonnes inexistantes
    });

    return Response.json(game, { status: 201 });
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
