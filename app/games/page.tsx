export const dynamic = "force-dynamic";
export const revalidate = 0;

import { PrismaClient } from "@prisma/client";
import GamesClient from "./games-client";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function GamesPage() {
  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-4">
      {/* Bouton retour accueil */}
      <Link
        href="/"
        className="inline-block rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
      >
        ← Retour à l’accueil
      </Link>

      {/* Contenu existant */}
      <GamesClient initialGames={games} />
    </main>
  );
}
