// Проверяем восьмую пачку.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { evaluateEligibility } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["stavropol-001", "chuv-029", "chuv-027", "spb-012", "dagestan-011"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));
const y = new Date().getFullYear();
const kid = (age) => ({ birthYear: y - age, birthMonth: 5 });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 33, spouseAge: 34, parentUnder35: true, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, ages, extra = {}) => ({ ...base, region, childrenCount: ages.length, children: ages.map(kid), childrenAges: ages, youngestChildAgeYears: Math.min(...ages), ...extra });

const cases = [
  ["Ставрополь, 3 детей, доход 1,5 ПМ, малышу 2 года", fam("Ставропольский край", [8, 5, 2], { incomePm: 1.5 }), "stavropol-001", "показываем"],
  ["Ставрополь, 3 детей, доход выше 2 ПМ", fam("Ставропольский край", [8, 5, 2], { incomePm: null }), "stavropol-001", "скрыто"],
  ["Ставрополь, 3 детей, младшему 5 лет", fam("Ставропольский край", [10, 8, 5], { incomePm: 1 }), "stavropol-001", "скрыто"],
  ["Чувашия, 3 детей, на учёте — участок или 250 000", fam("Чувашская Республика", [9, 6, 2], { housingNeedStatus: "registered" }), "chuv-029", "показываем"],
  ["Чувашия, 3 детей, просторное жильё — участок", fam("Чувашская Республика", [9, 6, 2], { ownsHome: true, homeArea: 110, residentsCount: 5, housingNeedStatus: "no" }), "chuv-029", "скрыто"],
  ["Чувашия, 4 детей, на учёте — жильё для семей 5+", fam("Чувашская Республика", [10, 8, 5, 2], { housingNeedStatus: "registered" }), "chuv-027", "скрыто"],
  ["Чувашия, 5 детей, на учёте — жильё для семей 5+", fam("Чувашская Республика", [12, 10, 8, 5, 2], { housingNeedStatus: "registered" }), "chuv-027", "показываем"],
  ["СПб, одинокая мама, малыш — прокат вещей", fam("Санкт-Петербург", [1], { singleParent: true }), "spb-012", "показываем"],
  ["СПб, обычная семья, малыш — прокат вещей", fam("Санкт-Петербург", [1]), "spb-012", "скрыто"],
  ["Дагестан, ребёнок-инвалид, тесно, не на учёте", fam("Республика Дагестан", [7], { disabledChild: true, ownsHome: true, homeArea: 30, residentsCount: 4, housingNeedStatus: "no" }), "dagestan-011", "с плашкой"],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const v = evaluateEligibility(profile, byId[slug]);
  const got = !v.fits ? "скрыто" : v.pending.length ? "с плашкой" : "показываем";
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
