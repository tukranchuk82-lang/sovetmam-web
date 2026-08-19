// Прототип новой структуры выдачи — БЕЗ изменений в базе, только расчёт.
// Проверяем: сколько мер получат метку «положено всем» по автоправилу,
// как меры разложатся по «карманам» и по типам критерия.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { matchMeasures } from "../src/lib/measures.ts";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,level,region,category,criteria,segments,amount")
    .eq("is_published", true)
    .order("sort_order", { ascending: true }).order("slug", { ascending: true })
    .range(from, from + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}
const measures = rows.map((r) => ({
  slug: r.slug, title: r.title, level: r.level, region: r.region ?? undefined,
  category: r.category, segments: r.segments ?? [], criteria: r.criteria ?? {},
  amount: r.amount, shortDescription: "", howToApply: [], documents: [], tips: [],
}));

// «Положено всем» по книге: не требует ни дохода, ни особого статуса.
// Возраст ребёнка сюда входит (питание 1–4 класса положено всем школьникам),
// а «трое детей» — уже критерий «число детей».
const OK_FOR_ALL = new Set([
  "requiresFamily", "requiresPregnancy", "requiresChildren",
  "hasChildAgedFrom", "hasChildAgedTo", "maxYoungestChildAgeYears",
]);
const KIND = {
  requiresLowIncome: "доход", maxIncomePm: "доход",
  minChildren: "число детей", minSchoolChildren: "число детей", minSimultaneousBirth: "число детей",
  requiresSvoFamily: "статус", requiresSingleParent: "статус", requiresFosterParent: "статус",
  requiresLossOfBreadwinner: "статус", requiresStudent: "статус", maxParentAge: "статус",
  requiresDisabledChild: "диагноз", requiresSpecialNeedsChild: "диагноз", requiresDisabledParent: "диагноз",
  regions: "регион",
  requiresNdfl: "занятость", requiresSelfEmployed: "занятость",
  requiresEntrepreneur: "занятость", requiresTeacher: "профессия",
  requiresMortgageIntent: "планы на жильё",
};

function classify(m) {
  const keys = Object.keys(m.criteria).filter((k) => k !== "anyOf" && k !== "excludeFromMatching");
  const hard = keys.filter((k) => {
    if (OK_FOR_ALL.has(k)) return false;
    if (k === "minChildren" && (m.criteria.minChildren ?? 0) <= 1) return false;
    return true;
  });
  if (m.criteria.anyOf) hard.push("anyOf");
  return hard.length === 0 ? null : hard.map((k) => KIND[k] ?? k);
}

function pocket(m) {
  const s = m.segments;
  if (s.includes("class-money")) return "деньги";
  if (s.includes("class-discount")) return "скидки";
  if (s.includes("class-free")) return "бесплатно";
  return "без кармана";
}

// 1. По всей базе
const all = { всем: 0, вам: 0 };
const pockets = {};
for (const m of measures) {
  (classify(m) === null ? all.всем++ : all.вам++);
  pockets[pocket(m)] = (pockets[pocket(m)] ?? 0) + 1;
}
console.log(`ВСЯ БАЗА (${measures.length} мер)`);
console.log(`  «положено всем»: ${all.всем}   «по критериям»: ${all.вам}`);
console.log(`  карманы: ${Object.entries(pockets).map(([k, v]) => `${k} ${v}`).join(" · ")}\n`);

// 2. Подборка конкретного человека
const { data: u } = await sb.from("app_users").select("email,survey").eq("email", process.argv[2] ?? "tanya@sambot.ru").single();
const matched = matchMeasures(u.survey, measures, { ignoreRegion: !u.survey.region });
console.log(`ПОДБОРКА ${u.email} — ${matched.length} мер\n`);

const forAll = matched.filter((m) => classify(m) === null);
const forYou = matched.filter((m) => classify(m) !== null);

for (const [name, list] of [["ПОЛОЖЕНО ВСЕМ", forAll], ["ПОЛОЖЕНО ВАМ", forYou]]) {
  console.log(`${name} · ${list.length}`);
  for (const p of ["деньги", "скидки", "бесплатно", "без кармана"]) {
    const g = list.filter((m) => pocket(m) === p);
    if (!g.length) continue;
    console.log(`  ${p} · ${g.length}`);
    for (const m of g) {
      const why = classify(m);
      const tag = why ? `  [${[...new Set(why)].join(", ")}]` : "";
      console.log(`    ${m.title.slice(0, 58)}${m.amount ? " — " + String(m.amount).slice(0, 24) : ""}${tag}`);
    }
  }
  console.log();
}
