import GamesClient40k from "./games-client";
import { getGames } from "@/lib/games";

export const dynamic = "force-dynamic";
export default async function Page40kGames() {
  return <GamesClient40k initialGames={await getGames("40k")} />;
}
