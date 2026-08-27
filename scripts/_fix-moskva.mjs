// Москва, 23 меры: вычитка условий по тексту карточек.
//
// Мусор (показывалось лишним):
//   msk-adresnaya-pomoshch — «есть дети», хотя помощь дают при трудной
//     жизненной ситуации: потеря работы, болезнь, пожар. Единственная
//     московская мера, попавшая в подборку заказчицы, — и та зря;
//   msk-mnogodetnym-tovary — стояло «трое детей», в тексте «пять и более»;
//   msk-mnogodetnym-odezhda — без возраста, хотя выплата на школьников 6–18;
//   moskva-vyplata-molodoy-semye — выплата при рождении без срока: её дают,
//     пока ребёнку не исполнился год;
//   msk-uhod-rebenok-invalid — выплата неработающему родителю, а условия
//     занятости не было;
//   msk-rost-zhizni-otdelnye — только одиноким матерям, хотя в тексте ещё
//     дети военнослужащих по призыву.
//
// Недобор (не показывалось положенное):
//   msk-besplatnoe-pitanie-shkolnikov — стояло «многодетным», а завтраки
//     положены ВСЕМ ученикам 1–4 классов;
//   msk-besplatnye-lekarstva-detyam — то же: лекарства бесплатны всем детям
//     до трёх лет, многодетным — до шести;
//   msk-molochnaya-kuhnya — требовала уже рождённых детей, из-за чего
//     беременная москвичка молочную кухню не видела.
//
// Запуск: node scripts/_fix-moskva.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Москва"];

const PATCHES = {
  "msk-adresnaya-pomoshch": {
    criteria: { regions: R, requiresChildren: true, requiresHardship: true },
  },
  "msk-mnogodetnym-tovary": {
    criteria: { regions: R, minChildren: 5, requiresChildren: true },
  },
  "msk-mnogodetnym-odezhda": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      hasChildAgedFrom: 6, hasChildAgedTo: 18,
    },
  },
  "moskva-vyplata-molodoy-semye": {
    criteria: {
      regions: R, requiresFamily: true, requiresParentUnder35: true,
      childAgeToMonths: 12, appliesToExpecting: true,
    },
  },
  "msk-uhod-rebenok-invalid": {
    criteria: {
      regions: R, requiresDisabledChild: true, childAgeToMonths: 276,
      requiresNotEmployed: true,
    },
  },
  "msk-rost-zhizni-otdelnye": {
    criteria: {
      regions: R, requiresChildren: true,
      anyOf: [{ requiresSingleParent: true }, { requiresConscriptSpouse: true }],
    },
  },
  "msk-besplatnoe-pitanie-shkolnikov": {
    criteria: {
      regions: R, requiresChildren: true, minSchoolChildren: 1,
      anyOf: [
        { hasChildAgedFrom: 6, hasChildAgedTo: 11 },
        { minChildren: 3 },
        { requiresLowIncome: true },
      ],
    },
  },
  "msk-besplatnye-lekarstva-detyam": {
    criteria: {
      regions: R, requiresChildren: true,
      anyOf: [
        { maxYoungestChildAgeYears: 3 },
        { minChildren: 3, hasChildAgedTo: 6 },
      ],
    },
  },
  "msk-molochnaya-kuhnya": {
    criteria: {
      regions: R, requiresFamily: true,
      anyOf: [{ requiresPregnancy: true }, { hasChildAgedTo: 3 }],
    },
  },
};

const slugs = Object.keys(PATCHES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
if (before.length !== slugs.length) throw new Error("не все меры найдены");
for (const m of before) {
  console.log(m.title);
  console.log("   было: " + JSON.stringify(m.criteria));
  console.log("  стало: " + JSON.stringify(PATCHES[m.slug].criteria));
}
if (!APPLY) { console.log("\nСухой прогон. Для записи: --apply"); process.exit(0); }
writeFileSync("scripts/_backup-moskva.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
