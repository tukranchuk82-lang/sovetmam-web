// Московская область, 31 мера: вычитка условий по тексту карточек.
//
// Ошибки в условии (мера уходила совсем не тем):
//   moadd-011 — социальная ипотека учителям, врачам и молодым учёным была
//     помечена как мера для студентов;
//   moadd-012 — субсидия молодым семьям на жильё — тоже «для студентов»;
//   moadd-013 — такси требовало и статуса СВО, и ребёнка с инвалидностью
//     одновременно, хотя в тексте это две разные группы.
//
// Мусор:
//   moadd-002 — выплата неработающему родителю шла и работающим;
//   moadd-003, moadd-006 — без возрастных границ (до 18 и до 6 лет);
//   mo-otdyh-detey, mo-podarok-pervoklassniku — без возраста ребёнка;
//   mo-kompensaciya-platy-detsad — только многодетным, хотя положена и
//     семьям с пособием, и без возрастной границы детсада.
//
// Недобор:
//   mo-pitanie-beremennyh-i-detey-do-3 — показывалась только беременным,
//     хотя выплата и на детей до трёх лет;
//   mo-pitanie-shkolnikov — «есть дети»: ни начальных классов, ни льготных
//     категорий в условиях не было.
//
// Запуск: node scripts/_fix-mosobl.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Московская область"];

const PATCHES = {
  "moadd-002": {
    criteria: { regions: R, requiresDisabledChild: true, requiresNotEmployed: true },
  },
  "moadd-003": {
    criteria: { regions: R, requiresDisabledChild: true, hasChildAgedTo: 18 },
  },
  "moadd-006": {
    criteria: { regions: R, minChildren: 3, requiresChildren: true, hasChildAgedTo: 6 },
  },
  "moadd-011": {
    criteria: {
      regions: R,
      requiresWorkField: ["education", "medicine"],
      requiresMortgageIntent: true,
    },
  },
  "moadd-012": {
    criteria: {
      regions: R, requiresFamily: true, requiresParentUnder35: true,
      requiresHousingNeed: true,
    },
  },
  "moadd-013": {
    criteria: {
      regions: R, requiresSvoFamily: true,
      anyOf: [{ requiresDisabledParent: true }, { requiresDisabledChild: true }],
    },
  },
  "mo-kompensaciya-platy-detsad": {
    criteria: {
      regions: R, requiresChildren: true,
      childAgeFromMonths: 18, childAgeToMonths: 84,
      anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
    },
  },
  "mo-otdyh-detey": {
    criteria: { regions: R, requiresChildren: true, hasChildAgedFrom: 6, hasChildAgedTo: 18 },
  },
  "mo-podarok-pervoklassniku": {
    criteria: {
      regions: R, requiresChildren: true, requiresLowIncome: true,
      hasChildAgedFrom: 6, hasChildAgedTo: 8,
    },
  },
  "mo-pitanie-beremennyh-i-detey-do-3": {
    criteria: {
      regions: R, requiresFamily: true,
      anyOf: [{ requiresPregnancy: true }, { maxYoungestChildAgeYears: 3 }],
    },
  },
  "mo-pitanie-shkolnikov": {
    criteria: {
      regions: R, requiresChildren: true, minSchoolChildren: 1,
      anyOf: [
        { hasChildAgedFrom: 6, hasChildAgedTo: 11 },
        { minChildren: 3 },
        { requiresLowIncome: true },
        { requiresDisabledChild: true },
      ],
    },
  },
};

const slugs = Object.keys(PATCHES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
if (before.length !== slugs.length) {
  const found = before.map((m) => m.slug);
  throw new Error("не нашлись: " + slugs.filter((s) => !found.includes(s)).join(", "));
}
for (const m of before) {
  console.log(m.title.slice(0, 62));
  console.log("   было: " + JSON.stringify(m.criteria));
  console.log("  стало: " + JSON.stringify(PATCHES[m.slug].criteria));
}
if (!APPLY) { console.log("\nСухой прогон. Для записи: --apply"); process.exit(0); }
writeFileSync("scripts/_backup-mosobl.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
