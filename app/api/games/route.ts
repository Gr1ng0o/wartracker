import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function parseNullableNumber(v: any): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Debug utile
    console.log("POST /api/games body =", body);

    // Champs obligatoires (évite create() qui plante sans message)
    const gameType = body.gameType ?? "40k";
    const build = (body.build ?? "").trim();
    const opponent = (body.opponent ?? "").trim();

    if (!build || !opponent) {
      return Response.json(
        { error: "Champs requis manquants", details: { build, opponent } },
        { status: 400 }
      );
    }

    const myScore = parseNullableNumber(body.myScore);
    const oppScore = parseNullableNumber(body.oppScore);

    let result: "W" | "L" = body.result ?? "W";
    if (typeof myScore === "number" && typeof oppScore === "number") {
      result = myScore > oppScore ? "W" : "L";
    }

    const legacyScore = parseNullableNumber(body.score);

    const photoUrls: string[] = Array.isArray(body.photoUrls)
      ? body.photoUrls.filter((x: any) => typeof x === "string" && x.length > 0)
      : [];

    const game = await prisma.game.create({
      data: {
        gameType,
        build,
        opponent,
        first: Boolean(body.first),
        result,
        score: legacyScore,
        tag1: body.tag1 || null,
        tag2: body.tag2 || null,
        notes: body.notes || null,

        // 40k
        myFaction: body.myFaction || null,
        myDetachment: body.myDetachment || null,
        oppFaction: body.oppFaction || null,
        oppDetachment: body.oppDetachment || null,
        myScore,
        oppScore,

        armyListPdfUrl: body.armyListPdfUrl || null,
        photoUrls,
      },
    });

    return Response.json(game);
  } catch (e: any) {
    console.error("POST /api/games ERROR =", e);
    return Response.json(
      { error: "Erreur serveur lors de l'enregistrement", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
