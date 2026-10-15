import type { Game } from "@prisma/client";
import type { GameDTO } from "@/app/types";
import { requireSession } from "./auth-server";
import { prisma } from "./prisma";

export function toGameDTO(game: Game): GameDTO {
  return {
    ...game,
    createdAt: game.createdAt.toISOString(),
    playedAt: game.playedAt?.toISOString() ?? null,
    armyListPdfUrl: game.myArmyPdfUrl,
    armyListPdfUrl2: game.oppArmyPdfUrl,
  };
}

export async function getGames(gameType?: "40k" | "FaB") {
  await requireSession();
  const games = await prisma.game.findMany({
    where: gameType ? { gameType } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return games
    .map(toGameDTO)
    .sort(
      (a, b) =>
        new Date(b.playedAt ?? b.createdAt).getTime() -
        new Date(a.playedAt ?? a.createdAt).getTime(),
    );
}

export async function getGame(id: string, gameType?: "40k" | "FaB") {
  await requireSession();
  const game = await prisma.game.findUnique({ where: { id } });
  return game && (!gameType || game.gameType === gameType)
    ? toGameDTO(game)
    : null;
}
