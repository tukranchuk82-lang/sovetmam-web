// Как ляжет подборка по блокам — проверка раскладки без браузера.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { groupPodbor, POCKET_ORDER, POCKET_TITLE } from "../src/lib/_podbor-groups-run.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,level,region,category,amount,segments,criteria,deadline,applies_by_child")
    .eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const all = rows.map((r) => ({ ...r, region: r.region ?? undefined, segments: r.segments ?? [], criteria: r.criteria ?? {}, appliesByChild: r.applies_by_child ?? false, shortDescription: "", howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }));
const { data: users } = await sb.from("app_users").select("survey").eq("email", process.argv[2]);
const g = groupPodbor(users[0].survey, all);
const show = (name, b) => {
  if (b.count === 0) return console.log(`\n${name}: пусто`);
  console.log(`\n${name} · ${b.count}`);
  for (const it of b.urgent) console.log(`   [срочно] ${it.measure.title}`);
  for (const k of POCKET_ORDER) {
    for (const it of b.pockets[k]) console.log(`   ${POCKET_TITLE[k]}: ${it.measure.title}`);
  }
};
console.log(`ВАМ ПОДХОДИТ: ${g.total} мер`);
show("ФЕДЕРАЛЬНЫЕ", g.federal);
show("МЕРЫ РЕГИОНА", g.regional);
show("ПОЛОЖЕНО ВАШЕМУ РЕБЁНКУ", g.child);
