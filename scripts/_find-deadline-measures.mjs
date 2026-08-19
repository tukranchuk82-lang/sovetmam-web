// Ищем федеральные меры, у которых в тексте назван срок подачи.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,short_description,tips,how_to_apply,level").eq("is_published", true).eq("level", "federal");
const re = /в течение (\d+|шести|трёх) месяц|до 12 недель|с 1 июня|до 1 октября|до 31 декабря|за три года|сгора|не позднее|1 апреля|срок подачи/i;
const hits = (data ?? []).filter((m) => re.test([m.title, m.short_description, ...(m.tips ?? []), ...(m.how_to_apply ?? [])].join(" ")));
console.log(`федеральных мер: ${data.length}, со сроками в тексте: ${hits.length}\n`);
for (const m of hits) {
  const text = [m.short_description, ...(m.tips ?? []), ...(m.how_to_apply ?? [])].join(" ");
  const found = text.match(re);
  console.log(`${m.slug}\n   ${m.title.slice(0, 70)}\n   упоминание: «...${text.slice(Math.max(0, text.indexOf(found[0]) - 60), text.indexOf(found[0]) + 90)}...»\n`);
}
