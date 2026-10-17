import { checkPassword, startMediaSession, endMediaSession, requireMediaAccess, mediaError } from "@/lib/media-auth";
export async function POST(req:Request) { try {
 const origin=req.headers.get("origin"); if(!origin || new URL(origin).host!==req.headers.get("host")) return Response.json({error:"Origine refusée"},{status:403});
 const body=await req.json(); if(typeof body.password!=="string" || !checkPassword(body.password)) return Response.json({error:"Code d’accès incorrect."},{status:401});
 await startMediaSession(); return Response.json({ok:true});
 } catch(e) { return mediaError(e); } }
export async function DELETE(req:Request) {try {await requireMediaAccess(req);await endMediaSession();return Response.json({ok:true});}catch(e){return mediaError(e);}}
