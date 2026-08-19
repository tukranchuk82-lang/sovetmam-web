// Проверяем эффект шестой пачки: жилищная нуждаемость и «и» вместо «или».
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { evaluateEligibility, PENDING_TEXT } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["krasn-002", "tula-023", "reg-novosibirskaya-oblast-020", "reg-kaliningradskaya-oblast-022"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));

const y = new Date().getFullYear();
const kid = (age) => ({ birthYear: y - age, birthMonth: 5 });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 38, spouseAge: 39, parentUnder35: false, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, ages, extra = {}) => ({ ...base, region, childrenCount: ages.length, children: ages.map(kid), childrenAges: ages, youngestChildAgeYears: Math.min(...ages), ...extra });

const cases = [
  ["Красноярск, 3 детей, на учёте нуждающихся — сертификат", fam("Красноярский край", [10, 7, 3], { housingNeedStatus: "registered" }), "krasn-002", "показываем"],
  ["Красноярск, 3 детей, тесное жильё, не на учёте", fam("Красноярский край", [10, 7, 3], { ownsHome: true, homeArea: 40, residentsCount: 5, housingNeedStatus: "no" }), "krasn-002", "с плашкой"],
  ["Красноярск, 3 детей, просторное жильё", fam("Красноярский край", [10, 7, 3], { ownsHome: true, homeArea: 120, residentsCount: 5, housingNeedStatus: "no" }), "krasn-002", "скрыто"],
  ["Тула, 3 детей, малоимущая, на учёте — выплата 5+", fam("Тульская область", [10, 7, 3], { incomePm: 1, lowIncome: true, housingNeedStatus: "registered" }), "tula-023", "скрыто"],
  ["Тула, 5 детей, малоимущая, на учёте — выплата 5+", fam("Тульская область", [12, 10, 7, 5, 2], { incomePm: 1, lowIncome: true, housingNeedStatus: "registered" }), "tula-023", "показываем"],
  ["Новосибирск, малоимущая без инвалидности — выплата 16 500", fam("Новосибирская область", [8], { incomePm: 1, lowIncome: true }), "reg-novosibirskaya-oblast-020", "скрыто"],
  ["Новосибирск, 3 детей с инвалидностью — выплата 16 500", fam("Новосибирская область", [12, 8, 4], { disabledChild: true }), "reg-novosibirskaya-oblast-020", "показываем"],
  ["Калининград, студенческая семья, малыш — соцняня", fam("Калининградская область", [1], { student: true }), "reg-kaliningradskaya-oblast-022", "показываем"],
  ["Калининград, обычная семья, малыш — соцняня", fam("Калининградская область", [1]), "reg-kaliningradskaya-oblast-022", "скрыто"],
];

let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const v = evaluateEligibility(profile, byId[slug]);
  const got = !v.fits ? "скрыто" : v.pending.length ? "с плашкой" : "показываем";
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
console.log(`плашка: «${PENDING_TEXT.housing.slice(0, 80)}…»`);
