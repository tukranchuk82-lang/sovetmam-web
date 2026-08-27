// Краснодарский край, 34 меры: вычитка условий по тексту карточек.
//
// Условия сложены неверно (ИЛИ вместо И — мера уходит лишним):
//   krd-004, krdadd-003 — компенсация на питание малоимущим беременным и
//     детям до трёх лет читалась как «малоимущая ИЛИ беременная»;
//   krdadd-002 — выплата на третьего ребёнка до трёх лет: «многодетная ИЛИ
//     малоимущая», без возраста ребёнка вовсе;
//   krd-016 — питание студентам из многодетных семей;
//   krdadd-010 — помощь детям участников СВО читалась как «семья СВО ИЛИ
//     студент», поэтому приходила любой студенческой семье.
//
// Мусор:
//   krd-007 — компенсация путёвок требовала ребёнка с инвалидностью, хотя
//     положена всем семьям, а инвалидность лишь повышает размер;
//   krd-011 — медаль за четверых детей без порога по числу детей;
//   krd-013, krd-017 — проезд обучающимся и лекарства до шести лет без
//     возрастных границ;
//   krd-019 — гибкий график многодетным без условия о работе;
//   krd-021 — проезд детям-сиротам показывался всем семьям;
//   krdadd-013 — выплата детям до 18 лет без возрастной границы.
//
// Запуск: node scripts/_fix-krasnodar.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Краснодарский край"];
const PITANIE = {
  regions: R, requiresFamily: true, requiresLowIncome: true,
  anyOf: [{ requiresPregnancy: true }, { maxYoungestChildAgeYears: 3 }],
};

const PATCHES = {
  "krd-004": { criteria: PITANIE },
  "krdadd-003": { criteria: PITANIE },
  "krdadd-002": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      requiresLowIncome: true, maxYoungestChildAgeYears: 3,
    },
  },
  "krd-007": {
    criteria: {
      regions: R, requiresChildren: true, hasChildAgedFrom: 3, hasChildAgedTo: 18,
    },
  },
  "krd-011": { criteria: { regions: R, minChildren: 4, requiresChildren: true } },
  "krd-013": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      hasChildAgedFrom: 6, hasChildAgedTo: 18,
    },
  },
  "krd-016": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      anyOf: [{ requiresChildStudying: true }, { hasChildAgedFrom: 15, hasChildAgedTo: 21 }],
    },
  },
  "krd-017": {
    criteria: { regions: R, minChildren: 3, requiresChildren: true, hasChildAgedTo: 6 },
  },
  "krd-019": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true, requiresEmployed: true,
    },
  },
  "krd-021": { criteria: { regions: R, requiresFosterParent: true } },
  "krdadd-010": {
    criteria: {
      regions: R, requiresSvoFamily: true, requiresChildren: true,
      hasChildAgedTo: 19,
    },
  },
  "krdadd-013": {
    criteria: {
      regions: R, requiresSvoFamily: true, requiresChildren: true,
      hasChildAgedTo: 18,
    },
  },
};

const slugs = Object.keys(PATCHES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
if (before.length !== slugs.length) throw new Error("не все меры найдены");
for (const m of before) {
  console.log(m.title.slice(0, 62));
  console.log("   было: " + JSON.stringify(m.criteria));
  console.log("  стало: " + JSON.stringify(PATCHES[m.slug].criteria));
}
if (!APPLY) { console.log("\nСухой прогон. Для записи: --apply"); process.exit(0); }
writeFileSync("scripts/_backup-krasnodar.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
