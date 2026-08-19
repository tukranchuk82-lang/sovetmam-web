// Проверяем одиннадцатую пачку.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { evaluateEligibility, deadlineStatus } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments,deadline")
  .in("slug", ["socnaym-maloimushchim", "mgd-017", "lpc-015", "ivn-034", "kostroma-019"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));
const y = new Date().getFullYear(), mo = new Date().getMonth() + 1;
const kid = (age) => ({ birthYear: y - age, birthMonth: 5 });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 34, spouseAge: 35, parentUnder35: true, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, kids, extra = {}) => ({ ...base, region, childrenCount: kids.length, children: kids, childrenAges: kids.map((k) => y - k.birthYear), youngestChildAgeYears: kids.length ? Math.min(...kids.map((k) => y - k.birthYear)) : null, ...extra });

const cases = [
  ["Соцнайм: малоимущая на учёте", fam("Москва", [kid(5)], { incomePm: 1, lowIncome: true, housingNeedStatus: "registered" }), "socnaym-maloimushchim", "показываем"],
  ["Соцнайм: малоимущая, просторное жильё", fam("Москва", [kid(5)], { incomePm: 1, lowIncome: true, ownsHome: true, homeArea: 90, residentsCount: 3, housingNeedStatus: "no" }), "socnaym-maloimushchim", "скрыто"],
  ["Магадан: 3 детей на учёте — выплата для 4+", fam("Магаданская область", [kid(9), kid(6), kid(2)], { housingNeedStatus: "registered" }), "mgd-017", "скрыто"],
  ["Магадан: 4 детей на учёте — выплата для 4+", fam("Магаданская область", [kid(9), kid(6), kid(4), kid(2)], { housingNeedStatus: "registered" }), "mgd-017", "показываем"],
  ["Липецк: беременная, доход обычный — путёвка", { ...fam("Липецкая область", []), pregnant: true, hasChildren: false, childrenCount: 0, children: [], childrenAges: [] }, "lpc-015", "скрыто"],
  ["Липецк: беременная малоимущая — путёвка", { ...fam("Липецкая область", []), pregnant: true, hasChildren: false, childrenCount: 0, children: [], childrenAges: [], incomePm: 1, lowIncome: true }, "lpc-015", "показываем"],
  ["Липецк: беременная супруга участника СВО — путёвка", { ...fam("Липецкая область", []), pregnant: true, hasChildren: false, childrenCount: 0, children: [], childrenAges: [], svoFamily: true }, "lpc-015", "показываем"],
  ["Иваново: семья СВО, дошкольник — присмотр", fam("Ивановская область", [kid(4)], { svoFamily: true }), "ivn-034", "показываем"],
  ["Иваново: малоимущая без СВО — присмотр", fam("Ивановская область", [kid(4)], { incomePm: 1, lowIncome: true }), "ivn-034", "скрыто"],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const v = evaluateEligibility(profile, byId[slug]);
  const got = !v.fits ? "скрыто" : v.pending.length ? "с плашкой" : "показываем";
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got}`);
}
// Срок костромской выплаты для семьи с малышом трёх месяцев.
const baby = { birthYear: mo - 3 > 0 ? y : y - 1, birthMonth: mo - 3 > 0 ? mo - 3 : mo + 9 };
const kostroma = fam("Костромская область", [kid(9), kid(6), baby], { mortgageIntent: true, housingNeedStatus: "registered" });
const v = evaluateEligibility(kostroma, byId["kostroma-019"]);
console.log(`\nКострома, третий ребёнок 3 месяца: ${v.fits ? "показываем" : "скрыто"} · ${deadlineStatus(kostroma, byId["kostroma-019"])?.text ?? "без срока"}`);
console.log(`\nсовпало: ${ok} из ${cases.length}`);
