import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const prisma = new PrismaClient();

async function getId(params: unknown): Promise<string | null> {
  // Supporte params = {id} OU params = Promise<{id}>
  const p: any = params;
  const resolved = p && typeof p.then === "function" ? await p : p;
  const id = resolved?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export default async function Page({
  params,
}: {
  params: any; // volontaire: Next peut fournir une Promise ici
}) {
  const id = await getId(params);
  if (!id) return notFound();

  const game = await prisma.game.findUnique({
    where: { id },
  });

  if (!game) return notFound();

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4 text-white">
      <Link
        href="/40k/games"
        className="inline-block rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black transition hover:bg-white"
      >
        ← Retour
      </Link>

      <div className="rounded-2xl bg-black/60 backdrop-blur-md p-6 shadow-xl">
        <h1 className="text-2xl font-bold">
          40k — {game.build} vs {game.opponent}
        </h1>

        <div className="mt-2 text-sm text-gray-300">
          Résultat : <span className="font-semibold">{game.result}</span>
        </div>

        {game.myScore !== null && game.oppScore !== null && (
          <div className="mt-2 text-sm text-gray-300">
            Score : <span className="font-semibold">{game.myScore}</span> -{" "}
            <span className="font-semibold">{game.oppScore}</span>
          </div>
        )}

        {game.notes && (
          <div className="mt-4 whitespace-pre-wrap rounded-xl bg-white/5 p-4 text-sm">
            {game.notes}
          </div>
        )}
      </div>
    </main>
  );
}
