// Применение правок сверки по Ростовской области (день 20).
//
// Бэкап: verification/backup-day-20.json.
//
// Правило после рязанского разбора: правка принимается, только если источник —
// официальный домен (органы власти области или подведомственное агентство).
// Публикации СМИ основанием для изменения суммы или круга получателей не служат:
// по Рязани ровно на таком источнике первый заход занизил догазификацию втрое.
//
// Запуск: node scripts/_apply-rostov.mjs          (сухой прогон)
//         node scripts/_apply-rostov.mjs --apply   (запись)
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

// Сверяем именно хост, а не подстроку: первая версия требовала точку перед
// доменом и потому не признавала https://azhp.ru — источник придерживался зря.
const OFFICIAL = ["donland.ru", "azhp.ru", "gosuslugi.ru", "rostov-gorod.ru"];
const isOfficial = (url) => {
  try {
    const h = new URL(url).hostname;
    return OFFICIAL.some((d) => h === d || h.endsWith("." + d));
  } catch {
    return false;
  }
};

const data = JSON.parse(readFileSync("verification/day-20-rostov.json", "utf8"));
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
  for (const k of Object.keys(c)) if (!VALID.has(k)) errors.push(`${slug}: недопустимое ${path}.${k}`);
  if (c.requiresDisabledChild && c.requiresSpecialNeedsChild) {
    errors.push(`${slug}: конфликт requiresDisabledChild + requiresSpecialNeedsChild`);
  }
  if (Array.isArray(c.anyOf)) c.anyOf.forEach((x, i) => checkCriteria(x, slug, `${path}.anyOf[${i}]`));
}

const updates = {};
const held = [];
for (const [slug, edit] of Object.entries(data.edits)) {
  if (!cur[slug]) { errors.push(`${slug}: нет в бэкапе`); continue; }
  if (!isOfficial(edit._source ?? "")) {
    held.push({ slug, source: edit._source, why: "источник не официальный домен" });
    continue;
  }
  const clean = Object.fromEntries(Object.entries(edit).filter(([k]) => !k.startsWith("_")));
  if (clean.criteria) {
    checkCriteria(clean.criteria, slug);
    if (!clean.criteria.regions?.includes("Ростовская область")) {
      errors.push(`${slug}: criteria.regions потерял регион`);
    }
  }
  updates[slug] = {
    ...clean,
    verified_at: "2026-07-20",
    verified_by: `сверка 20.07.2026 (${edit._source})`,
    updated_at_label: "20.07.2026",
  };
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
      if (was === now) continue;
      console.log(`    ${k}:`);
      console.log(`      было:  ${was}`);
      console.log(`      стало: ${now}`);
    }
  }
  if (held.length) {
    console.log(`\n=== ПРИДЕРЖАНО (${held.length}) ===`);
    for (const h of held) console.log(`  ${h.slug}: ${h.why} — ${h.source}`);
  }

  if (!APPLY) {
    console.log("\n\nСУХОЙ ПРОГОН. Записи не было. Для применения: --apply");
  } else {
    for (const [slug, u] of Object.entries(updates)) {
      const { error } = await sb.from("measures").update(u).eq("slug", slug);
      if (error) throw error;
    }
    console.log(`\n✓ применено правок: ${Object.keys(updates).length}, придержано: ${held.length}`);
  }
}
