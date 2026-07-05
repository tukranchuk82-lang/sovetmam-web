// Срез: сколько мер в базе по каждому региону + уровень federal. Временный.
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const { data, error } = await sb.from("measures").select("region,level,is_published");
if (error) { console.error("ERR", error.message); process.exit(1); }
const byRegion = {};
let fed=0, fedPub=0;
for (const m of data){
  if (m.level === "federal") { fed++; if(m.is_published) fedPub++; continue; }
  const k = m.region || "(без региона)";
  byRegion[k] = byRegion[k] || { total:0, pub:0 };
  byRegion[k].total++; if(m.is_published) byRegion[k].pub++;
}
console.log(`ВСЕГО мер: ${data.length}`);
console.log(`Федеральные: ${fed} (опубл. ${fedPub})\n`);
console.log("РЕГИОНЫ (загружено / опубликовано):");
for (const [k,v] of Object.entries(byRegion).sort((a,b)=>b[1].total-a[1].total))
  console.log(`  ${v.total.toString().padStart(3)} / ${v.pub.toString().padStart(3)}  ${k}`);
console.log(`\nРегионов в базе: ${Object.keys(byRegion).length}`);
