// Поиск мер по подстроке в названии/описании (для сверки — нет ли дубля).
// Запуск: node scripts/_search-measures.mjs "земельн" ["Костромская область"]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const needle = (process.argv[2] || "").toLowerCase();
const region = process.argv[3];

let q = sb.from("measures").select("slug,title,amount,region,level,is_published");
if (region) q = q.eq("region", region);
const { data, error } = await q;
if (error) throw error;

const hit = data.filter((m) => `${m.title} ${m.amount || ""}`.toLowerCase().includes(needle));
console.log(`«${needle}»: ${hit.length} совпадений из ${data.length}\n`);
for (const m of hit) {
  console.log(`${m.slug} [${m.level}${m.region ? ", " + m.region : ""}] — ${m.title}`);
  console.log(`   ${m.amount || "—"}${m.is_published ? "" : "  [СКРЫТА]"}`);
}
