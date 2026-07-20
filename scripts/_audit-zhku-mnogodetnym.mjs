// Где в базе НЕТ меры «компенсация ЖКУ многодетным».
//
// Первый заход искал по criteria.minChildren>=3 и промахнулся: у части мер
// условие спрятано в anyOf (Рязань, Ульяновск). Здесь смотрим и на текст меры,
// и на критерии рекурсивно.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

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

let all = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("*").range(f, f + 999);
  if (error) throw error;
  all = all.concat(data);
  if (data.length < 1000) break;
}

const src = readFileSync("src/lib/measures.ts", "utf8");
const REGIONS = [
  ...src.match(/export const REGIONS = \[([\s\S]*?)\] as const;/)[1].matchAll(/"([^"]+)"/g),
].map((m) => m[1]);

// minChildren где угодно, включая вложенные anyOf
function multiChild(c) {
  if (!c || typeof c !== "object") return false;
  if (c.minChildren >= 3) return true;
  return Array.isArray(c.anyOf) && c.anyOf.some(multiChild);
}

const isZhku = (m) =>
  /жку|жкх|коммунальн|жилищно-коммунальн/i.test(
    `${m.title} ${m.short_description} ${m.amount ?? ""}`,
  );
const mentionsMnogo = (m) => /многодетн/i.test(`${m.title} ${m.short_description}`);

const hit = all.filter((m) => m.region && isZhku(m) && (multiChild(m.criteria) || mentionsMnogo(m)));

const byRegion = {};
for (const m of hit) (byRegion[m.region] ??= []).push(m);

const missing = REGIONS.filter((r) => !byRegion[r]);

console.log(`регионов с мерой ЖКУ для многодетных: ${REGIONS.length - missing.length} из ${REGIONS.length}`);
console.log(`\n=== НЕТ КАРТОЧКИ (${missing.length}) ===`);
missing.forEach((r) => console.log("  -", r));

console.log(`\n=== ЕСТЬ, но критерий не ловит многодетность (проверить) ===`);
for (const [r, ms] of Object.entries(byRegion)) {
  for (const m of ms) {
    if (!multiChild(m.criteria)) {
      console.log(`  ${m.slug} | ${r} | ${m.title}`);
      console.log(`      criteria: ${JSON.stringify(m.criteria)}`);
    }
  }
}

writeFileSync(
  "verification/zhku-mnogodetnym-gaps.json",
  JSON.stringify({ missing, present: Object.keys(byRegion).sort() }, null, 2),
);
console.log("\nсписок пробелов → verification/zhku-mnogodetnym-gaps.json");
