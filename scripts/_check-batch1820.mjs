// Проверка пачек 18–20: безработные, декрет, срочная служба, село.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { evaluateEligibility } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,region,level,criteria,segments")
  .in("slug", ["dekretnye-dlya-ip-samozanyatyh", "posobie-beremennoy-zhene-prizyvnika",
    "posobie-na-rebenka-voennosluzhashego-po-prizyvu", "tat-005", "amur-022",
    "posobie-po-bezrabotice", "posobie-po-uhodu-do-1-5-let", "smol-022"]);
const byId = Object.fromEntries(data.map((m) => [m.slug, { ...m, region: m.region ?? undefined, segments: m.segments ?? [], criteria: m.criteria ?? {}, shortDescription: "", category: "", amount: null, howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }]));
const y = new Date().getFullYear(), mo = new Date().getMonth() + 1;
const kid = (age) => ({ birthYear: y - age, birthMonth: 5 });
const babyMonths = (n) => ({ birthYear: mo - n > 0 ? y : y - 1, birthMonth: mo - n > 0 ? mo - n : mo - n + 12 });
const base = { pregnant: false, hasChildren: true, multipleBirthCount: 1, incomePm: null, lowIncome: false, disabledChild: false, specialNeedsChild: false, lossOfBreadwinner: false, mortgageIntent: false, svoFamily: false, singleParent: false, student: false, parentAge: 30, spouseAge: 31, parentUnder35: true, selfEmployed: false, entrepreneur: false, employed: true, taxSystem: null, hasEmployees: null, disabledParent: false, fosterParent: false, teacher: false, region: "Москва" };
const fam = (kids, extra = {}) => ({ ...base, childrenCount: kids.length, children: kids, childrenAges: kids.map((k) => y - k.birthYear), youngestChildAgeYears: kids.length ? Math.min(...kids.map((k) => y - k.birthYear)) : null, ...extra });
const pregnant = (extra = {}) => ({ ...base, pregnant: true, hasChildren: false, childrenCount: 0, children: [], childrenAges: [], youngestChildAgeYears: null, ...extra });

const cases = [
  ["Беременная по найму — декретные для ИП и самозанятых", pregnant(), "dekretnye-dlya-ip-samozanyatyh", "скрыто"],
  ["Беременная самозанятая со взносами — декретные ИП", pregnant({ selfEmployed: true, voluntaryInsurance: true }), "dekretnye-dlya-ip-samozanyatyh", "показываем"],
  ["Беременная ИП без взносов — декретные ИП", pregnant({ entrepreneur: true, voluntaryInsurance: false }), "dekretnye-dlya-ip-samozanyatyh", "с плашкой"],
  ["Беременная, муж не служит — пособие жене призывника", pregnant({ pregnancyStage: "28-35" }), "posobie-beremennoy-zhene-prizyvnika", "скрыто"],
  ["Беременная 28–35 недель, муж на срочной — пособие", pregnant({ pregnancyStage: "28-35", conscriptSpouse: true }), "posobie-beremennoy-zhene-prizyvnika", "показываем"],
  ["Беременная до 12 недель, муж на срочной — пособие", pregnant({ pregnancyStage: "under12", conscriptSpouse: true }), "posobie-beremennoy-zhene-prizyvnika", "скрыто"],
  ["Семья СВО с малышом — пособие ребёнку призывника", fam([kid(1)], { svoFamily: true }), "posobie-na-rebenka-voennosluzhashego-po-prizyvu", "скрыто"],
  ["Муж на срочной, малыш 1 год — пособие ребёнку", fam([kid(1)], { conscriptSpouse: true }), "posobie-na-rebenka-voennosluzhashego-po-prizyvu", "показываем"],
  ["Село, Татарстан, новорождённый — выплата сельским", fam([babyMonths(3)], { region: "Республика Татарстан", settlementType: "village" }), "tat-005", "показываем"],
  ["Город, Татарстан, новорождённый — выплата сельским", fam([babyMonths(3)], { region: "Республика Татарстан", settlementType: "city" }), "tat-005", "скрыто"],
  ["В декрете, ребёнок 1 год — профобучение (Амур)", fam([kid(1)], { region: "Амурская область", employmentStatus: "parental-leave" }), "amur-022", "показываем"],
  ["Работает, ребёнок 1 год — профобучение (Амур)", fam([kid(1)], { region: "Амурская область", employmentStatus: "working" }), "amur-022", "скрыто"],
  ["Не работает без статуса — пособие по безработице", fam([kid(3)], { employmentStatus: "not-working", unemployedStatus: false }), "posobie-po-bezrabotice", "с плашкой"],
  ["Не работает со статусом — пособие по безработице", fam([kid(3)], { employmentStatus: "not-working", unemployedStatus: true }), "posobie-po-bezrabotice", "показываем"],
  ["Ребёнку 14 месяцев — пособие по уходу до 1,5 лет", fam([babyMonths(14)]), "posobie-po-uhodu-do-1-5-let", "показываем"],
  ["Ребёнку 2 года — пособие по уходу до 1,5 лет", fam([kid(2)]), "posobie-po-uhodu-do-1-5-let", "скрыто"],
  ["Подросток 15 лет — трудоустройство подростков", fam([kid(15)], { region: "Смоленская область" }), "smol-022", "показываем"],
  ["Ребёнок 8 лет — трудоустройство подростков", fam([kid(8)], { region: "Смоленская область" }), "smol-022", "скрыто"],
];
let ok = 0;
for (const [name, profile, slug, expected] of cases) {
  const v = evaluateEligibility(profile, byId[slug]);
  const got = !v.fits ? "скрыто" : v.pending.length ? "с плашкой" : "показываем";
  if (got === expected) ok++;
  console.log(`${got === expected ? "✔" : "✘ ОШИБКА"} ${name} → ${got}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
