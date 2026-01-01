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
 * POST /api/games
 * --------------------------------------------------
 * Rôle :
 * - créer une nouvelle partie (40k ou FaB)
 * - gérer champs legacy + uploads optionnels
 * - calculer automatiquement le résultat si scores fournis
 *
 * Uploads (optionnels) alignés sur schema.prisma :
 * - armyListPdfUrl  (PDF : ton armée)
 * - armyListPdfUrl2 (PDF : armée adverse)
 * - scoreSheetUrl   (PDF ou image : feuille de scores)
 */
export async function POST(req: Request) {
  try {
    // Lecture du body JSON envoyé par le formulaire
    const body = await req.json();

    // Type de jeu (fallback 40k)
    const gameType = body.gameType ?? "40k";

    // Champs requis minimaux
    const build = String(body.build ?? "").trim();
    const opponent = String(body.opponent ?? "").trim();

    if (!build || !opponent) {
      return Response.json(
        { error: "Champs requis manquants", details: { build, opponent } },
        { status: 400 }
      );
    }

    // Scores 40k (optionnels)
    const myScore =
      body.myScore !== undefined ? parseNullableNumber(body.myScore) : null;
    const oppScore =
      body.oppScore !== undefined ? parseNullableNumber(body.oppScore) : null;

    // Score legacy (champ générique)
    const legacyScore =
      body.score !== undefined ? parseNullableNumber(body.score) : null;

    /**
     * Résultat :
     * - par défaut : body.result ou "W"
     * - si myScore et oppScore sont présents → calcul auto
     */
    let result: "W" | "L" = body.result ?? "W";
    if (myScore !== null && oppScore !== null) {
      result = myScore > oppScore ? "W" : "L";
    }

    /**
     * Photos (tableau de strings)
     * → on filtre tout ce qui n'est pas une string valide
     */
    const photoUrls: string[] = Array.isArray(body.photoUrls)
      ? body.photoUrls.filter(
          (x: unknown) => typeof x === "string" && x.length > 0
        )
      : [];

    /**
     * ===== Uploads distincts (alignés schema.prisma) =====
     * - armyListPdfUrl  : PDF liste de ton armée
     * - armyListPdfUrl2 : PDF liste de l'adversaire
     * - scoreSheetUrl   : feuille de score (PDF ou image)
     *
     * Tous les champs sont nullable et donc optionnels.
     */
    const armyListPdfUrl = parseNullableString(body.armyListPdfUrl);
    const armyListPdfUrl2 = parseNullableString(body.armyListPdfUrl2);
    const scoreSheetUrl = parseNullableString(body.scoreSheetUrl);

    /**
     * Création de la partie en base
     */
    const game = await prisma.game.create({
      data: {
        gameType,
        build,
        opponent,
        first: Boolean(body.first),
        result,

        // Scores
        score: legacyScore,
        myScore,
        oppScore,

        // Métadonnées
        tag1: body.tag1 || null,
        tag2: body.tag2 || null,
        notes: body.notes || null,

        // 40k factions / détachements
        myFaction: body.myFaction || null,
        myDetachment: body.myDetachment || null,
        oppFaction: body.oppFaction || null,
        oppDetachment: body.oppDetachment || null,

        // ✅ Uploads optionnels (noms Prisma corrects)
        armyListPdfUrl,
        armyListPdfUrl2,
        scoreSheetUrl,

        // Photos
        photoUrls,
      },
    });

    // Retour de la partie créée
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
