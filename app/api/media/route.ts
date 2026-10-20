import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireMediaAccess, mediaError } from "@/lib/media-auth";
import { mediaStorage } from "@/lib/media-storage";
import { mediaInput, extensionFor } from "@/lib/media-policy";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:Request) { try {
 await requireMediaAccess(req);
 const params=new URL(req.url).searchParams;
 const gameId=params.get("gameId")||undefined;
 const q=(params.get("q")||"").slice(0,200);
 const page=Math.max(0,Math.min(100000,Number(params.get("page"))||0));
 const where={...(gameId?{gameId}:{}),...(q?{name:{contains:q,mode:"insensitive" as const}}:{})};
 const [items,total,games]=await Promise.all([prisma.media.findMany({where,orderBy:{createdAt:"desc"},skip:Math.floor(page)*24,take:24}),prisma.media.count({where}),prisma.game.findMany({select:{id:true,opponent:true,gameType:true,createdAt:true},orderBy:{createdAt:"desc"},take:500})]);
 const ready=items.filter(m=>m.status==="ready");
 const {data:urls,error}=ready.length?await mediaStorage().createSignedUrls(ready.map(m=>m.path),3600):{data:[],error:null}; if(error) throw error;
 return Response.json({items:items.map(m=>({...m,url:urls?.find(u=>u.path===m.path)?.signedUrl??null})),total,games},{headers:{"Cache-Control":"private, no-store"}});
 } catch(e) {return mediaError(e);} }
export async function POST(req:Request) {try {
 await requireMediaAccess(req); const parsed=mediaInput.safeParse(await req.json());
 if(!parsed.success) return Response.json({error:"Format non accepté ou fichier trop volumineux (50 Mo maximum)."},{status:400});
 const input=parsed.data;
 if(input.gameId && !await prisma.game.findUnique({where:{id:input.gameId},select:{id:true}})) return Response.json({error:"Partie introuvable."},{status:404});
 const id=randomUUID(),path="media/"+id+"/original."+extensionFor(input.mimeType);
 const storage=mediaStorage(); const {data,error}=await storage.createSignedUploadUrl(path,{upsert:false}); if(error) throw error;
 await prisma.media.create({data:{id,path,...input}});
 return Response.json({id,signedUrl:data.signedUrl},{status:201});
 }catch(e){return mediaError(e);} }
