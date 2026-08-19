// Проверяем эффект пятой пачки.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { isEligible } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["kostroma-035", "chao-031", "mari-001", "rst-016", "krg-015"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));

const y = new Date().getFullYear();
const kid = (age, m = 5, studies = undefined) => ({ birthYear: y - age, birthMonth: m, ...(studies != null ? { studiesFullTime: studies } : {}) });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 40, spouseAge: 41, parentUnder35: false, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, kids, extra = {}) => ({ ...base, region, childrenCount: kids.length, children: kids, childrenAges: kids.map((k) => y - k.birthYear), youngestChildAgeYears: Math.min(...kids.map((k) => y - k.birthYear)), ...extra });

const cases = [
  ["Кострома, ребёнок-студент 20 лет — льготный проезд", fam("Костромская область", [kid(20, 5, true)]), "kostroma-035", true],
  ["Кострома, школьник 10 лет — льготный проезд", fam("Костромская область", [kid(10)]), "kostroma-035", true],
  ["Кострома, малыш 3 года — льготный проезд", fam("Костромская область", [kid(3)]), "kostroma-035", false],
  ["Чукотка, СВО, студент вуза 20 лет — выплата на учёбу", fam("Чукотский автономный округ", [kid(20, 5, true)], { svoFamily: true }), "chao-031", true],
  ["Чукотка, СВО, школьник 10 лет — выплата на учёбу", fam("Чукотский автономный округ", [kid(10)], { svoFamily: true }), "chao-031", false],
  ["Марий Эл, студенческая семья, малыш 1 год — прокат", fam("Республика Марий Эл", [kid(1)], { student: true }), "mari-001", true],
  ["Марий Эл, молодая семья до 35, малыш 1 год — прокат", fam("Республика Марий Эл", [kid(1)], { parentAge: 28, spouseAge: 30, parentUnder35: true }), "mari-001", true],
  ["Марий Эл, обычная семья 40 лет, малыш — прокат", fam("Республика Марий Эл", [kid(1)]), "mari-001", false],
  ["Ростов, семья с ребёнком-инвалидом, малыш — прокат", fam("Ростовская область", [kid(1)], { disabledChild: true }), "rst-016", true],
  ["Ростов, обычная семья, ребёнок 5 лет — прокат", fam("Ростовская область", [kid(5)]), "rst-016", false],
  ["Курган, дошкольник — присмотр", fam("Курганская область", [kid(4)]), "krg-015", true],
  ["Курган, школьник 12 лет — присмотр", fam("Курганская область", [kid(12)]), "krg-015", false],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const got = isEligible(profile, byId[slug]);
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got ? "показываем" : "скрыто"}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
