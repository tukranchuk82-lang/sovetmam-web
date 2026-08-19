// Проверяем эффект третьей пачки.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { isEligible, deadlineStatus } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments,deadline")
  .in("slug", ["mari-014", "hmao-001", "chao-002", "krsk-014", "irkutsk-005"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));

const y = new Date().getFullYear();
const kid = (age, m = 5) => ({ birthYear: y - age, birthMonth: m });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 33, spouseAge: 34, parentUnder35: true, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false };
const fam = (region, ages, extra = {}) => ({ ...base, region, childrenCount: ages.length, children: ages.map((a) => kid(a)), childrenAges: ages, youngestChildAgeYears: Math.min(...ages), ...extra });

const cases = [
  ["Марий Эл, один ребёнок-инвалид — выплата по уходу", fam("Республика Марий Эл", [7], { disabledChild: true }), "mari-014", false],
  ["Марий Эл, двое детей, есть инвалидность — выплата", fam("Республика Марий Эл", [7, 4], { disabledChild: true }), "mari-014", true],
  ["ХМАО, второй ребёнок, не студенты — Югорский капитал", fam("Ханты-Мансийский автономный округ — Югра", [4, 1]), "hmao-001", true],
  ["ХМАО, один ребёнок, не студенты — капитал", fam("Ханты-Мансийский автономный округ — Югра", [1]), "hmao-001", false],
  ["ХМАО, один ребёнок, студенческая семья — капитал", fam("Ханты-Мансийский автономный округ — Югра", [1], { student: true }), "hmao-001", true],
  ["Чукотка, один ребёнок — выплата за второго", fam("Чукотский автономный округ", [1]), "chao-002", false],
  ["Чукотка, двое детей — выплата за второго", fam("Чукотский автономный округ", [3, 1]), "chao-002", true],
  ["Курск, опека, один ребёнок — пособие за второго", fam("Курская область", [5], { fosterParent: true }), "krsk-014", false],
  ["Курск, опека, двое детей — пособие", fam("Курская область", [5, 2], { fosterParent: true }), "krsk-014", true],
  ["Иркутск, двойня, доход выше 2 ПМ — выплата", fam("Иркутская область", [1, 1], { multipleBirthCount: 2, incomePm: null }), "irkutsk-005", false],
  ["Иркутск, двойня, доход до 2 ПМ — выплата", fam("Иркутская область", [1, 1], { multipleBirthCount: 2, incomePm: 2 }), "irkutsk-005", true],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const got = isEligible(profile, byId[slug]);
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got ? "показываем" : "скрыто"}`);
}
// Срок у чукотской выплаты за второго ребёнка.
const withBaby = fam("Чукотский автономный округ", [3, 0]);
withBaby.children[1] = { birthYear: y, birthMonth: new Date().getMonth() - 1 || 1 };
console.log("\nсрок для семьи с новорождённым:", deadlineStatus(withBaby, byId["chao-002"])?.text ?? "нет");
console.log(`\nсовпало: ${ok} из ${cases.length}`);
