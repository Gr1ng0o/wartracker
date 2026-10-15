import GamesClient from "./games-client";
import { getGames } from "@/lib/games";

export const dynamic = "force-dynamic";
export default async function GamesPage() {
  return <GamesClient initialGames={await getGames()} />;
}
