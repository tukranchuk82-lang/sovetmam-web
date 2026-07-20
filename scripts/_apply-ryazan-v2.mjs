// Применение пересобранного пакета правок по Рязанской области.
//
// Пакет пересобран против текста Закона № 91-ОЗ в ред. от 24.12.2025
// (verification/ryazan-91-OZ-red-24.12.2025.txt). Первый заход делался по
// веб-источникам и содержал ошибки — в частности, занижал догазификацию
// со 100 000 до 30 000 ₽. Здесь у каждой правки есть ссылка на статью.
//
// Бэкап: verification/backup-day-20.json (снят до начала сверки).
//
// Запуск: node scripts/_apply-ryazan-v2.mjs          (сухой прогон)
//         node scripts/_apply-ryazan-v2.mjs --apply   (запись)
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
const APPLY = process.argv.includes("--apply");

const v2 = JSON.parse(readFileSync("verification/day-20-ryazan-v2.json", "utf8"));
const cur = Object.fromEntries(
  JSON.parse(readFileSync("verification/backup-day-20.json", "utf8")).map((m) => [m.slug, m]),
);

const VALID = new Set([
  "anyOf", "requiresFamily", "requiresPregnancy", "requiresChildren", "minChildren",
  "minSimultaneousBirth", "minSchoolChildren", "maxYoungestChildAgeYears",
  "hasChildAgedFrom", "hasChildAgedTo", "requiresLossOfBreadwinner", "excludeFromMatching",
  "requiresLowIncome", "maxIncomePm", "requiresDisabledChild", "requiresSpecialNeedsChild",
  "requiresMortgageIntent", "requiresSvoFamily", "requiresSingleParent", "requiresStudent",
  "requiresParentUnder35", "requiresSelfEmployed", "requiresEntrepreneur",
  "requiresDisabledParent", "requiresFosterParent", "regions",
]);

const errors = [];
function checkCriteria(c, slug, path = "criteria") {
  for (const k of Object.keys(c)) {
    if (!VALID.has(k)) errors.push(`${slug}: недопустимое поле ${path}.${k}`);
  }
  if (c.requiresDisabledChild && c.requiresSpecialNeedsChild) {
    errors.push(`${slug}: конфликт requiresDisabledChild + requiresSpecialNeedsChild`);
  }
  if (Array.isArray(c.anyOf)) c.anyOf.forEach((x, i) => checkCriteria(x, slug, `${path}.anyOf[${i}]`));
}

const updates = {};
for (const [slug, edit] of Object.entries(v2.edits)) {
  if (!cur[slug]) { errors.push(`${slug}: нет в бэкапе — меры не существует?`); continue; }
  if (!edit._law) { errors.push(`${slug}: правка без ссылки на закон`); continue; }
  const clean = Object.fromEntries(Object.entries(edit).filter(([k]) => !k.startsWith("_")));
  if (clean.criteria) checkCriteria(clean.criteria, slug);
  if (clean.criteria && !clean.criteria.regions?.includes("Рязанская область")) {
    errors.push(`${slug}: criteria.regions потерял регион`);
  }
  updates[slug] = { ...clean, verified_at: "2026-07-20", verified_by: `сверка 20.07.2026 по Закону № 91-ОЗ (${edit._law})`, updated_at_label: "20.07.2026" };
}

if (errors.length) {
  console.log("=== ОШИБКИ ===");
  errors.forEach((e) => console.log("  ✗", e));
  console.log("\nЗапись отменена.");
  process.exitCode = 1;
} else {
  console.log(`правок к применению: ${Object.keys(updates).length}\n`);
  for (const [slug, u] of Object.entries(updates)) {
    console.log(`=== ${slug} — ${cur[slug].title}`);
    for (const [k, val] of Object.entries(u)) {
      if (["verified_at", "verified_by", "updated_at_label"].includes(k)) continue;
      const was = JSON.stringify(cur[slug][k]);
      const now = JSON.stringify(val);
      if (was === now) { console.log(`    ${k}: без изменений`); continue; }
      console.log(`    ${k}:`);
      console.log(`      было:  ${was}`);
      console.log(`      стало: ${now}`);
    }
  }

  console.log(`\n\n=== ОТКЛОНЕНО (${v2.rejected.length}) — правки прошлого захода, опровергнутые законом ===`);
  for (const r of v2.rejected) console.log(`  ${r.slug}: ${r._law}`);

  if (!APPLY) {
    console.log("\n\nСУХОЙ ПРОГОН. Записи не было. Для применения: --apply");
  } else {
    for (const [slug, u] of Object.entries(updates)) {
      const { error } = await sb.from("measures").update(u).eq("slug", slug);
      if (error) throw error;
    }
    console.log(`\n✓ применено правок: ${Object.keys(updates).length}`);
  }
}
