import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client
 * → permet d'interagir avec la base PostgreSQL
 * ⚠️ runtime Node uniquement (OK dans App Router API)
 */
const prisma = new PrismaClient();

/**
 * Convertit une valeur inconnue en number | null
 * - "" / null / undefined → null
 * - valeur numérique valide → number
 * - sinon → null
 */
function parseNullableNumber(v: unknown): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Convertit une valeur inconnue en int | null
 * (utile pour points)
 */
function parseNullableInt(v: unknown): number | null {
  const n = parseNullableNumber(v);
  if (n === null) return null;
  const i = Math.trunc(n);
  return Number.isFinite(i) ? i : null;
}

/**
 * Convertit une valeur inconnue en string | null
 * - null / undefined → null
 * - string vide ou whitespace → null
 * - string non vide → string
 */
function parseNullableString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/**
 * Convertit une valeur inconnue en Date | null (via ISO / Date.parse)
 */
function parseNullableDate(v: unknown): Date | null {
  const s = parseNullableString(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Normalise un tableau de liens (Drive ou autre) → string[]
 */
function parseStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => typeof x === "string")
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * POST /api/games
 * --------------------------------------------------
 * Rôle :
 * - créer une nouvelle partie (40k ou FaB)
 * - v1 40k : date/opponent/points + mission line + factions + score + notes
 * - médias : liens Google Drive (PDF/Photos) optionnels
 * - calculer automatiquement le résultat si scores fournis
 *
 * ⚠️ Legacy retiré :
 * - build/first/score/tag1/tag2/armyListPdfUrl/armyListPdfUrl2/scoreSheetUrl
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Type de jeu (fallback 40k)
    const gameType = parseNullableString(body.gameType) ?? "40k";

    // Champs requis minimaux v1
    const opponent = parseNullableString(body.opponent);
    if (!opponent) {
      return Response.json(
        { error: "Champs requis manquants", details: { opponent } },
        { status: 400 }
      );
    }

    // v1 identification
    const playedAt = parseNullableDate(body.playedAt);
    const points = parseNullableInt(body.points);

    // v1 mission & table
    const missionPack = parseNullableString(body.missionPack);
    const primaryMission = parseNullableString(body.primaryMission);
    const deployment = parseNullableString(body.deployment);
    const terrainLayout = parseNullableString(body.terrainLayout);

    // v1 armies
    const myFaction = parseNullableString(body.myFaction);
    const myDetachment = parseNullableString(body.myDetachment);
    const oppFaction = parseNullableString(body.oppFaction);
    const oppDetachment = parseNullableString(body.oppDetachment);

    const myArmyPdfUrl = parseNullableString(body.myArmyPdfUrl); // Drive
    const oppArmyPdfUrl = parseNullableString(body.oppArmyPdfUrl); // Drive

    const myListText = parseNullableString(body.myListText);
    const oppListText = parseNullableString(body.oppListText);

    // Score & résultat
    const myScore =
      body.myScore !== undefined ? parseNullableNumber(body.myScore) : null;
    const oppScore =
      body.oppScore !== undefined ? parseNullableNumber(body.oppScore) : null;

    // résultat demandé (optionnel)
    let result: "W" | "L" | "D" =
      body.result === "W" || body.result === "L" || body.result === "D"
        ? body.result
        : "W";

    // calcul auto si scores fournis
    if (myScore !== null && oppScore !== null) {
      result = myScore === oppScore ? "D" : myScore > oppScore ? "W" : "L";
    }

    // Notes
    const notes = parseNullableString(body.notes);

    // Photos (liens Drive)
    const photoUrls = parseStringArray(body.photoUrls);

    /**
     * Création en base
     * NB: on utilise undefined pour "ne pas écrire" si champ optionnel
     */
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
      } as any, // <- retire ce "as any" quand ton schema.prisma est 100% aligné
    });

    return Response.json(game, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/games ERROR =", e);
    return Response.json(
      {
        error: "Erreur serveur lors de l'enregistrement",
        details: e?.message,
      },
      { status: 500 }
    );
  }
}
