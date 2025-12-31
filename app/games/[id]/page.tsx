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
