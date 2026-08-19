// Проверяем тринадцатую пачку: меры для учащихся детей.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { isEligible, countChildrenForStatus } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["volgograd-007", "volgograd-008", "perm-006", "krasn-006", "sah-012"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));
const y = new Date().getFullYear();
const kid = (age, studies) => ({ birthYear: y - age, birthMonth: 5, ...(studies != null ? { studiesFullTime: studies } : {}) });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 44, spouseAge: 45, parentUnder35: false, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, kids, extra = {}) => ({ ...base, region, childrenCount: kids.length, children: kids, childrenAges: kids.map((k) => y - k.birthYear), youngestChildAgeYears: Math.min(...kids.map((k) => y - k.birthYear)), ...extra });

// Семья, где старший учится очно: по Указу № 63 она остаётся многодетной.
const withStudent = fam("Сахалинская область", [kid(20, true), kid(15), kid(11)]);
const withoutStudent = fam("Сахалинская область", [kid(20, false), kid(15), kid(11)]);
console.log(`состав семьи со студентом: ${countChildrenForStatus(withStudent)} · без учёбы: ${countChildrenForStatus(withoutStudent)}`);
console.log(`Сахалин, выплата многодетным: со студентом ${isEligible(withStudent, byId["sah-012"]) ? "показываем" : "скрыто"}, без учёбы ${isEligible(withoutStudent, byId["sah-012"]) ? "показываем" : "скрыто"}\n`);

const cases = [
  ["Волгоград, 3 детей, младший дошкольник — выплата обучающимся", fam("Волгоградская область", [kid(12), kid(9), kid(4)]), "volgograd-007", true],
  ["Волгоград, 3 детей, все дошкольники — выплата обучающимся", fam("Волгоградская область", [kid(6), kid(4), kid(2)]), "volgograd-007", false],
  ["Волгоград, 3 детей, старший студент 20 — пособие студенту", fam("Волгоградская область", [kid(20, true), kid(15), kid(11)]), "volgograd-008", true],
  ["Волгоград, 3 детей, старшему 20 но не учится — пособие", fam("Волгоградская область", [kid(20, false), kid(15), kid(11)]), "volgograd-008", false],
  ["Пермь, 3 детей школьного возраста — выплата обучающимся", fam("Пермский край", [kid(14), kid(10), kid(8)]), "perm-006", true],
  ["Пермь, студенческая семья с 1 ребёнком — выплата", fam("Пермский край", [kid(2)], { student: true }), "perm-006", false],
  ["Красноярск, родитель-инвалид, ребёнок 10 — пособие", fam("Красноярский край", [kid(10)], { disabledParent: true }), "krasn-006", true],
  ["Красноярск, неполная семья без инвалидности — пособие", fam("Красноярский край", [kid(10)], { singleParent: true }), "krasn-006", false],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const got = isEligible(profile, byId[slug]);
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got ? "показываем" : "скрыто"}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
