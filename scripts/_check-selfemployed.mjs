import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("slug,title,level,region,criteria,short_description").eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const re = /самозанят/i;
const hit = rows.filter((m) => re.test(`${m.title} ${m.short_description ?? ""}`));
const without = hit.filter((m) => !(m.criteria ?? {}).requiresSelfEmployed && !(m.criteria ?? {}).anyOf);
console.log(`мер про самозанятых: ${hit.length}; из них БЕЗ галочки «самозанятый»: ${without.length}\n`);
for (const m of without.slice(0, 12)) console.log(`  ${m.slug} [${m.region ?? "фед"}] ${m.title.slice(0, 60)}\n      ${JSON.stringify(m.criteria)}`);
