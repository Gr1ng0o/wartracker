import { prisma } from "@/lib/prisma";
import { requireMediaAccess, mediaError } from "@/lib/media-auth";
import { mediaStorage } from "@/lib/media-storage";
import { mediaEdit, MAX_MEDIA_BYTES, MEDIA_TYPES } from "@/lib/media-policy";
type Context={params:Promise<{id:string}>};
export const runtime="nodejs";
export async function POST(req:Request,ctx:Context){try {
 await requireMediaAccess(req); const {id}=await ctx.params; const media=await prisma.media.findUnique({where:{id}});
 if(!media) return Response.json({error:"Média introuvable."},{status:404});
 if(media.status==="ready") return Response.json({ok:true});
 if(media.status!=="pending") return Response.json({error:"Suppression en cours."},{status:409});
 const {data,error}=await mediaStorage().info(media.path); if(error) return Response.json({error:"Le transfert est incomplet. Réessaie la validation."},{status:409});
 const mime=data.contentType?.split(";")[0];
 if(!mime || !MEDIA_TYPES.includes(mime as typeof MEDIA_TYPES[number]) || mime!==media.mimeType || !data.size || data.size>MAX_MEDIA_BYTES || data.size!==media.size) return Response.json({error:"Le fichier transféré ne correspond pas au fichier annoncé. Supprime-le et recommence."},{status:400});
 await prisma.media.updateMany({where:{id,status:"pending"},data:{status:"ready",size:data.size}});return Response.json({ok:true});
 }catch(e){return mediaError(e);}}
export async function PATCH(req:Request,ctx:Context){try {
 await requireMediaAccess(req);const {id}=await ctx.params; const parsed=mediaEdit.safeParse(await req.json());if(!parsed.success)return Response.json({error:"Informations invalides."},{status:400});
 if(parsed.data.gameId && !await prisma.game.findUnique({where:{id:parsed.data.gameId},select:{id:true}}))return Response.json({error:"Partie introuvable."},{status:404});
 const result=await prisma.media.updateMany({where:{id,status:"ready"},data:parsed.data});return Response.json({ok:result.count>0},{status:result.count?200:404});
 }catch(e){return mediaError(e);}}
export async function DELETE(req:Request,ctx:Context){try {
 await requireMediaAccess(req);const {id}=await ctx.params;const media=await prisma.media.findUnique({where:{id}});if(!media)return Response.json({ok:true});
 // Retain a retryable row if the object store is unavailable.
 await prisma.media.update({where:{id},data:{status:"deleting"}});
 const {error}=await mediaStorage().remove([media.path]);if(error)throw error;
 await prisma.media.deleteMany({where:{id,status:"deleting"}});return Response.json({ok:true});
 }catch(e){return mediaError(e);}}
