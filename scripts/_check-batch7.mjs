// Проверяем седьмую пачку.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { evaluateEligibility } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["kirov-026", "bsh-020", "krym-008"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));
const y = new Date().getFullYear();
const kid = (age) => ({ birthYear: y - age, birthMonth: 5 });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 30, spouseAge: 31, parentUnder35: true, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, ages, extra = {}) => ({ ...base, region, childrenCount: ages.length, children: ages.map(kid), childrenAges: ages, youngestChildAgeYears: Math.min(...ages), ...extra });

const cases = [
  ["Киров, молодая семья на учёте — субсидия на жильё", fam("Кировская область", [3], { housingNeedStatus: "registered" }), "kirov-026", "показываем"],
  ["Киров, молодая семья, просторное жильё — субсидия", fam("Кировская область", [3], { ownsHome: true, homeArea: 100, residentsCount: 3, housingNeedStatus: "no" }), "kirov-026", "скрыто"],
  ["Киров, родителям 45 лет, на учёте — субсидия", fam("Кировская область", [3], { parentAge: 45, spouseAge: 46, parentUnder35: false, housingNeedStatus: "registered" }), "kirov-026", "скрыто"],
  ["Башкортостан, 3 детей, тесно, не на учёте — выплата", fam("Республика Башкортостан", [10, 6, 2], { ownsHome: true, homeArea: 45, residentsCount: 5, housingNeedStatus: "no" }), "bsh-020", "с плашкой"],
  ["Крым, малоимущая, на учёте — компенсация найма", fam("Республика Крым", [5], { incomePm: 1, lowIncome: true, housingNeedStatus: "registered" }), "krym-008", "показываем"],
  ["Крым, доход выше 2 ПМ, на учёте — компенсация найма", fam("Республика Крым", [5], { housingNeedStatus: "registered" }), "krym-008", "скрыто"],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const v = evaluateEligibility(profile, byId[slug]);
  const got = !v.fits ? "скрыто" : v.pending.length ? "с плашкой" : "показываем";
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
