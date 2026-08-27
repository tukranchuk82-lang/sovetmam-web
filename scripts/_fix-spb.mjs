// Санкт-Петербург, 31 мера: вычитка условий по тексту карточек.
//
// Мусор:
//   spb-002, spb-003 — пособия «от 1,5 до 7» и «от 7 до 16/18» стояли без
//     возрастных границ вовсе;
//   spb-004, spb-005 — пособия на ребёнка до 18 без верхней границы;
//   spb-007 — единовременная выплата при рождении шла семьям с любыми
//     детьми, хотя обращаться нужно, пока ребёнку нет полутора лет;
//   spb-008 — выплата родившим первого в 19–24 года не проверяла, что
//     ребёнок только что родился;
//   spb-009 — «беременна ИЛИ студентка» вместо «беременная студентка»;
//   spb-017 — выплата матерям пяти детей стояла с порогом «трое»;
//   spb-023 — дачи семьям с пятью детьми — тоже «трое»;
//   spb-018, spb-026 — выплаты и проезд для детей без возрастных границ.
//
// Ошибки в условии:
//   spb-014 — распоряжение маткапиталом требовало ребёнка с инвалидностью,
//     хотя капитал даётся за третьего ребёнка, а реабилитация — лишь одно
//     из направлений расходования.
//
// Недобор:
//   spb-010 — подарок новорождённому требовал уже рождённых детей, поэтому
//     беременные его не видели.
//
// Запуск: node scripts/_fix-spb.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Санкт-Петербург"];

const PATCHES = {
  "spb-002": {
    criteria: {
      regions: R, requiresChildren: true, requiresLowIncome: true,
      childAgeFromMonths: 18, childAgeToMonths: 84,
    },
  },
  "spb-003": {
    criteria: {
      regions: R, requiresChildren: true, requiresLowIncome: true,
      hasChildAgedFrom: 7, hasChildAgedTo: 18,
    },
  },
  "spb-004": {
    criteria: { regions: R, requiresDisabledChild: true, hasChildAgedTo: 18 },
  },
  "spb-005": {
    criteria: {
      regions: R, requiresChildren: true, requiresDisabledParent: true,
      hasChildAgedTo: 18,
    },
  },
  "spb-007": {
    criteria: {
      regions: R, requiresFamily: true,
      childAgeToMonths: 18, appliesToExpecting: true,
    },
  },
  "spb-008": {
    criteria: {
      regions: R, requiresChildren: true, maxParentAge: 24, childAgeToMonths: 18,
    },
  },
  "spb-009": {
    criteria: {
      regions: R, requiresStudent: true, requiresPregnancy: true,
      requiresEarlyRegistration: true,
    },
  },
  "spb-010": {
    criteria: {
      regions: R, requiresFamily: true,
      anyOf: [{ requiresPregnancy: true }, { hasChildAgedTo: 0 }],
    },
  },
  "spb-014": {
    criteria: { regions: R, minChildren: 3, requiresFamily: true },
  },
  "spb-017": {
    criteria: { regions: R, minChildren: 5, requiresChildren: true },
  },
  "spb-018": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      hasChildAgedFrom: 6, hasChildAgedTo: 23,
    },
  },
  "spb-023": {
    criteria: {
      regions: R, minChildren: 5, requiresChildren: true, hasChildAgedTo: 16,
    },
  },
  "spb-026": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true, hasChildAgedTo: 23,
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
writeFileSync("scripts/_backup-spb.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
