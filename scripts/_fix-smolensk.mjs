// Смоленская область, 34 меры: вычитка условий по тексту карточек.
//
// Недобор (условия сложены через И там, где в тексте ИЛИ):
//   smol-002 — выплата на питание требовала быть беременной И иметь ребёнка
//     до трёх лет одновременно;
//   smol-029, smol-030 — стипендия и питание студентам из многодетных семей
//     стояли как «многодетная ИЛИ студент», хотя нужны обе части: студент
//     из многодетной семьи.
//
// Мусор:
//   smol-005 — пособие на ребёнка, не посещающего сад, без возраста и без
//     условий, при которых оно назначается;
//   smol-006 — питание 5–11 классов без возрастной границы;
//   smol-008 — компенсация платы за детсад без возраста;
//   smol-013 — «беременна ИЛИ студентка» вместо «беременная студентка»;
//   smol-024 — первоочередной приём в детсад показывался всем семьям;
//   smol-033 — сертификат на путёвку для детей 7–17 лет без возраста;
//   smol-007 — выплата студенткам при рождении без срока обращения.
//
// Запуск: node scripts/_fix-smolensk.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Смоленская область"];

const PATCHES = {
  "smol-002": {
    criteria: {
      regions: R, requiresFamily: true,
      anyOf: [{ requiresPregnancy: true }, { maxYoungestChildAgeYears: 3 }],
    },
  },
  "smol-005": {
    criteria: {
      regions: R, requiresChildren: true,
      childAgeFromMonths: 18, childAgeToMonths: 84,
      anyOf: [{ requiresDisabledParent: true }, { requiresSpecialNeedsChild: true }],
    },
  },
  "smol-006": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      hasChildAgedFrom: 11, hasChildAgedTo: 18, minSchoolChildren: 1,
    },
  },
  "smol-007": {
    criteria: {
      regions: R, requiresStudent: true, requiresChildren: true,
      childAgeToMonths: 12,
    },
  },
  "smol-008": {
    criteria: {
      regions: R, requiresChildren: true,
      childAgeFromMonths: 18, childAgeToMonths: 84,
    },
  },
  "smol-013": {
    criteria: {
      regions: R, requiresStudent: true, requiresPregnancy: true,
      requiresEarlyRegistration: true,
    },
  },
  "smol-024": {
    criteria: {
      regions: R, requiresChildren: true, hasChildAgedTo: 7,
      anyOf: [
        { requiresSvoFamily: true },
        { minChildren: 3 },
        { requiresDisabledChild: true },
      ],
    },
  },
  "smol-029": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      requiresChildStudying: true,
    },
  },
  "smol-030": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      anyOf: [{ requiresChildStudying: true }, { hasChildAgedFrom: 15, hasChildAgedTo: 21 }],
    },
  },
  "smol-033": {
    criteria: {
      regions: R, requiresChildren: true, hasChildAgedFrom: 7, hasChildAgedTo: 17,
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
writeFileSync("scripts/_backup-smolensk.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
