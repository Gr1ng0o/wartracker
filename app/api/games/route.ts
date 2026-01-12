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

// ✅ accepte textarea (string) ou array
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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // gameType
    const gameType = parseNullableString(body.gameType) ?? "40k";

    // requis (dans TON schema: build, opponent, first, result)
    const build = parseNullableString(body.build) ?? "—";
    const opponent = parseNullableString(body.opponent);
    if (!opponent) {
      return Response.json(
        { error: "Champs requis manquants: opponent" },
        { status: 400 }
      );
    }

    const first = typeof body.first === "boolean" ? body.first : true;

    // result W/L/D -> ton schema dit "W|L" mais on tolère D en front => on garde string
    const result =
      body.result === "W" || body.result === "L" || body.result === "D"
        ? body.result
        : "W";

    // legacy fields présents dans schema
    const score = parseNullableInt(body.score);
    const tag1 = parseNullableString(body.tag1);
    const tag2 = parseNullableString(body.tag2);
    const notes = parseNullableString(body.notes);

    // 40k (existants)
    const myFaction = parseNullableString(body.myFaction);
    const myDetachment = parseNullableString(body.myDetachment);
    const oppFaction = parseNullableString(body.oppFaction);
    const oppDetachment = parseNullableString(body.oppDetachment);

    const myScore = parseNullableInt(body.myScore);
    const oppScore = parseNullableInt(body.oppScore);

    // uploads existants
    const myArmyPdfUrl = parseNullableString(body.myArmyPdfUrl);
    const oppArmyPdfUrl = parseNullableString(body.oppArmyPdfUrl);
    const scoreSheetUrl = parseNullableString(body.scoreSheetUrl);

    const photoUrls = parsePhotoUrls(body.photoUrls);

    // ✅ NOUVEAUX: photos par tour (Drive)
    const deploymentPhotoUrl = parseNullableString(body.deploymentPhotoUrl);
    const t1PhotoUrl = parseNullableString(body.t1PhotoUrl);
    const t2PhotoUrl = parseNullableString(body.t2PhotoUrl);
    const t3PhotoUrl = parseNullableString(body.t3PhotoUrl);
    const t4PhotoUrl = parseNullableString(body.t4PhotoUrl);
    const t5PhotoUrl = parseNullableString(body.t5PhotoUrl);

    const game = await prisma.game.create({
      data: {
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

        // ✅ persist “déploiement + T1..T5”
        deploymentPhotoUrl: deploymentPhotoUrl ?? undefined,
        t1PhotoUrl: t1PhotoUrl ?? undefined,
        t2PhotoUrl: t2PhotoUrl ?? undefined,
        t3PhotoUrl: t3PhotoUrl ?? undefined,
        t4PhotoUrl: t4PhotoUrl ?? undefined,
        t5PhotoUrl: t5PhotoUrl ?? undefined,
      },
    });

    return Response.json(game, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/games ERROR =", e);
    return Response.json(
      {
        error: "Erreur serveur lors de l'enregistrement",
        details: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
