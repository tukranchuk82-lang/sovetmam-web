// Ростовская область, 35 мер: вычитка условий по тексту карточек.
//
// Условия сложены неверно:
//   rst-008 — компенсация на питание малоимущим беременным и детям до трёх
//     лет читалась как «малоимущая ИЛИ беременная»;
//   rst-014 — выплата беременным студенткам: «беременна ИЛИ студентка»;
//   rst-011 — маткапитал за третьего ребёнка стоял без числа детей.
//
// Ошибки в условии:
//   rst-019 — льготы детям участников СВО в образовании показывались всем
//     семьям области: условия про СВО не было;
//   rst-020 — питание и выплаты студентам колледжей требовали, чтобы
//     студентом был родитель, — но платят их самому студенту, поэтому мера
//     уходит из подбора родителя;
//   rstadd-006, rstadd-007 — выплаты при ВИЧ и фенилкетонурии стояли на
//     «особых потребностях» вместо болезни ребёнка.
//
// Мусор:
//   rst-007 — выплата на молочное питание детям первых двух лет жизни
//     показывалась и беременным, и семьям с детьми до трёх;
//   rstadd-002 — компенсация платы за детсад без возраста ребёнка;
//   rstadd-008 — путёвки для детей 6–18 лет без возраста;
//   rstadd-003 — диплом многодетной матери: младшему ребёнку должно быть
//     не меньше трёх лет.
//
// Запуск: node scripts/_fix-rostov.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Ростовская область"];

const PATCHES = {
  "rst-007": {
    criteria: {
      regions: R, requiresChildren: true, requiresLowIncome: true,
      childAgeToMonths: 24,
    },
  },
  "rst-008": {
    criteria: {
      regions: R, requiresFamily: true, requiresLowIncome: true,
      anyOf: [{ requiresPregnancy: true }, { maxYoungestChildAgeYears: 3 }],
    },
  },
  "rst-011": {
    criteria: {
      regions: R, minChildren: 3, requiresFamily: true, requiresLowIncome: true,
    },
  },
  "rst-014": {
    criteria: {
      regions: R, requiresStudent: true, requiresPregnancy: true,
      requiresEarlyRegistration: true,
    },
  },
  "rst-019": {
    criteria: { regions: R, requiresChildren: true, requiresSvoFamily: true },
  },
  "rst-020": {
    criteria: { regions: R, requiresStudent: true },
  },
  "rstadd-002": {
    criteria: {
      regions: R, requiresChildren: true,
      childAgeFromMonths: 18, childAgeToMonths: 84,
    },
  },
  "rstadd-003": {
    criteria: {
      regions: R, minChildren: 4, requiresChildren: true, hasChildAgedFrom: 3,
    },
  },
  "rstadd-006": {
    criteria: { regions: R, requiresChildren: true, requiresRareDisease: true },
  },
  "rstadd-007": {
    criteria: {
      regions: R, requiresChildren: true, requiresRareDisease: true,
      hasChildAgedTo: 18,
    },
  },
  "rstadd-008": {
    criteria: {
      regions: R, requiresChildren: true, requiresLowIncome: true,
      hasChildAgedFrom: 6, hasChildAgedTo: 18,
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
writeFileSync("scripts/_backup-rostov.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
