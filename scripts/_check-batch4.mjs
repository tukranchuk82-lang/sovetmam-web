// Проверяем эффект четвёртой пачки.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { isEligible } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["spb-011", "mari-002", "krsk-004", "rtadd-007", "voronezh-015"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));

const y = new Date().getFullYear();
const kid = (age, m = 5) => ({ birthYear: y - age, birthMonth: m });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 25, spouseAge: 26, parentUnder35: true, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, ages, extra = {}) => ({ ...base, region, childrenCount: ages.length, children: ages.map((a) => kid(a)), childrenAges: ages, youngestChildAgeYears: ages.length ? Math.min(...ages) : null, ...extra });

const cases = [
  ["СПб, студенческая семья, ребёнок 1 год — соцняня", fam("Санкт-Петербург", [1], { student: true }), "spb-011", true],
  ["СПб, одинокая мама, ребёнок 2 года — соцняня", fam("Санкт-Петербург", [2], { singleParent: true }), "spb-011", true],
  ["СПб, обычная семья, ребёнок 2 года — соцняня", fam("Санкт-Петербург", [2]), "spb-011", false],
  ["Марий Эл, студенческая семья, 1 ребёнок — соцняня", fam("Республика Марий Эл", [1], { student: true }), "mari-002", true],
  ["Марий Эл, обычная семья, 1 ребёнок — соцняня", fam("Республика Марий Эл", [1]), "mari-002", false],
  ["Курск, семья со студентом 20 лет — льготный проезд", fam("Курская область", [20], { children: [{ birthYear: y - 20, birthMonth: 5, studiesFullTime: true }] }), "krsk-004", true],
  ["Курск, семья с одним школьником — льготный проезд", fam("Курская область", [10]), "krsk-004", false],
  ["Татарстан, студенческая семья, новорождённый — прокат", fam("Республика Татарстан", [0], { student: true }), "rtadd-007", true],
  ["Татарстан, обычная семья, новорождённый — прокат", fam("Республика Татарстан", [0]), "rtadd-007", false],
  ["Воронеж, семья СВО, младенец — школьное питание", fam("Воронежская область", [1], { svoFamily: true }), "voronezh-015", false],
  ["Воронеж, семья СВО, школьник — школьное питание", fam("Воронежская область", [9], { svoFamily: true }), "voronezh-015", true],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const got = isEligible(profile, byId[slug]);
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got ? "показываем" : "скрыто"}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
