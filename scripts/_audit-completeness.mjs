// Насколько полны карточки мер: есть ли порядок оформления, документы,
// нюансы, источник. Это масштаб работы по курсу «качество».
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,level,region,amount,short_description,how_to_apply,documents,tips,source_url,source_name,criteria")
    .eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const fed = rows.filter((m) => m.level === "federal");
const reg = rows.filter((m) => m.level !== "federal");
const empty = (v) => !v || (Array.isArray(v) && v.length === 0) || (typeof v === "string" && !v.trim());

function stat(list, name) {
  const n = list.length;
  const pct = (k) => `${k} (${Math.round((k / n) * 100)}%)`;
  console.log(`\n${name}: ${n} мер`);
  console.log(`  без «как оформить»:  ${pct(list.filter((m) => empty(m.how_to_apply)).length)}`);
  console.log(`  без документов:      ${pct(list.filter((m) => empty(m.documents)).length)}`);
  console.log(`  без «важно знать»:   ${pct(list.filter((m) => empty(m.tips)).length)}`);
  console.log(`  без ссылки-источника:${pct(list.filter((m) => empty(m.source_url)).length)}`);
  console.log(`  без суммы:           ${pct(list.filter((m) => empty(m.amount)).length)}`);
  const oneStep = list.filter((m) => Array.isArray(m.how_to_apply) && m.how_to_apply.length === 1).length;
  console.log(`  «как оформить» в один шаг: ${pct(oneStep)}`);
  const full = list.filter((m) => !empty(m.how_to_apply) && !empty(m.documents) && !empty(m.tips) && !empty(m.source_url));
  console.log(`  ПОЛНЫЕ (есть всё):   ${pct(full.length)}`);
}
stat(rows, "ВСЯ БАЗА");
stat(fed, "Федеральные");
stat(reg, "Региональные");

// Кандидаты в «положено всем»: нет ограничений по доходу, статусу, числу
// детей, диагнозу, занятости. Регион не в счёт — его проверяет фильтр.
const LIMITS = ["requiresLowIncome","maxIncomePm","minChildren","minSchoolChildren","minSimultaneousBirth","requiresSvoFamily","requiresSingleParent","requiresFosterParent","requiresLossOfBreadwinner","requiresStudent","maxParentAge","requiresDisabledChild","requiresSpecialNeedsChild","requiresDisabledParent","requiresNdfl","requiresSelfEmployed","requiresEntrepreneur","requiresTeacher","requiresMortgageIntent","anyOf"];
const cand = rows.filter((m) => {
  const c = m.criteria ?? {};
  return !LIMITS.some((k) => k === "minChildren" ? (c.minChildren ?? 0) > 1 : c[k] !== undefined);
});
console.log(`\nКАНДИДАТЫ в «положено всем» (по галочкам в базе): ${cand.length}`);
console.log(`  из них федеральных: ${cand.filter((m) => m.level === "federal").length}, региональных: ${cand.filter((m) => m.level !== "federal").length}`);
console.log(`  их ещё предстоит вычитать глазами — галочки не доказательство`);
