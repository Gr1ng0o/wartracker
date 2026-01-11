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

  // ✅ Normalisation des URLs Drive (si tu as encore d'anciens champs, tu peux les fallback ici)
  const myPdfUrl: string | null = g.myArmyPdfUrl ?? null;
  const oppPdfUrl: string | null = g.oppArmyPdfUrl ?? null;
  const scoreSheetUrl: string | null = g.scoreSheetUrl ?? null;

  // (optionnel) si un jour tu ajoutes un champ dossier drive pour photos
  const photosDriveUrl: string | null =
    typeof g.photosDriveUrl === "string" ? g.photosDriveUrl : null;

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
    myArmyPdfUrl: myPdfUrl,
    myListText: g.myListText ?? null,

    oppFaction: g.oppFaction ?? null,
    oppDetachment: g.oppDetachment ?? null,
    oppArmyPdfUrl: oppPdfUrl,
    oppListText: g.oppListText ?? null,

    // ✅ Feuille de score (Drive) — PDF ou photo
    scoreSheetUrl,

    myScore: g.myScore ?? null,
    oppScore: g.oppScore ?? null,
    result: g.result ?? "—",

    notes: g.notes ?? null,
    photoUrls: Array.isArray(g.photoUrls) ? g.photoUrls : [],

    // ✅ (optionnel) si ton type GameDTO l'autorise.
    // Si GameDTO ne contient pas ce champ, supprime ces 2 lignes.
    ...(photosDriveUrl ? ({ photosDriveUrl } as any) : {}),
  };

  return (
    <main className="relative mx-auto max-w-5xl p-6">
      {/* ✅ Retour toujours visible (au-dessus de tout) */}
      <Link
        href="/40k/games"
        className="
          fixed left-4 top-4 z-50
          inline-flex items-center gap-2
          rounded-full
          border border-white/15
          bg-black/80
          px-4 py-2
          text-sm font-semibold text-white
          shadow-[0_12px_40px_rgba(0,0,0,0.85)]
          backdrop-blur
          hover:bg-black/90
          hover:border-amber-200/30
          transition
        "
      >
        <span className="text-white/80">←</span>
        <span>Historique 40k</span>
      </Link>

      {/* ✅ petit spacer pour éviter que le bouton fixe recouvre le contenu */}
      <div className="pt-14">
        <GameDetailClient game={safeGame} />
      </div>
    </main>
  );
}
