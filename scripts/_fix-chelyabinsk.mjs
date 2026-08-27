// Челябинская область, 27 мер: вычитка условий по тексту карточек.
//
// Условия сложены неверно:
//   chel-001 — областной маткапитал за третьего ребёнка стоял только с
//     условием о доходе, числа детей не было;
//   chel-005 — выплата на ЖКУ многодетным малоимущим читалась как «ИЛИ»;
//   chel-017 — путёвки требовали и статуса СВО, и ребёнка с инвалидностью
//     одновременно, хотя положены школьникам по медпоказаниям, а семьям СВО
//     лишь приоритетно;
//   chel-025 — компенсация обучения детям участников СВО показывалась любой
//     студенческой семье: условия про СВО не было вовсе;
//   chel-026 — стипендия читалась как «малоимущая ИЛИ приёмная ИЛИ студент»
//     и приходила семьям без студентов.
//
// Мусор:
//   chel-006, chel-007 — выплаты на проезд и школьную форму без школьников;
//   chel-008 — выплата на диету при редких болезнях требовала инвалидности;
//   chel-023 — выплата на микроавтобус семьям с восемью детьми стояла с
//     порогом «трое»;
//   chel-013 — питание школьников: не было ни начальных классов, ни ОВЗ;
//   chel-014 — первоочередной приём в сад без возраста ребёнка.
//
// Запуск: node scripts/_fix-chelyabinsk.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Челябинская область"];

const PATCHES = {
  "chel-001": {
    criteria: { regions: R, minChildren: 3, requiresFamily: true, requiresLowIncome: true },
  },
  "chel-005": {
    criteria: { regions: R, minChildren: 3, requiresChildren: true, requiresLowIncome: true },
  },
  "chel-006": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18,
    },
  },
  "chel-007": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18,
    },
  },
  "chel-008": {
    criteria: {
      regions: R, requiresChildren: true, requiresRareDisease: true, hasChildAgedTo: 18,
    },
  },
  "chel-013": {
    criteria: {
      regions: R, requiresChildren: true, minSchoolChildren: 1,
      anyOf: [
        { hasChildAgedFrom: 6, hasChildAgedTo: 11 },
        { minChildren: 3 },
        { requiresLowIncome: true },
        { requiresDisabledChild: true },
        { requiresSvoFamily: true },
      ],
    },
  },
  "chel-014": {
    criteria: { regions: R, minChildren: 3, requiresChildren: true, hasChildAgedTo: 7 },
  },
  "chel-017": {
    criteria: {
      regions: R, requiresChildren: true, minSchoolChildren: 1,
      hasChildAgedFrom: 6, hasChildAgedTo: 18,
    },
  },
  "chel-023": {
    criteria: { regions: R, minChildren: 8, requiresChildren: true },
  },
  "chel-025": {
    criteria: {
      regions: R, requiresSvoFamily: true, requiresChildren: true,
      requiresChildStudying: true,
    },
  },
  "chel-026": {
    criteria: { regions: R, requiresStudent: true },
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
writeFileSync("scripts/_backup-chelyabinsk.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
