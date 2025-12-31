export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import type { GameDTO } from "../../types";
import GameDetailClient from "./game-detail-client";

const prisma = new PrismaClient();

type Ctx =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

export default async function GameDetailPage(ctx: Ctx) {
  const params = "then" in (ctx as any).params
    ? await (ctx as { params: Promise<{ id: string }> }).params
    : (ctx as { params: { id: string } }).params;

  const id = params?.id;

  if (!id) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <Link href="/games" className="underline">
          ← Retour aux parties
        </Link>
        <p>Id manquant dans l’URL.</p>
      </main>
    );
  }

  const game = await prisma.game.findUnique({
    where: { id },
    select: {
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

      armyListPdfUrl: true,
      photoUrls: true,
    },
  });

  if (!game) {
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <Link href="/games" className="underline">
          ← Retour aux parties
        </Link>
        <p>Partie introuvable.</p>
      </main>
    );
  }

  // ✅ mapping explicite (pas de spread)
  const safeGame: GameDTO = {
    id: game.id,
    createdAt: game.createdAt.toISOString(),
    gameType: game.gameType,
    build: game.build,
    opponent: game.opponent,
    first: game.first,
    result: game.result,
    score: game.score,
    tag1: game.tag1,
    tag2: game.tag2,
    notes: game.notes,

    myFaction: game.myFaction,
    myDetachment: game.myDetachment,
    oppFaction: game.oppFaction,
    oppDetachment: game.oppDetachment,
    myScore: game.myScore,
    oppScore: game.oppScore,

    armyListPdfUrl: game.armyListPdfUrl,
    photoUrls: game.photoUrls ?? [],
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <Link
        href="/games"
        className="inline-block rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
      >
        ← Retour
      </Link>

      <GameDetailClient game={safeGame} />
    </main>
  );
}
