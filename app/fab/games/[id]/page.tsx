import { notFound } from "next/navigation";
import { getGame } from "@/lib/games";
import FabDetail from "./fab-detail";

export const dynamic = "force-dynamic";
export default async function FabGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const game = await getGame((await params).id, "FaB");
  if (!game) notFound();
  return <FabDetail key={game.id} game={game} />;
}
