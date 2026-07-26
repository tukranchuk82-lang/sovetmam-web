// Покрытие регионов: где в базе нет ни одной опубликованной меры.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const src = readFileSync("src/lib/measures.ts", "utf8");
const REGIONS = [...src.match(/export const REGIONS = \[([\s\S]*?)\] as const;/)[1].matchAll(/"([^"]+)"/g)].map(
  (m) => m[1],
);

let all = [];
let from = 0;
while (true) {
  const { data, error } = await sb
    .from("measures")
    .select("region,is_published,level,verified_at")
    .range(from, from + 999);
  if (error) throw error;
  all = all.concat(data);
  if (data.length < 1000) break;
  from += 1000;
}

const have = new Set(all.filter((m) => m.is_published && m.region).map((m) => m.region));
const empty = REGIONS.filter((r) => !have.has(r));
const counts = {};
for (const m of all) if (m.is_published && m.region) counts[m.region] = (counts[m.region] || 0) + 1;

console.log(`всего мер: ${all.length} | опубликовано: ${all.filter((m) => m.is_published).length}`);
console.log(`регионов с мерами: ${have.size} из ${REGIONS.length}`);
console.log(`ни разу не сверялись: ${all.filter((m) => !m.verified_at).length}`);
console.log(`\nпустые регионы (${empty.length}): ${empty.join(", ") || "нет"}`);

const thin = Object.entries(counts)
  .filter(([, n]) => n <= 5)
  .sort((a, b) => a[1] - b[1]);
console.log(`\nрегионы с 1–5 мерами (${thin.length}):`);
for (const [r, n] of thin) console.log(`  ${String(n).padStart(2)}  ${r}`);
