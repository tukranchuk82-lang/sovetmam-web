// Сколько мер и насколько у них бедные условия — чтобы оценить объём работы.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("slug,title,level,region,criteria,eligibility,is_published").range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const live = rows.filter((m) => m.is_published !== false);
const fed = live.filter((m) => m.level === "federal");
const reg = live.filter((m) => m.level !== "federal");
const THIN = new Set(["requiresFamily", "requiresChildren", "regions"]);
const thin = (m) => Object.keys(m.criteria ?? {}).every((k) => THIN.has(k));
console.log(`живых мер: ${live.length} — федеральных ${fed.length}, региональных ${reg.length}`);
console.log(`из них с «пустыми» условиями (только семья/дети/регион): ${live.filter(thin).length}`);
console.log(`   федеральных: ${fed.filter(thin).length} · региональных: ${reg.filter(thin).length}`);
console.log(`без текста «кому положено»: ${live.filter((m) => !m.eligibility).length}`);
const byRegion = new Map();
for (const m of reg) byRegion.set(m.region, (byRegion.get(m.region) ?? 0) + 1);
console.log(`регионов в базе: ${byRegion.size}`);

const { data: users } = await sb.from("app_users").select("survey").not("survey", "is", null);
const liveRegions = new Map();
for (const u of users ?? []) {
  const r = u.survey?.region;
  if (r) liveRegions.set(r, (liveRegions.get(r) ?? 0) + 1);
}
const sorted = [...liveRegions.entries()].sort((a, b) => b[1] - a[1]);
console.log(`анкет с регионом: ${(users ?? []).length}; разных регионов: ${sorted.length}`);
console.log("топ-12 регионов по числу семей:");
for (const [r, n] of sorted.slice(0, 12)) console.log(`   ${n} семей · ${r} · мер в базе: ${byRegion.get(r) ?? 0}`);
const covered = sorted.slice(0, 12).reduce((a, [, n]) => a + n, 0);
console.log(`эти 12 регионов покрывают ${covered} из ${(users ?? []).length} семей`);
