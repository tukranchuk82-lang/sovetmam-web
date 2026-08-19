import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { isEligible } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["bsh-004", "saha-017", "sah-030", "komi-032", "ryaz-021"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));
const y = new Date().getFullYear();
const kid = (age, st) => ({ birthYear: y - age, birthMonth: 5, ...(st != null ? { studiesFullTime: st } : {}) });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 44, spouseAge: 45, parentUnder35: false, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, kids, extra = {}) => ({ ...base, region, childrenCount: kids.length, children: kids, childrenAges: kids.map((k) => y - k.birthYear), youngestChildAgeYears: Math.min(...kids.map((k) => y - k.birthYear)), ...extra });
const many = (n) => Array.from({ length: n }, (_, i) => kid(3 + i));

const cases = [
  ["Башкортостан, 3 детей — выплата для семей с 8 детьми", fam("Республика Башкортостан", many(3)), "bsh-004", false],
  ["Башкортостан, 8 детей — выплата для семей с 8 детьми", fam("Республика Башкортостан", many(8)), "bsh-004", true],
  ["Якутия, 3 детей — выплата на транспорт для семей с 10", fam("Республика Саха (Якутия)", many(3)), "saha-017", false],
  ["Якутия, 10 детей — выплата на транспорт", fam("Республика Саха (Якутия)", many(10)), "saha-017", true],
  ["Сахалин, многодетная без студентов — поддержка студентов", fam("Сахалинская область", [kid(12), kid(9), kid(5)]), "sah-030", false],
  ["Сахалин, многодетная со студентом 20 — поддержка студентов", fam("Сахалинская область", [kid(20, true), kid(9), kid(5)]), "sah-030", true],
  ["Коми, семья СВО со школьником — комплекс мер", fam("Республика Коми", [kid(10)], { svoFamily: true }), "komi-032", true],
  ["Коми, семья без СВО со школьником — комплекс мер", fam("Республика Коми", [kid(10)]), "komi-032", false],
  ["Рязань, многодетная малоимущая со студентом — проезд", fam("Рязанская область", [kid(20, true), kid(14), kid(8)], { incomePm: 1, lowIncome: true }), "ryaz-021", true],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const got = isEligible(profile, byId[slug]);
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got ? "показываем" : "скрыто"}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
