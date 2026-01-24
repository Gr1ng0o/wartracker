export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import type { GameDTO } from "../../types";
import GameDetailClient from "../../_components/game-detail-client";

export const runtime = "nodejs";
import { prisma } from "@/lib/prisma";

type Ctx =
  | { params: { id: string } }
  | { params: Promise<{ id: string }> };

export default async function GameDetailPage(ctx: Ctx) {
  const params =
    "then" in (ctx as any).params
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

  // ✅ pas de select => pas d’erreur TS Prisma sur champs inexistants
  const game = await prisma.game.findUnique({ where: { id } });

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

  // On cast en any pour lire des champs v1/legacy sans casser le build
  const g: any = game;

  const safeGame: GameDTO = {
    id: game.id,
    createdAt: game.createdAt.toISOString(),
    gameType: game.gameType,

    build: g.build ?? "",
    opponent: g.opponent ?? "",
    first: Boolean(g.first),
    result: g.result ?? "—",
    score: g.score ?? null,
    tag1: g.tag1 ?? null,
    tag2: g.tag2 ?? null,
    notes: g.notes ?? null,

    myFaction: g.myFaction ?? null,
    myDetachment: g.myDetachment ?? null,
    oppFaction: g.oppFaction ?? null,
    oppDetachment: g.oppDetachment ?? null,
    myScore: g.myScore ?? null,
    oppScore: g.oppScore ?? null,

    // Drive links : on utilise tes champs v1 si présents
    armyListPdfUrl: g.myArmyPdfUrl ?? null,
    armyListPdfUrl2: g.oppArmyPdfUrl ?? null,
    myListText: g.myListText ?? null,
    oppListText: g.oppListText ?? null,

    photoUrls: Array.isArray(g.photoUrls) ? g.photoUrls : [],
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
