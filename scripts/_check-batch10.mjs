// Проверяем десятую пачку.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { evaluateEligibility } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["molodaya-semya", "chel-009", "ryaz-031", "prokat-detskih-tovarov", "rstadd-014"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));
const y = new Date().getFullYear();
const kid = (age) => ({ birthYear: y - age, birthMonth: 5 });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 30, spouseAge: 31, parentUnder35: true, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, ages, extra = {}) => ({ ...base, region, childrenCount: ages.length, children: ages.map(kid), childrenAges: ages, youngestChildAgeYears: ages.length ? Math.min(...ages) : null, ...extra });

const cases = [
  ["Молодая семья на учёте, планирует ипотеку", fam("Москва", [2], { mortgageIntent: true, housingNeedStatus: "registered" }), "molodaya-semya", "показываем"],
  ["Молодая семья, просторное жильё, планирует ипотеку", fam("Москва", [2], { mortgageIntent: true, ownsHome: true, homeArea: 100, residentsCount: 3, housingNeedStatus: "no" }), "molodaya-semya", "скрыто"],
  ["Молодая семья, тесно, не на учёте", fam("Москва", [2], { mortgageIntent: true, ownsHome: true, homeArea: 33, residentsCount: 3, housingNeedStatus: "no" }), "molodaya-semya", "с плашкой"],
  ["Челябинск, 3 детей, на учёте — участок", fam("Челябинская область", [9, 6, 2], { housingNeedStatus: "registered" }), "chel-009", "показываем"],
  ["Рязань, 5 детей, на учёте — выплата для семей 10+", fam("Рязанская область", [12, 10, 7, 4, 2], { housingNeedStatus: "registered" }), "ryaz-031", "скрыто"],
  ["Прокат: студенческая семья, малыш 1 год", fam("Москва", [1], { student: true }), "prokat-detskih-tovarov", "показываем"],
  ["Прокат: молодая семья (30 лет), малыш — положен как молодой", fam("Москва", [1]), "prokat-detskih-tovarov", "показываем"],
  ["Прокат: родителям 40 лет, один ребёнок, доход обычный", fam("Москва", [1], { parentAge: 40, spouseAge: 42, parentUnder35: false }), "prokat-detskih-tovarov", "скрыто"],
  ["Прокат: семья СВО, ждёт ребёнка", { ...fam("Москва", []), pregnant: true, hasChildren: false, childrenCount: 0, children: [], childrenAges: [], svoFamily: true }, "prokat-detskih-tovarov", "показываем"],
  ["Ростов, семья СВО на учёте — субсидия ставки", fam("Ростовская область", [3], { svoFamily: true, housingNeedStatus: "registered" }), "rstadd-014", "показываем"],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const v = evaluateEligibility(profile, byId[slug]);
  const got = !v.fits ? "скрыто" : v.pending.length ? "с плашкой" : "показываем";
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
