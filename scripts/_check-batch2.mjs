// Проверяем эффект второй пачки на выдуманных семьях.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { isEligible } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["volgograd-011", "spb-030", "yarosl-004", "volgograd-004"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));

const y = new Date().getFullYear();
const kid = (age, m = 5) => ({ birthYear: y - age, birthMonth: m });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 35, spouseAge: 35, parentUnder35: false, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const family = (region, ages, extra = {}) => ({
  ...base, region, childrenCount: ages.length, children: ages.map((a) => kid(a)),
  childrenAges: ages, youngestChildAgeYears: Math.min(...ages), ...extra,
});

const cases = [
  ["Волгоград, 3 детей без инвалидности — газификация", family("Волгоградская область", [10, 7, 3]), "volgograd-011", true],
  ["Волгоград, 1 ребёнок-инвалид — газификация", family("Волгоградская область", [6], { disabledChild: true }), "volgograd-011", true],
  ["Волгоград, 1 здоровый ребёнок — газификация", family("Волгоградская область", [6]), "volgograd-011", false],
  ["СПб, ребёнок 2 года, обычная семья — лекарства", family("Санкт-Петербург", [2]), "spb-030", true],
  ["СПб, ребёнок 5 лет, обычная семья — лекарства", family("Санкт-Петербург", [5]), "spb-030", false],
  ["СПб, ребёнок 5 лет, трое детей — лекарства", family("Санкт-Петербург", [5, 8, 12]), "spb-030", true],
  ["Ярославль, школьник, обычная семья — питание", family("Ярославская область", [9]), "yarosl-004", false],
  ["Ярославль, школьник, малоимущая — питание", family("Ярославская область", [9], { incomePm: 1, lowIncome: true }), "yarosl-004", true],
  ["Ярославль, дошкольник, малоимущая — питание", family("Ярославская область", [4], { incomePm: 1, lowIncome: true }), "yarosl-004", false],
  ["Волгоград, малоимущая, ребёнок 19 лет — пособие", family("Волгоградская область", [19], { incomePm: 1, lowIncome: true }), "volgograd-004", false],
];

let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const got = isEligible(profile, byId[slug]);
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got ? "показываем" : "скрыто"}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
