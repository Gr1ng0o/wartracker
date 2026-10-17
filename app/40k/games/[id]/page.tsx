import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import GameDetailClient from "../../../_components/game-detail-client";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;const game=await prisma.game.findUnique({where:{id}});if(!game)notFound();const dto={...game,createdAt:game.createdAt.toISOString(),playedAt:game.playedAt?.toISOString()??null};return <main className="relative mx-auto max-w-5xl p-6"><Link href="/40k/games">← Historique 40k</Link><Link className="media-detail-link" href={"/media?gameId="+id}>Photos, vidéos et documents de cette partie →</Link><GameDetailClient game={dto}/></main>;}
