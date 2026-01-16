export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import GamesClient40k from "./games-client";
import type { GameDTO } from "../types";

export default async function Page40kGames() {
  const games = await prisma.game.findMany({
    where: { gameType: "40k" },
    orderBy: { createdAt: "desc" },
    // ✅ IMPORTANT : on SELECT seulement des colonnes qui existent déjà en DB
    // (sinon Prisma plante: "Game.deploymentPhotoUrl does not exist")
    select: {
      id: true,
      createdAt: true,
      gameType: true,

      // champs "legacy" / communs
      build: true,
      opponent: true,
      first: true,
      result: true,
      score: true,
      tag1: true,
      tag2: true,
      notes: true,

      // 40k existants
      myFaction: true,
      myDetachment: true,
      oppFaction: true,
      oppDetachment: true,
      myScore: true,
      oppScore: true,

      // uploads existants
      myArmyPdfUrl: true,
      oppArmyPdfUrl: true,
      scoreSheetUrl: true,
      photoUrls: true,
    },
  });

  const safeGames: GameDTO[] = games.map((game) => {
    const g: any = game;

    return {
      id: game.id,
      createdAt: game.createdAt.toISOString(),
      gameType: game.gameType,

      // ⚠️ ces champs ne sont pas dans ton schema Prisma actuel => on garde la compat front
      playedAt: g.playedAt ? new Date(g.playedAt).toISOString() : null,
      points: typeof g.points === "number" ? g.points : null,

      missionPack: g.missionPack ?? null,
      primaryMission: g.primaryMission ?? null,
      deployment: g.deployment ?? null,
      terrainLayout: g.terrainLayout ?? null,

      opponent: g.opponent ?? null,

      myFaction: g.myFaction ?? null,
      myDetachment: g.myDetachment ?? null,
      myArmyPdfUrl: g.myArmyPdfUrl ?? null,
      myListText: g.myListText ?? null,

      oppFaction: g.oppFaction ?? null,
      oppDetachment: g.oppDetachment ?? null,
      oppArmyPdfUrl: g.oppArmyPdfUrl ?? null,
      oppListText: g.oppListText ?? null,

      scoreSheetUrl: g.scoreSheetUrl ?? null,

      myScore: typeof g.myScore === "number" ? g.myScore : null,
      oppScore: typeof g.oppScore === "number" ? g.oppScore : null,
      result: g.result ?? "—",

      notes: g.notes ?? null,
      photoUrls: Array.isArray(g.photoUrls) ? g.photoUrls : [],
    };
  });

  // ✅ Tri final côté JS: playedAt DESC sinon createdAt DESC
  safeGames.sort((a, b) => {
    const da = new Date(a.playedAt ?? a.createdAt).getTime();
    const db = new Date(b.playedAt ?? b.createdAt).getTime();
    return db - da;
  });

  return <GamesClient40k initialGames={safeGames} />;
}
