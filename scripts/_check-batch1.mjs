// Проверяем эффект правок на выдуманных семьях.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { isEligible } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments").in("slug", ["smol-032", "kirov-019", "tver-022", "kirov-002", "omsk-026", "oren-014"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));

const now = new Date();
const kid = (yearsAgo, m = 5) => ({ birthYear: now.getFullYear() - yearsAgo, birthMonth: m });
const base = { pregnant: false, hasChildren: true, childrenCount: 1, childrenAges: [10], multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 35, spouseAge: 35, parentUnder35: false, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };

const cases = [
  ["Смоленск, 1 ребёнок 10 лет, доход выше 2 ПМ, без статусов", { ...base, region: "Смоленская область", children: [kid(10)] }, "smol-032", false],
  ["Смоленск, 3 детей, малоимущая", { ...base, region: "Смоленская область", childrenCount: 3, children: [kid(10), kid(8), kid(5)], childrenAges: [10, 8, 5], incomePm: 1, lowIncome: true }, "smol-032", true],
  ["Смоленск, ребёнок 2 года, ТЖС (пожар)", { ...base, region: "Смоленская область", children: [kid(2)], childrenAges: [2], hardship: true }, "smol-032", false],
  ["Киров, беременна, на учёт встала, доход низкий", { ...base, region: "Кировская область", pregnant: true, hasChildren: false, childrenCount: 0, children: [], childrenAges: [], registeredEarly: true, incomePm: 1, lowIncome: true }, "kirov-019", true],
  ["Киров, беременна, на учёт НЕ встала", { ...base, region: "Кировская область", pregnant: true, hasChildren: false, childrenCount: 0, children: [], childrenAges: [], registeredEarly: false, incomePm: 1, lowIncome: true }, "kirov-019", false],
  ["Киров, ребёнок 6 месяцев, малоимущая, НЕ студентка", { ...base, region: "Кировская область", children: [{ birthYear: now.getFullYear(), birthMonth: now.getMonth() - 5 > 0 ? now.getMonth() - 5 : 1 }], childrenAges: [0], incomePm: 1, lowIncome: true }, "kirov-002", true],
  ["Тверь, 3 детей, на учёте как нуждающиеся", { ...base, region: "Тверская область", childrenCount: 3, children: [kid(10), kid(8), kid(5)], childrenAges: [10, 8, 5], housingNeedStatus: "registered" }, "tver-022", true],
  ["Тверь, 3 детей, просторное жильё", { ...base, region: "Тверская область", childrenCount: 3, children: [kid(10), kid(8), kid(5)], childrenAges: [10, 8, 5], ownsHome: true, homeArea: 120, residentsCount: 5, housingNeedStatus: "no" }, "tver-022", false],
];

let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const got = isEligible(profile, byId[slug]);
  const good = got === expected;
  if (good) ok++;
  console.log(`${good ? "✔" : "✘ ОШИБКА"} ${name}\n     ${byId[slug].title.slice(0, 48)} → ${got ? "показываем" : "не показываем"} (ждали ${expected ? "показ" : "скрытие"})`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
