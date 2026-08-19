// Проверяем девятую пачку.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { evaluateEligibility } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["chel-016", "hmao-018", "rtadd-003", "tat-009", "oren-013"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));
const y = new Date().getFullYear();
const kid = (age) => ({ birthYear: y - age, birthMonth: 5 });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 31, spouseAge: 32, parentUnder35: true, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, ages, extra = {}) => ({ ...base, region, childrenCount: ages.length, children: ages.map(kid), childrenAges: ages, youngestChildAgeYears: Math.min(...ages), ...extra });

const cases = [
  ["Челябинск, молодая семья на учёте, НЕ студенты", fam("Челябинская область", [2], { housingNeedStatus: "registered" }), "chel-016", "показываем"],
  ["Челябинск, молодая семья, просторное жильё", fam("Челябинская область", [2], { ownsHome: true, homeArea: 90, residentsCount: 3, housingNeedStatus: "no" }), "chel-016", "скрыто"],
  ["ХМАО, 3 детей, тесно, не на учёте — участок", fam("Ханты-Мансийский автономный округ — Югра", [9, 5, 2], { ownsHome: true, homeArea: 40, residentsCount: 5, housingNeedStatus: "no" }), "hmao-018", "с плашкой"],
  ["Татарстан, молодая семья на учёте — соципотека 7%", fam("Республика Татарстан", [1], { housingNeedStatus: "registered" }), "rtadd-003", "показываем"],
  ["Татарстан, родителям 45 лет, на учёте — соципотека", fam("Республика Татарстан", [1], { parentAge: 45, spouseAge: 46, parentUnder35: false, housingNeedStatus: "registered" }), "rtadd-003", "скрыто"],
  ["Татарстан, ребёнок-инвалид, доход выше ПМ — доплата", fam("Республика Татарстан", [7], { disabledChild: true }), "tat-009", "скрыто"],
  ["Татарстан, ребёнок-инвалид, малоимущая — доплата", fam("Республика Татарстан", [7], { disabledChild: true, incomePm: 1, lowIncome: true }), "tat-009", "показываем"],
  ["Оренбург, планируют ипотеку, на учёте — взнос", fam("Оренбургская область", [3], { mortgageIntent: true, housingNeedStatus: "registered" }), "oren-013", "показываем"],
  ["Оренбург, ипотеку не планируют — взнос", fam("Оренбургская область", [3], { mortgageIntent: false, housingNeedStatus: "registered" }), "oren-013", "скрыто"],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const v = evaluateEligibility(profile, byId[slug]);
  const got = !v.fits ? "скрыто" : v.pending.length ? "с плашкой" : "показываем";
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
