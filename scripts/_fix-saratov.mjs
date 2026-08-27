// Саратовская область, 18 мер: вычитка условий по тексту карточек.
//
// Мусор:
//   saratov-002 — «малоимущим», хотя выплата на третьего ребёнка до трёх
//     лет: ни числа детей, ни возраста в условиях не было;
//   saratov-004/005/006 — стояло «многодетным ИЛИ малоимущим», а в тексте
//     «малоимущим многодетным»: это И, обе группы сразу;
//   saratov-010 — показывалась любой беременной, хотя выплата студенческим
//     семьям: учиться должны родители.
//
// Ошибка в условии:
//   saratov-011 (выплата на ребёнка с целиакией) — стояло «приёмная семья»,
//     хотя мера про болезнь ребёнка, а не про опеку.
//
// Недобор:
//   saratov-007 — стояло «многодетные И дети с инвалидностью» одновременно;
//     в тексте это разные группы, каждой льгота положена отдельно.
//
// Запуск: node scripts/_fix-saratov.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Саратовская область"];

const PATCHES = {
  "saratov-002": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      requiresLowIncome: true, childAgeToMonths: 36,
    },
  },
  "saratov-004": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      requiresLowIncome: true, minSchoolChildren: 1,
    },
  },
  "saratov-005": {
    criteria: { regions: R, minChildren: 3, requiresChildren: true, requiresLowIncome: true },
  },
  "saratov-006": {
    criteria: { regions: R, minChildren: 3, requiresChildren: true, requiresLowIncome: true },
  },
  "saratov-007": {
    criteria: {
      regions: R, requiresChildren: true,
      anyOf: [{ minChildren: 3 }, { requiresDisabledChild: true }],
    },
  },
  "saratov-010": {
    criteria: {
      regions: R, requiresStudent: true,
      anyOf: [{ requiresPregnancy: true }, { childAgeToMonths: 12 }],
    },
  },
  "saratov-011": {
    criteria: {
      regions: R, requiresChildren: true, requiresRareDisease: true,
      hasChildAgedTo: 18,
    },
  },
};

const slugs = Object.keys(PATCHES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
if (before.length !== slugs.length) throw new Error("не все меры найдены");
for (const m of before) {
  console.log(m.title.slice(0, 60));
  console.log("   было: " + JSON.stringify(m.criteria));
  console.log("  стало: " + JSON.stringify(PATCHES[m.slug].criteria));
}
if (!APPLY) { console.log("\nСухой прогон. Для записи: --apply"); process.exit(0); }
writeFileSync("scripts/_backup-saratov.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
