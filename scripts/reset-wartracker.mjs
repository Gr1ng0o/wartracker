import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
if(!process.argv.includes("--confirm=EFFACER_WARTRACKER")) throw new Error("Cette commande efface TOUTES les parties et les médias gérés par la nouvelle médiathèque. Ajoute --confirm=EFFACER_WARTRACKER pour l’exécuter sur la base configurée. Les anciens fichiers Google Drive ne sont pas supprimés.");
if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL manquante.");
const prisma=new PrismaClient();
try {
 const rows=await prisma.media.findMany({select:{path:true}});
 if(rows.length){
  const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY}=process.env;
  if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)throw new Error("Stockage requis pour effacer aussi les fichiers. Aucune ligne n’a été supprimée.");
  const storage=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}}).storage.from(process.env.SUPABASE_MEDIA_BUCKET||"wartracker-media");
  for(let i=0;i<rows.length;i+=100){const {error}=await storage.remove(rows.slice(i,i+100).map(r=>r.path));if(error)throw error;}
 }
 await prisma.$transaction([prisma.media.deleteMany(),prisma.armyRoster.deleteMany(),prisma.game.deleteMany()]);
 console.log("Toutes les parties et entrées de la médiathèque ont été effacées. Les fichiers référencés de la médiathèque ont été supprimés du stockage. Les anciens liens Drive nécessitent un nettoyage dans Drive.");
}finally{await prisma.$disconnect();}
