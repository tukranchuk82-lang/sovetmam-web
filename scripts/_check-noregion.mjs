// Проверка: без региона в подборку попадают только федеральные меры.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { matchMeasures } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("slug,title,level,region,category,criteria,segments").eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const all = rows.map((r) => ({ slug: r.slug, title: r.title, level: r.level, region: r.region ?? undefined,
  category: r.category, segments: r.segments ?? [], criteria: r.criteria ?? {},
  shortDescription: "", howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }));

const { data: users } = await sb.from("app_users").select("email,survey").not("survey", "is", null);
let noRegion = 0, worst = 0;
for (const u of users ?? []) {
  const s = u.survey;
  if (!s || typeof s.hasChildren !== "boolean" || s.region) continue;
  noRegion++;
  const list = matchMeasures(s, all, { ignoreRegion: Boolean(s.region) });
  const reg = list.filter((m) => m.level !== "federal").length;
  worst = Math.max(worst, list.length);
  if (noRegion <= 5) console.log(`  ${u.email.padEnd(30)} мер: ${String(list.length).padStart(4)}, из них региональных: ${reg}`);
}
console.log(`\nанкет без региона: ${noRegion}; самая большая подборка теперь: ${worst} мер`);
console.log(`всего федеральных мер в базе: ${all.filter((m) => m.level === "federal").length}`);
