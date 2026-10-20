import { createClient } from "@supabase/supabase-js";
export function mediaStorage() {
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url || !key) throw new Error("Supabase Storage non configuré.");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).storage.from(process.env.SUPABASE_MEDIA_BUCKET || "wartracker-media");
}
