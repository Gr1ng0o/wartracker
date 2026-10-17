import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
const COOKIE = "wartracker_media";
const TTL = 8 * 60 * 60;
function secret() { const key=process.env.ADMIN_KEY; if(!key || key.length<24) throw new Error("Configure ADMIN_KEY (24 caractères minimum)."); return key; }
function equal(a:string,b:string) { const aa=Buffer.from(a),bb=Buffer.from(b); return aa.length===bb.length && timingSafeEqual(aa,bb); }
export function checkPassword(value:string) { return equal(value,secret()); }
function sign(value:string) { return createHmac("sha256",secret()).update(value).digest("hex"); }
export async function startMediaSession() { const value=String(Math.floor(Date.now()/1000)); (await cookies()).set(COOKIE,value+"."+sign(value),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:TTL}); }
export async function endMediaSession() { (await cookies()).delete(COOKIE); }
export async function requireMediaAccess(request:Request) {
 if(request.method!=="GET") { const origin=request.headers.get("origin"); if(!origin || new URL(origin).host!==request.headers.get("host")) throw new MediaAccessError(403,"Origine refusée."); }
 const value=(await cookies()).get(COOKIE)?.value??""; const [time,signature]=value.split(".");
 const age=Math.floor(Date.now()/1000)-Number(time);
 if(!time || !signature || !Number.isFinite(age) || age<0 || age>TTL || !equal(signature,sign(time))) throw new MediaAccessError(401,"Déverrouille la médiathèque.");
}
export class MediaAccessError extends Error { constructor(public status:number,message:string){super(message);} }
export function mediaError(error:unknown) { if(error instanceof MediaAccessError) return Response.json({error:error.message},{status:error.status}); console.error("Media operation failed",error); return Response.json({error:"Opération impossible. Vérifie la configuration du stockage et de la base."},{status:503}); }
