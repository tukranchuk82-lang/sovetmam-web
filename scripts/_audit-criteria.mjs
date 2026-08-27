// Аудит отбора: ищем меры, у которых в названии есть условие, а в критериях —
// нет. Именно из-за таких мер подборка выдаёт лишнее.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("slug,title,level,region,criteria,is_published").range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const live = rows.filter((m) => m.is_published !== false);
const C = (m) => m.criteria ?? {};
const has = (m, ...keys) => keys.some((k) => C(m)[k] != null);
const anyOfHas = (m, ...keys) => (C(m).anyOf ?? []).some((c) => keys.some((k) => c[k] != null));
const need = (m, ...keys) => !has(m, ...keys) && !anyOfHas(m, ...keys);

const AGE = ["maxYoungestChildAgeYears", "childAgeToMonths", "childAgeFromMonths", "hasChildAgedFrom", "hasChildAgedTo", "minSchoolChildren", "requiresChildStudying"];
const GROUPS = [
  ["возраст ребёнка назван в заголовке", /до (полутора|1,5|трёх|3|семи|7|шести|6|восемнадцати|18|16|14|двух|2) лет|до 1\.5|первого класса|дошкольник|новорожд|при рождении|младенц/i, AGE],
  ["для беременных", /беременн|по беременности|ранние сроки/i, ["requiresPregnancy", "minPregnancyWeeks", "appliesToExpecting"]],
  ["для многодетных", /многодетн/i, ["minChildren"]],
  ["для малоимущих", /малоимущ|нуждающ|низкий доход|прожиточного минимума/i, ["requiresLowIncome", "maxIncomePm"]],
  ["для студентов", /студент|обучающ|аспирант/i, ["requiresStudent", "requiresStudyLevel", "requiresChildStudying"]],
  ["по инвалидности", /инвалидност|инвалид/i, ["requiresDisabledChild", "requiresDisabledParent", "requiresSpecialNeedsChild"]],
  ["для безработных", /безработ/i, ["requiresUnemployedStatus"]],
  ["для одиноких родителей", /одинок|единственн(ый|ому) родител/i, ["requiresSingleParent"]],
  ["для семей военных (СВО)", /СВО|мобилизованн|участник(а|ов) специальной/i, ["requiresSvoFamily", "requiresSvoRole"]],
];

let total = 0;
for (const [name, re, keys] of GROUPS) {
  const bad = live.filter((m) => re.test(m.title) && need(m, ...keys));
  total += bad.length;
  console.log(`\n### ${name}: ${bad.length} мер без нужного условия`);
  for (const m of bad.slice(0, 12)) {
    console.log(`  ${m.level === "federal" ? "ФЕД" : (m.region ?? "рег")} · ${m.title}`);
    console.log(`      ${m.slug} · ${JSON.stringify(C(m))}`);
  }
  if (bad.length > 12) console.log(`  … и ещё ${bad.length - 12}`);
}
const empty = live.filter((m) => Object.keys(C(m)).length === 0);
console.log(`\n### совсем без критериев: ${empty.length}`);
console.log(`\nИТОГО расхождений «заголовок ↔ условия»: ${total}; живых мер: ${live.length}`);
