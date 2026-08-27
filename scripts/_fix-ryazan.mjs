// Рязанская область, 51 мера: вычитка условий по тексту карточек.
//
// Мусор:
//   ryaz-001 — «беременна ИЛИ студентка», хотя выплата беременным студенткам:
//     это И, обе группы сразу;
//   ryaz-004 — компенсация платы за детсад показывалась семьям с детьми
//     любого возраста, включая школьников и взрослых;
//   ryaz-006 — выплата на жильё сельским семьям падала и городским;
//   ryaz-010 — путёвки в лагерь семьям с младенцами;
//   ryaz-011 — компенсация аренды «при рождении ребёнка» шла и бездетным
//     молодым семьям.
//
// Ошибки в условии:
//   ryaz-023 — бесплатное питание детям из многодетных семей требовало,
//     чтобы студентом был сам родитель;
//   ryaz-038 и ryaz-040 — выплаты на питание при целиакии и изделия при
//     диабете стояли вовсе без условия о болезни ребёнка.
//
// Запуск: node scripts/_fix-ryazan.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Рязанская область"];

const PATCHES = {
  "ryaz-001": { criteria: { regions: R, requiresStudent: true, requiresPregnancy: true } },
  "ryaz-004": {
    criteria: {
      regions: R, requiresChildren: true,
      childAgeFromMonths: 18, childAgeToMonths: 84,
    },
  },
  "ryaz-006": {
    criteria: { regions: R, requiresChildren: true, requiresSettlement: ["village"] },
  },
  "ryaz-010": {
    criteria: { regions: R, requiresChildren: true, hasChildAgedFrom: 6, hasChildAgedTo: 18 },
  },
  "ryaz-011": {
    criteria: {
      regions: R, requiresChildren: true, requiresParentUnder35: true,
      maxYoungestChildAgeYears: 3,
    },
  },
  "ryaz-023": {
    criteria: {
      regions: R, minChildren: 3, requiresChildren: true,
      anyOf: [{ minSchoolChildren: 1 }, { requiresChildStudying: true }],
    },
  },
  "ryaz-038": {
    criteria: {
      regions: R, requiresChildren: true, requiresRareDisease: true,
      hasChildAgedTo: 18,
    },
  },
  "ryaz-040": {
    criteria: {
      regions: R, requiresChildren: true, hasChildAgedTo: 18,
      anyOf: [{ requiresRareDisease: true }, { requiresDisabledChild: true }],
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
writeFileSync("scripts/_backup-ryazan.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
