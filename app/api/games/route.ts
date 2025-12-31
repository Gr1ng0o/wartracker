import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseNullableNumber(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseNullableString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/**
 * POST /api/games
 * → création d'une partie
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const gameType = body.gameType ?? "40k";
    const build = String(body.build ?? "").trim();
    const opponent = String(body.opponent ?? "").trim();

    if (!build || !opponent) {
      return Response.json(
        { error: "Champs requis manquants", details: { build, opponent } },
        { status: 400 }
      );
    }

    const myScore =
      body.myScore !== undefined ? parseNullableNumber(body.myScore) : null;
    const oppScore =
      body.oppScore !== undefined ? parseNullableNumber(body.oppScore) : null;

    const legacyScore =
      body.score !== undefined ? parseNullableNumber(body.score) : null;

    let result: "W" | "L" = body.result ?? "W";
    if (myScore !== null && oppScore !== null) {
      result = myScore > oppScore ? "W" : "L";
    }

    const photoUrls: string[] = Array.isArray(body.photoUrls)
      ? body.photoUrls.filter(
          (x: unknown) => typeof x === "string" && x.length > 0
        )
      : [];

    // ✅ nouveaux champs (en string nullable)
    const armyListPdfUrl = parseNullableString(body.armyListPdfUrl);
    const armyListPdfUrl2 = parseNullableString(body.armyListPdfUrl2);
    const scoreSheetUrl = parseNullableString(body.scoreSheetUrl);

    const game = await prisma.game.create({
      data: {
        gameType,
        build,
        opponent,
        first: Boolean(body.first),
        result,

        score: legacyScore,
        myScore,
        oppScore,

        tag1: body.tag1 || null,
        tag2: body.tag2 || null,
        notes: body.notes || null,

        myFaction: body.myFaction || null,
        myDetachment: body.myDetachment || null,
        oppFaction: body.oppFaction || null,
        oppDetachment: body.oppDetachment || null,

        // ✅ 40k: 2 listes + fiche de scores
        armyListPdfUrl,
        armyListPdfUrl2,
        scoreSheetUrl,

        photoUrls,
      },
    });

    return Response.json(game, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/games ERROR =", e);
    return Response.json(
      { error: "Erreur serveur lors de l'enregistrement", details: e?.message },
      { status: 500 }
    );
  }
}
