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

function parseNullableDate(v: unknown): Date | null {
  const s = parseNullableString(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** ✅ accepte soit string (textarea), soit array */
function parseStringArrayLoose(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .filter((x) => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  if (typeof v === "string") {
    // textarea "1 lien par ligne"
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

    const gameType = parseNullableString(body.gameType) ?? "40k";

    const opponent = parseNullableString(body.opponent);
    if (!opponent) {
      return Response.json(
        { error: "Champs requis manquants", details: { opponent } },
        { status: 400 }
      );
    }

    const playedAt = parseNullableDate(body.playedAt);
    const points = parseNullableInt(body.points);

    const missionPack = parseNullableString(body.missionPack);
    const primaryMission = parseNullableString(body.primaryMission);
    const deployment = parseNullableString(body.deployment);
    const terrainLayout = parseNullableString(body.terrainLayout);

    const myFaction = parseNullableString(body.myFaction);
    const myDetachment = parseNullableString(body.myDetachment);
    const oppFaction = parseNullableString(body.oppFaction);
    const oppDetachment = parseNullableString(body.oppDetachment);

    const myArmyPdfUrl = parseNullableString(body.myArmyPdfUrl);
    const oppArmyPdfUrl = parseNullableString(body.oppArmyPdfUrl);

    const myListText = parseNullableString(body.myListText);
    const oppListText = parseNullableString(body.oppListText);

    const myScore =
      body.myScore !== undefined ? parseNullableNumber(body.myScore) : null;
    const oppScore =
      body.oppScore !== undefined ? parseNullableNumber(body.oppScore) : null;

    let result: "W" | "L" | "D" =
      body.result === "W" || body.result === "L" || body.result === "D"
        ? body.result
        : "W";

    if (myScore !== null && oppScore !== null) {
      result = myScore === oppScore ? "D" : myScore > oppScore ? "W" : "L";
    }

    const notes = parseNullableString(body.notes);

    // ✅ important: accepte textarea
    const photoUrls = parseStringArrayLoose(body.photoUrls);

    const game = await prisma.game.create({
      data: {
        gameType,
        opponent,

        playedAt: playedAt ?? undefined,
        points: points ?? undefined,

        missionPack: missionPack ?? undefined,
        primaryMission: primaryMission ?? undefined,
        deployment: deployment ?? undefined,
        terrainLayout: terrainLayout ?? undefined,

        myFaction: myFaction ?? undefined,
        myDetachment: myDetachment ?? undefined,
        oppFaction: oppFaction ?? undefined,
        oppDetachment: oppDetachment ?? undefined,

        myArmyPdfUrl: myArmyPdfUrl ?? undefined,
        oppArmyPdfUrl: oppArmyPdfUrl ?? undefined,
        myListText: myListText ?? undefined,
        oppListText: oppListText ?? undefined,

        myScore: myScore ?? undefined,
        oppScore: oppScore ?? undefined,
        result,

        notes: notes ?? undefined,

        photoUrls,
      } as any,
    });

    return Response.json(game, { status: 201 });
  } catch (e: any) {
    // ✅ log utile Vercel + Prisma
    console.error("POST /api/games ERROR =", e);
    console.error("POST /api/games ERROR (string) =", String(e));
    console.error("POST /api/games ERROR code =", e?.code);
    console.error("POST /api/games ERROR meta =", e?.meta);
    console.error("POST /api/games ERROR stack =", e?.stack);

    return Response.json(
      {
        error: "Erreur serveur lors de l'enregistrement",
        details: e?.message ?? String(e),
        code: e?.code ?? null,
        meta: e?.meta ?? null,
      },
      { status: 500 }
    );
  }
}
