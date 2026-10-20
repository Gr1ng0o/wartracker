import { prisma } from "@/lib/prisma";
import { z } from "zod";
export const runtime="nodejs";
const text=z.string().trim().max(10000).nullable().optional();
const input=z.object({gameType:z.enum(["40k","FaB"]),opponent:z.string().trim().min(1).max(200),build:z.string().trim().min(1).max(200).default("—"),first:z.boolean().default(true),result:z.enum(["W","L","D"]).default("W"),playedAt:z.iso.datetime().optional(),points:z.coerce.number().int().min(1).max(100000).optional(),missionPack:text,primaryMission:text,deployment:text,terrainLayout:text,myFaction:text,myDetachment:text,oppFaction:text,oppDetachment:text,myScore:z.coerce.number().int().min(0).max(1000).default(0),oppScore:z.coerce.number().int().min(0).max(1000).default(0),myListText:text,oppListText:text,notes:text,deploymentNotes:text,t1Notes:text,t2Notes:text,t3Notes:text,t4Notes:text,t5Notes:text});
export async function POST(req:Request){
 let body:unknown;try{body=await req.json();}catch{return Response.json({error:"Données invalides."},{status:400});}
 const parsed=input.safeParse(body);if(!parsed.success)return Response.json({error:"Vérifie les champs de la partie (adversaire, date et scores)."},{status:400});
 try{const {playedAt,...data}=parsed.data;const game=await prisma.game.create({data:{...data,playedAt:playedAt?new Date(playedAt):undefined,result:data.gameType==="40k"?(data.myScore===data.oppScore?"D":data.myScore>data.oppScore?"W":"L"):data.result},select:{id:true}});return Response.json(game,{status:201});}catch(e){console.error("Create game failed",e);return Response.json({error:"Enregistrement impossible. Vérifie la connexion et les migrations de la base."},{status:503});}
}
