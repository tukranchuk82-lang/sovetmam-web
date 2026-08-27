// Проверка подбора на эталонных анкетах.
//
// Запреты выводим из самой анкеты: если у семьи нет детей до трёх лет, ни одна
// мера со словами «до трёх лет» в названии показаться не может. Это грубая
// проверка по названию — она ловит ровно те промахи, за которые нас ругают.
//
// Запуск: node --experimental-strip-types scripts/_check-personas.mjs [--full]
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { matchMeasures } from "../src/lib/measures.ts";
import { PERSONAS } from "./podbor-personas.mjs";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,level,region,category,amount,segments,criteria,deadline")
    .eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const all = rows.map((r) => ({ ...r, region: r.region ?? undefined, segments: r.segments ?? [], criteria: r.criteria ?? {}, shortDescription: "", howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }));

const ageYears = (s) => (s.children ?? []).map((c) => (2026 - c.birthYear) * 12 + (8 - (c.birthMonth ?? 1))).map((m) => m / 12);

/**
 * ЗАПРЕТЫ: [условие анкеты, регулярка по названию, за что ругаем, ключи].
 *
 * Ключи — те поля критериев, которыми условие выражается в отборе. Если мера
 * хоть один из них использует (в том числе внутри anyOf), значит про условие
 * она знает и решение приняла осознанно — такую не трогаем. Ругаемся там, где
 * в названии условие есть, а в критериях о нём ни слова: это и есть дырка.
 */
const RULES = [
  [(s) => s.employmentStatus === "working" || s.employmentStatus === "parental-leave",
   /безработ/i, "человек работает", ["requiresUnemployedStatus"]],
  [(s) => !ageYears(s).some((a) => a < 1.5) && !s.pregnant,
   /до полутора лет|до 1,5 лет|до 1.5 лет/i, "нет детей до полутора лет",
   ["maxYoungestChildAgeYears", "childAgeToMonths", "hasChildAgedTo"]],
  [(s) => !ageYears(s).some((a) => a < 3) && !s.pregnant,
   /до тр[её]х лет|до 3 лет|новорожд|младенц/i, "нет детей до трёх лет",
   ["maxYoungestChildAgeYears", "childAgeToMonths", "hasChildAgedTo"]],
  [(s) => !ageYears(s).some((a) => a < 0.5) && !s.pregnant,
   /при рождении|на рождение/i, "нет новорождённых и не ждут ребёнка",
   ["maxYoungestChildAgeYears", "childAgeToMonths", "appliesToExpecting"]],
  [(s) => !s.pregnant, /беременн|по беременности и родам|постановк[еу] на уч[её]т/i,
   "не беременна", ["requiresPregnancy", "minPregnancyWeeks", "appliesToExpecting"]],
  [(s) => (s.childrenCount ?? 0) < 3 && !(s.pregnant && (s.expectingChildNumber ?? 0) >= 3),
   /многодетн/i, "семья не многодетная", ["minChildren"]],
  [(s) => !s.lowIncome && (s.incomePm == null || s.incomePm > 1),
   /малоимущ|нуждающ(им|их)ся в поддержке/i, "семья не малоимущая",
   ["requiresLowIncome", "maxIncomePm"]],
  [(s) => !s.disabledChild && !s.specialNeedsChild && !s.disabledParent,
   /инвалид/i, "в семье нет инвалидности",
   ["requiresDisabledChild", "requiresDisabledParent", "requiresSpecialNeedsChild"]],
  [(s) => !s.svoFamily, /СВО|мобилизованн|специальной военной операции/i,
   "семья не участника СВО", ["requiresSvoFamily", "requiresSvoRole", "requiresConscriptSpouse"]],
  [(s) => !s.fosterParent, /усыновл|опек|приёмн(ая|ой) семь/i, "семья не приёмная",
   ["requiresFosterParent"]],
  [(s) => !s.student && !(s.children ?? []).some((c) => c.studiesFullTime),
   /студент/i, "в семье нет студентов",
   ["requiresStudent", "requiresStudyLevel", "requiresChildStudying"]],
  [(s) => !s.singleParent, /одинок(ой|им|ая) мат|единственн(ый|ому) родител/i,
   "родитель не одинокий", ["requiresSingleParent"]],
  [(s) => !s.hasMortgage && !s.mortgageIntent, /ипотек/i, "ипотеки нет и не планируется",
   ["requiresMortgage", "requiresMortgageIntent"]],
];

/** Использует ли мера хоть один из ключей — в том числе внутри anyOf. */
function knows(criteria, keys) {
  const c = criteria ?? {};
  if (keys.some((k) => c[k] != null)) return true;
  return (c.anyOf ?? []).some((sub) => keys.some((k) => sub[k] != null));
}

let errors = 0, warns = 0, checked = 0;
for (const p of PERSONAS) {
  const s = p.survey;
  const matched = matchMeasures(s, all);
  checked += matched.length;
  const problems = [];
  for (const m of matched) {
    if (m.level !== "federal" && m.region && m.region !== s.region) {
      problems.push([m, "мера чужого региона: " + m.region]);
      continue;
    }
    for (const [when, re, why, keys] of RULES) {
      if (!when(s) || !re.test(m.title)) continue;
      if (knows(m.criteria, keys)) continue; // условие в отборе есть — не наше дело
      // Название с перечислением («детям и беременным») адресовано нескольким
      // группам сразу: тут нужен человек, робот решить не может.
      const union = / и |, /.test(m.title);
      problems.push([m, why, union ? "проверить" : "ошибка"]);
      break;
    }
  }
  const hard = problems.filter((x) => x[2] === "ошибка");
  errors += hard.length;
  warns += problems.length - hard.length;
  const mark = hard.length ? "✗" : problems.length ? "!" : "✓";
  console.log(`
${mark} ${p.name} — подобрано ${matched.length} · ошибок ${hard.length} · на проверку ${problems.length - hard.length}`);
  for (const [m, why, kind] of problems.slice(0, process.argv.includes("--full") ? 999 : 8)) {
    console.log(`     [${kind}] ${m.title}`);
    console.log(`        ${m.slug} · ${why} · ${JSON.stringify(m.criteria)}`);
  }
  if (problems.length > 8 && !process.argv.includes("--full")) console.log(`     … и ещё ${problems.length - 8}`);
}
console.log(`
ИТОГО: подобрано ${checked} мер на ${PERSONAS.length} анкет · ошибок ${errors} · на проверку ${warns}`);
