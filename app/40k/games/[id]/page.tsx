export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { GameDTO } from "../../types";
import GameDetailClient from "../../../_components/game-detail-client";

async function getId(params: any): Promise<string | null> {
  const resolved =
    params && typeof params.then === "function" ? await params : params;
  const id = resolved?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export default async function GameDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const id = await getId(params);
  if (!id) notFound();

  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) notFound();

  const g: any = game;

  const safeGame: GameDTO = {
    id: game.id,
    createdAt: game.createdAt.toISOString(),
    gameType: game.gameType,

    playedAt: g.playedAt ? new Date(g.playedAt).toISOString() : null,
    opponent: g.opponent ?? null,
    points: typeof g.points === "number" ? g.points : null,

    missionPack: g.missionPack ?? null,
    primaryMission: g.primaryMission ?? null,
    deployment: g.deployment ?? null,
    terrainLayout: g.terrainLayout ?? null,

    myFaction: g.myFaction ?? null,
    myDetachment: g.myDetachment ?? null,
    myArmyPdfUrl: g.myArmyPdfUrl ?? null,
    myListText: g.myListText ?? null,

    oppFaction: g.oppFaction ?? null,
    oppDetachment: g.oppDetachment ?? null,
    oppArmyPdfUrl: g.oppArmyPdfUrl ?? null,
    oppListText: g.oppListText ?? null,

    myScore: g.myScore ?? null,
    oppScore: g.oppScore ?? null,
    result: g.result ?? "—",

    notes: g.notes ?? null,
    photoUrls: Array.isArray(g.photoUrls) ? g.photoUrls : [],
  };

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <Link href="/40k/games" className="underline">
        ← Retour à l’historique 40k
      </Link>

      <GameDetailClient game={safeGame} />
    </main>
  );
}
