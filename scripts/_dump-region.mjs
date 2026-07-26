// Выгрузка мер одного региона из боевой базы для сверки с документом заказчика.
// Запуск из корня sovetmam-web: node <path>/dump-region.mjs "Костромская область" [out.json]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

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

const region = process.argv[2];
const out = process.argv[3];

const { data, error } = await sb
  .from("measures")
  .select("slug,title,short_description,amount,how_to_apply,documents,tips,criteria,region,level,category,is_published,source_name,source_url")
  .eq("region", region);
if (error) throw error;

console.log(`${region}: ${data.length} мер (опубликовано: ${data.filter((m) => m.is_published).length})\n`);
for (const m of data.sort((a, b) => a.slug.localeCompare(b.slug))) {
  console.log(`${m.slug}${m.is_published ? "" : " [СКРЫТА]"} — ${m.title}`);
  console.log(`   ${m.amount || "—"}`);
}
if (out) {
  writeFileSync(out, JSON.stringify(data, null, 2), "utf8");
  console.log(`\n→ ${out}`);
}
