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

/**
 * ✅ Récupère les colonnes réellement présentes en DB (Postgres)
 * Important: selon ta config Prisma, ta table peut s'appeler "Game" (case-sensitive)
 * ou "game". On check les deux.
 */
async function getGameColumns(): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<
    { column_name: string }[]
  >`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (table_name = 'Game' OR table_name = 'game')
  `;

  return new Set(rows.map((r) => r.column_name));
}

export default async function GameDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const id = await getId(params);
  if (!id) notFound();

  const cols = await getGameColumns();

  // ✅ select construit uniquement avec les colonnes existantes
  const select: Record<string, boolean> = {
    id: true,
    createdAt: true,
    gameType: true,
  };

  // champs "courants" (on les ajoute seulement si la colonne existe)
  const maybe = (name: string) => {
    if (cols.has(name)) select[name] = true;
  };

  // legacy / safe-ish
  ["opponent", "result", "notes", "build", "first", "score", "tag1", "tag2"].forEach(maybe);

  // pdf + uploads + médias
  ["myArmyPdfUrl", "oppArmyPdfUrl", "scoreSheetUrl", "photoUrls"].forEach(maybe);

  // v1 40k
  [
    "playedAt",
    "points",
    "missionPack",
    "primaryMission",
    "deployment",
    "terrainLayout",
    "myFaction",
    "myDetachment",
    "myScore",
    "myListText",
    "oppFaction",
    "oppDetachment",
    "oppScore",
    "oppListText",
  ].forEach(maybe);

  // timeline
  [
    "deploymentPhotoUrl",
    "t1PhotoUrl",
    "t2PhotoUrl",
    "t3PhotoUrl",
    "t4PhotoUrl",
    "t5PhotoUrl",
    "deploymentNotes",
    "t1Notes",
    "t2Notes",
    "t3Notes",
    "t4Notes",
    "t5Notes",
  ].forEach(maybe);

  const game = await prisma.game.findUnique({
    where: { id },
    select: select as any,
  });

  if (!game) notFound();

  const g: any = game;

  const toIsoOrNull = (d: any): string | null => {
    try {
      if (!d) return null;
      const dd = d instanceof Date ? d : new Date(d);
      return Number.isNaN(dd.getTime()) ? null : dd.toISOString();
    } catch {
      return null;
    }
  };
  const numOrNull = (x: any): number | null =>
    typeof x === "number" && Number.isFinite(x) ? x : null;
  const strOrNull = (x: any): string | null =>
    typeof x === "string" ? x : null;

  const safeGame: GameDTO = {
    id: g.id,
    createdAt: g.createdAt.toISOString(),
    gameType: g.gameType,

    // legacy
    build: typeof g.build === "string" ? g.build : "",
    first: Boolean(g.first),
    score: numOrNull(g.score),
    tag1: strOrNull(g.tag1),
    tag2: strOrNull(g.tag2),

    // v1
    playedAt: toIsoOrNull(g.playedAt),
    opponent: strOrNull(g.opponent),
    points: numOrNull(g.points),

    missionPack: strOrNull(g.missionPack),
    primaryMission: strOrNull(g.primaryMission),
    deployment: strOrNull(g.deployment),
    terrainLayout: strOrNull(g.terrainLayout),

    myFaction: strOrNull(g.myFaction),
    myDetachment: strOrNull(g.myDetachment),
    myArmyPdfUrl: strOrNull(g.myArmyPdfUrl),
    myListText: strOrNull(g.myListText),

    oppFaction: strOrNull(g.oppFaction),
    oppDetachment: strOrNull(g.oppDetachment),
    oppArmyPdfUrl: strOrNull(g.oppArmyPdfUrl),
    oppListText: strOrNull(g.oppListText),

    scoreSheetUrl: strOrNull(g.scoreSheetUrl),

    myScore: numOrNull(g.myScore),
    oppScore: numOrNull(g.oppScore),
    result: (g.result as any) ?? "—",

    notes: strOrNull(g.notes),
    photoUrls: Array.isArray(g.photoUrls) ? g.photoUrls : [],

    // timeline (si absent => null)
    deploymentPhotoUrl: strOrNull(g.deploymentPhotoUrl),
    t1PhotoUrl: strOrNull(g.t1PhotoUrl),
    t2PhotoUrl: strOrNull(g.t2PhotoUrl),
    t3PhotoUrl: strOrNull(g.t3PhotoUrl),
    t4PhotoUrl: strOrNull(g.t4PhotoUrl),
    t5PhotoUrl: strOrNull(g.t5PhotoUrl),

    deploymentNotes: strOrNull(g.deploymentNotes),
    t1Notes: strOrNull(g.t1Notes),
    t2Notes: strOrNull(g.t2Notes),
    t3Notes: strOrNull(g.t3Notes),
    t4Notes: strOrNull(g.t4Notes),
    t5Notes: strOrNull(g.t5Notes),

    // aliases legacy si besoin
    armyListPdfUrl: strOrNull(g.armyListPdfUrl) ?? strOrNull(g.myArmyPdfUrl),
    armyListPdfUrl2: strOrNull(g.armyListPdfUrl2) ?? strOrNull(g.oppArmyPdfUrl),
  };

  return (
    <main className="relative mx-auto max-w-5xl p-6">
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

      <div className="pt-14">
        <GameDetailClient game={safeGame} />
      </div>
    </main>
  );
}
