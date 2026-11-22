import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import AddGameForm from "../../_components/add-game-form";
export const dynamic = "force-dynamic";
export default async function Page({params}: {params: Promise<{id:string}>}) {
 const {id} = await params;
 const game = await prisma.game.findUnique({where:{id}});
 if (!game) notFound();
 const savedRosters = game.gameType === "40k" ? await prisma.armyRoster.findMany({orderBy:{createdAt:"desc"},take:100,select:{id:true,name:true,faction:true}}) : [];
 return <><nav className="sanctum"><Link href={game.gameType === "40k" ? "/40k/games" : "/fab/games"}>← Historique</Link><Link className="media-detail-link" href={"/media?gameId="+id}>Photos, vidéos et documents →</Link>{game.gameType === "40k" && <Link className="media-detail-link" href={"/40k/lists?gameId="+id}>Listes et statistiques →</Link>}</nav><AddGameForm key={id + game.result} gameType={game.gameType === "40k" ? "40k" : "FaB"} savedRosters={savedRosters} initialGame={{...game,createdAt:game.createdAt.toISOString(),playedAt:game.playedAt?.toISOString() || null}} /></>;
}
