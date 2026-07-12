// Аудит точности подбора: ищем меры, которые ПО ТЕКСТУ адресованы узкой группе
// (инвалиды, беременные, сироты, малоимущие, СВО, студенты…), но не имеют
// соответствующего критерия — такие меры пролезают в подбор к любому.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
let all = [];
let from = 0;
while (true) {
  const { data } = await sb
    .from("measures")
    .select("slug,title,short_description,amount,criteria,level,region")
    .eq("is_published", true)
    .range(from, from + 999);
  all = all.concat(data);
  if (data.length < 1000) break;
  from += 1000;
}
const txt = (m) =>
  ((m.title || "") + " " + (m.short_description || "") + " " + (m.amount || "")).toLowerCase();

// Признак «мера про эту группу» по тексту → какой критерий обязан стоять
const GROUPS = [
  {
    key: "requiresDisabledChild",
    name: "дети-инвалиды",
    re: /ребёнок-инвалид|ребенок-инвалид|дет(ям|ей|и)-инвалид|детям с инвалидностью|инвалид[а-яё]* с детства|ребёнку-инвалиду/i,
  },
  {
    key: "requiresDisabledParent",
    name: "родитель-инвалид",
    re: /родител(ь|и|ей|ям)-инвалид|инвалид[а-яё]* i{1,3} группы|инвалид[а-яё]* 1 группы|инвалид[а-яё]* 2 группы/i,
  },
  {
    key: "requiresPregnancy",
    name: "беременные",
    re: /беременн|по беременности|вставш[а-яё]* на учёт|при постановке на учёт|родам\b/i,
  },
  {
    key: "requiresFosterParent",
    name: "приёмные/опекуны/сироты",
    re: /сирот|опекун|попечит|приёмн[а-яё]* (семь|родител|ребён)|усыновител|без попечения родителей|патронат/i,
  },
  {
    key: "requiresLowIncome",
    name: "малоимущие",
    re: /малоимущ|малообеспеч|нуждающ|ниже прожиточного|ниже величины прожиточного|низк[а-яё]* доход/i,
  },
  {
    key: "requiresSvoFamily",
    name: "СВО",
    re: /\bсво\b|специальн[а-яё]* военн[а-яё]* операц|мобилизованн|участник[а-яё]* боевых действий|ветеран[а-яё]* боевых/i,
  },
  {
    key: "requiresStudent",
    name: "студенты",
    re: /студент|обучающ[а-яё]* по очной|аспирант|курсант/i,
  },
];

console.log(`опубликовано: ${all.length}\n`);
console.log("МЕРЫ, ПРОЛЕЗАЮЩИЕ В ЛЮБОЙ ПОДБОР (текст про группу, критерия нет):\n");
let total = 0;
const holes = {};
for (const g of GROUPS) {
  const bad = all.filter((m) => g.re.test(txt(m)) && !m.criteria?.[g.key]);
  holes[g.key] = bad;
  total += bad.length;
  const hit = all.filter((m) => g.re.test(txt(m)));
  console.log(
    `  ${g.name.padEnd(26)} по тексту: ${String(hit.length).padStart(4)}   БЕЗ критерия: ${String(bad.length).padStart(4)}`,
  );
}
console.log(`\nвсего дыр (с повторами): ${total}`);

console.log("\n--- примеры (по 4 на группу):");
for (const g of GROUPS) {
  const bad = holes[g.key];
  if (!bad.length) continue;
  console.log(`\n[${g.name}]`);
  bad.slice(0, 4).forEach((m) =>
    console.log(`  · ${m.title.slice(0, 66)}  {${Object.keys(m.criteria ?? {}).join(",") || "нет критериев"}}`),
  );
}

// Сколько мер вообще без единого «сужающего» критерия
const NARROW = GROUPS.map((g) => g.key).concat([
  "requiresChildren",
  "requiresPregnancy",
  "minChildren",
  "maxIncomePm",
  "requiresManyChildren",
  "requiresSingleParent",
  "requiresMortgageIntent",
  "requiresParentUnder35",
  "requiresSelfEmployed",
  "requiresEntrepreneur",
  "requiresSpecialNeedsChild",
  "maxYoungestChildAgeYears",
]);
const wide = all.filter((m) => {
  const c = m.criteria ?? {};
  return !NARROW.some((k) => c[k]);
});
console.log(`\nмер вообще без сужающих критериев (видны всем): ${wide.length}`);
