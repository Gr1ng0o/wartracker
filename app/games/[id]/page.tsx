export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { PrismaClient } from "@prisma/client";
import type { GameDTO } from "../../types";
import GameDetailClient from "./game-detail-client";

const prisma = new PrismaClient();

export default async function GameDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const game = await prisma.game.findUnique({
    where: { id: params.id },
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

  const safeGame: GameDTO = {
    ...game,
    createdAt: game.createdAt.toISOString(),
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
