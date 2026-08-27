// Иркутская область, 19 мер: вычитка условий по тексту карточек.
//
// Ошибки в условии:
//   irkutsk-001 — областной маткапитал требовал одновременно двоих детей,
//     низкого дохода И ребёнка с инвалидностью: адаптация детей-инвалидов
//     там лишь одно из направлений расходования, а не условие;
//   irkutsk-007 — выплата по уходу за ребёнком-инвалидом читалась как
//     «инвалидность ИЛИ приёмная семья» и не проверяла, что родитель не
//     работает, — а выплату дают именно неработающему;
//   irkutsk-018 — содержание подопечного тоже уходило семьям с ребёнком с
//     инвалидностью, хотя мера про опеку;
//   irkutsk-019 — выплата усыновителям стояла без условия об усыновлении.
//
// Мусор:
//   irkutsk-002 — выплата на третьего ребёнка до трёх лет без возраста;
//   irkutsk-003, irkutsk-004 — выплаты при рождении без срока обращения;
//   irkutsk-009, irkutsk-010, irkutsk-011 — школьные меры без школьников;
//   irkutsk-013 — знак «Материнская слава» стоял с порогом «трое детей»,
//     хотя нужны четверо и восемь лет младшему;
//   irkutsk-014, irkutsk-016 — меры семьям СВО без детей в условиях.
//
// Запуск: node scripts/_fix-irkutsk.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Иркутская область"];

const PATCHES = {
  "irkutsk-001": {
    criteria: { regions: R, minChildren: 2, requiresFamily: true },
  },
  "irkutsk-002": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      maxYoungestChildAgeYears: 3,
    },
  },
  "irkutsk-003": {
    criteria: {
      regions: R, requiresFamily: true, requiresLowIncome: true,
      childAgeToMonths: 12, appliesToExpecting: true,
    },
  },
  "irkutsk-004": {
    criteria: {
      regions: R, requiresFamily: true, requiresLowIncome: true,
      childAgeToMonths: 12, appliesToExpecting: true,
    },
  },
  "irkutsk-007": {
    criteria: {
      regions: R, requiresChildren: true, requiresDisabledChild: true,
      requiresNotEmployed: true,
    },
  },
  "irkutsk-009": {
    criteria: {
      regions: R, requiresChildren: true, minSchoolChildren: 1,
      hasChildAgedFrom: 11, hasChildAgedTo: 18,
      anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
    },
  },
  "irkutsk-010": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18,
    },
  },
  "irkutsk-011": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      minSchoolChildren: 1, hasChildAgedFrom: 6, hasChildAgedTo: 18,
    },
  },
  "irkutsk-013": {
    criteria: {
      regions: R, minChildren: 4, requiresChildren: true, hasChildAgedFrom: 8,
    },
  },
  "irkutsk-014": {
    criteria: {
      regions: R, requiresSvoFamily: true, requiresFamily: true,
      childAgeToMonths: 12, appliesToExpecting: true,
    },
  },
  "irkutsk-016": {
    criteria: { regions: R, requiresSvoFamily: true, requiresChildren: true },
  },
  "irkutsk-018": {
    criteria: { regions: R, requiresFosterParent: true },
  },
  "irkutsk-019": {
    criteria: {
      regions: R, requiresFosterParent: true,
      anyOf: [{ requiresDisabledChild: true }, { hasChildAgedFrom: 7 }],
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
writeFileSync("scripts/_backup-irkutsk.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
