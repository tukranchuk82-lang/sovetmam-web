// Разметка пачки №10.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Прокат детских вещей: один и тот же круг получателей во всех регионах.
const RENT_GROUPS = [
  { requiresStudent: true },
  { requiresParentUnder35: true },
  { requiresSingleParent: true },
  { requiresLowIncome: true },
  { minChildren: 3 },
  { requiresSvoFamily: true },
];

const CHANGES = {
  // «Нужно быть признанным нуждающимся в улучшении жилищных условий» —
  // ключевое условие федеральной программы, которого в фильтре не было.
  "molodaya-semya": {
    requiresParentUnder35: true, requiresMortgageIntent: true,
    requiresHousingNeed: true,
  },
  "rtadd-015": {
    regions: ["Республика Татарстан"], requiresFamily: true,
    requiresParentUnder35: true, requiresHousingNeed: true,
  },
  // «Быть признанными нуждающимися в жилье по ст. 51 ЖК РФ» — здесь учёт
  // именно жилищный, а не отдельная очередь на землю.
  "chel-009": {
    regions: ["Челябинская область"], minChildren: 3,
    requiresHousingNeed: true,
  },
  "ryaz-031": {
    regions: ["Рязанская область"], minChildren: 10, requiresChildren: true,
    requiresHousingNeed: true,
  },
  "chao-019": {
    regions: ["Чукотский автономный округ"], minChildren: 3,
    requiresChildren: true, requiresMortgageIntent: true,
    requiresHousingNeed: true,
  },
  "rstadd-014": {
    regions: ["Ростовская область"], requiresSvoFamily: true,
    requiresHousingNeed: true,
  },
  // «Для студенческих, молодых семей, одиноких матерей и иных нуждающихся» —
  // стояли только малоимущие.
  "reg-kaliningradskaya-oblast-021": {
    regions: ["Калининградская область"], childAgeToMonths: 12,
    appliesToExpecting: true, anyOf: RENT_GROUPS,
  },
  // «Многодетным, малоимущим, студенческим семьям и семьям участников СВО».
  "prokat-detskih-tovarov": {
    requiresFamily: true, childAgeToMonths: 36, appliesToExpecting: true,
    anyOf: RENT_GROUPS,
  },
};

const CHECKED = JSON.parse(readFileSync("scripts/_housing-checked.json", "utf8"));
CHECKED.push(
  "yarosl-006",
  // «Состоять на учёте на участок ИЛИ как нуждающиеся в жилье» — жёсткое
  // условие отняло бы выплату у стоящих в земельной очереди.
  "oren-005",
  // Список детей-сирот на жильё — отдельный, не общий учёт нуждающихся.
  "rst-003",
  // Мера исключена из подбора (приём закрыт).
  "chao-018",
);
writeFileSync("scripts/_housing-checked.json", JSON.stringify([...new Set(CHECKED)], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch10.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch10.json");
