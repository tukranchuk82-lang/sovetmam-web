// Проверяем четырнадцатую пачку.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { isEligible } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["zab-004", "bur-010", "msk-kompensaciya-detsad", "psk-019"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));
const y = new Date().getFullYear();
const kid = (age, studies) => ({ birthYear: y - age, birthMonth: 5, ...(studies != null ? { studiesFullTime: studies } : {}) });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 42, spouseAge: 43, parentUnder35: false, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, kids, extra = {}) => ({ ...base, region, childrenCount: kids.length, children: kids, childrenAges: kids.map((k) => y - k.birthYear), youngestChildAgeYears: Math.min(...kids.map((k) => y - k.birthYear)), ...extra });

const cases = [
  ["Забайкалье, 3 детей, младшему 10 — выплата на третьего", fam("Забайкальский край", [kid(16), kid(13), kid(10)]), "zab-004", true],
  ["Бурятия, 3 детей, старший студент 20 — компенсация СПО", fam("Республика Бурятия", [kid(20, true), kid(15), kid(9)]), "bur-010", true],
  ["Бурятия, 3 детей, старшему 20, не учится — компенсация", fam("Республика Бурятия", [kid(20, false), kid(15), kid(9)]), "bur-010", false],
  ["Москва, малоимущая, ребёнок 4 года — компенсация сада", fam("Москва", [kid(4)], { incomePm: 1, lowIncome: true }), "msk-kompensaciya-detsad", true],
  ["Москва, малоимущая, школьник 10 лет — компенсация сада", fam("Москва", [kid(10)], { incomePm: 1, lowIncome: true }), "msk-kompensaciya-detsad", false],
  ["Москва, доход выше ПМ, ребёнок 4 года — компенсация сада", fam("Москва", [kid(4)]), "msk-kompensaciya-detsad", false],
  ["Псков, семья со школьником — проезд детям Героев", fam("Псковская область", [kid(12)]), "psk-019", false],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const got = isEligible(profile, byId[slug]);
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got ? "показываем" : "скрыто"}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
