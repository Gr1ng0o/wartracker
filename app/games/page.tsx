import type { GameDTO } from "../types";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const prisma = new PrismaClient();

export default async function Page() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
  });

  const safeGames: GameDTO[] = games.map((g) => {
    const gg: any = g; // ✅ compat v1/legacy sans casser le build Prisma TS

    return {
      id: g.id,
      createdAt: g.createdAt.toISOString(),
      gameType: g.gameType,

      // legacy (si tes pages /games l’utilisent encore)
      build: gg.build ?? "",
      opponent: gg.opponent ?? null,
      first: Boolean(gg.first),
      result: (gg.result ?? "—") as any,
      score: gg.score ?? null,
      tag1: gg.tag1 ?? null,
      tag2: gg.tag2 ?? null,
      notes: gg.notes ?? null,

      // 40k
      myFaction: gg.myFaction ?? null,
      myDetachment: gg.myDetachment ?? null,
      oppFaction: gg.oppFaction ?? null,
      oppDetachment: gg.oppDetachment ?? null,
      myScore: gg.myScore ?? null,
      oppScore: gg.oppScore ?? null,

      // ✅ Drive v1
      myArmyPdfUrl: gg.myArmyPdfUrl ?? null,
      oppArmyPdfUrl: gg.oppArmyPdfUrl ?? null,

      // ✅ compat legacy UI (si ton client attend encore ces noms)
      armyListPdfUrl: gg.myArmyPdfUrl ?? null,
      armyListPdfUrl2: gg.oppArmyPdfUrl ?? null,

      photoUrls: Array.isArray(gg.photoUrls) ? gg.photoUrls : [],
    };
  });

  // ⚠️ adapte le composant client utilisé par /games
  // si c'est GamesClient40k, garde la prop initialGames
  // sinon ajuste ici
  return (
    <main className="mx-auto max-w-5xl p-6">
      {/* ton composant */}
      {/* <GamesClient initialGames={safeGames} /> */}
      {/* ou retourne safeGames à ton composant existant */}
    </main>
  );
}
