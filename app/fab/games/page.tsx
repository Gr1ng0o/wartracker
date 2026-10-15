import { getGames } from "@/lib/games";
import GamesClient from "@/app/games/games-client";

export const dynamic = "force-dynamic";
export default async function FabGamesPage() {
  return <GamesClient initialGames={await getGames("FaB")} gameType="FaB" />;
}
