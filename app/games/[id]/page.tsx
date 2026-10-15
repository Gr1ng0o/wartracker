import { notFound, redirect } from "next/navigation";
import { getGame } from "@/lib/games";

export default async function LegacyGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const game = await getGame((await params).id);
  if (!game) notFound();
  redirect(`/${game.gameType === "FaB" ? "fab" : "40k"}/games/${game.id}`);
}
