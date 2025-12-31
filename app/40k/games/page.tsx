/**
 * PAGE LISTE / REVIEW DES PARTIES WARHAMMER 40K
 * Route : /40k/games
 *
 * - Affiche la liste des parties 40k sous forme de cards cliquables.
 * - Permet la recherche locale (opponent, build, factions, notes, scores).
 * - Calcule et affiche les stats globales (W / L / winrate).
 * - Navigation vers la page détail : /40k/games/[id].
 * - Suppression d’une partie via DELETE /api/games/[id] + router.refresh().
 *
 * Client Component (Next.js App Router) :
 * - Aucune logique Prisma ici (server-only).
 * - Reçoit les données sérialisées depuis la page server.
 */

import GamesClient40k from "./games-client";
import type { GameDTO } from "../../types";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
  });

  const safeGames: GameDTO[] = games.map((g) => ({
    id: g.id,
    createdAt: g.createdAt.toISOString(),
    gameType: g.gameType,
    build: g.build,
    opponent: g.opponent,
    first: g.first,
    result: g.result,
    score: g.score,
    tag1: g.tag1,
    tag2: g.tag2,
    notes: g.notes,
    myFaction: g.myFaction,
    myDetachment: g.myDetachment,
    oppFaction: g.oppFaction,
    oppDetachment: g.oppDetachment,
    myScore: g.myScore,
    oppScore: g.oppScore,
    armyListPdfUrl: g.armyListPdfUrl,
    photoUrls: g.photoUrls,
  }));

  return <GamesClient40k initialGames={safeGames} />;
}
