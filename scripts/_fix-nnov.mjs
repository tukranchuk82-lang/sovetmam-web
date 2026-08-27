// Нижегородская область, 23 меры: вычитка условий по тексту карточек.
//
// Ошибки в условии:
//   nnov-001 — «Основа», главная региональная выплата семьям при рождении
//     ребёнка (до миллиона рублей), была помечена как мера для студентов:
//     обычные семьи её в подборке не видели;
//   nnov-009 — пособие на ребёнка-инвалида стояло только с условием о
//     доходе, инвалидности в отборе не было;
//   nnov-014 — выплаты семьям участников СВО стояли только с условием
//     беременности, самого СВО не было;
//   nnov-023 — компенсация на молочное питание требовала инвалидности
//     ребёнка, хотя положена семьям с детьми раннего возраста.
//
// Условия сложены неверно:
//   nnov-004 — «беременна ИЛИ студентка» вместо «беременная студентка».
//
// Мусор:
//   nnov-006, nnov-007, nnov-008, nnov-021 — выплаты на школьников без
//     школьного возраста;
//   nnov-019 — компенсация платы за детсад без возраста ребёнка.
//
// Запуск: node scripts/_fix-nnov.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Нижегородская область"];
const SHKOLNIK = {
  regions: R, minChildren: 3, requiresChildren: true,
  minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18,
};

const PATCHES = {
  "nnov-001": {
    criteria: {
      regions: R, requiresFamily: true,
      childAgeToMonths: 36, appliesToExpecting: true,
    },
  },
  "nnov-004": {
    criteria: {
      regions: R, requiresStudent: true, requiresPregnancy: true,
      minPregnancyWeeks: 12,
    },
  },
  "nnov-006": { criteria: SHKOLNIK },
  "nnov-007": { criteria: SHKOLNIK },
  "nnov-008": { criteria: SHKOLNIK },
  "nnov-009": {
    criteria: {
      regions: R, requiresChildren: true, requiresDisabledChild: true,
      requiresLowIncome: true,
    },
  },
  "nnov-014": {
    criteria: {
      regions: R, requiresSvoFamily: true, requiresFamily: true,
    },
  },
  "nnov-019": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      childAgeFromMonths: 18, childAgeToMonths: 84,
    },
  },
  "nnov-021": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      hasChildAgedFrom: 16, hasChildAgedTo: 19,
    },
  },
  "nnov-023": {
    criteria: {
      regions: R, requiresChildren: true, childAgeToMonths: 36,
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
writeFileSync("scripts/_backup-nnov.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
