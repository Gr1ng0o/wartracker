import Link from "next/link";
import { notFound } from "next/navigation";
import GameDetailClient from "@/app/_components/game-detail-client";
import { getGame } from "@/lib/games";

export const dynamic = "force-dynamic";
export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const game = await getGame((await params).id, "40k");
  if (!game) notFound();
  return (
    <main className="mx-auto max-w-5xl text-white">
      <div className="px-4 pt-6">
      <Link
        href="/40k/games"
        className="inline-block rounded-xl bg-black/75 px-4 py-2"
      >
        ← Historique 40k
      </Link>
      </div>
      <GameDetailClient key={game.id} game={game} />
    </main>
  );
}
