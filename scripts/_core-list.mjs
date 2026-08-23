// Список ядра: меры, дающие 80% показов и требующие работы. Пишем в файл,
// чтобы идти по нему партиями и не пересчитывать каждый раз.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { matchMeasures } from "../src/lib/measures.ts";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const s = l.trim(); if (!s || s.startsWith("#") || !s.includes("=")) continue;
  const i = s.indexOf("="); env[s.slice(0, i)] = s.slice(i + 1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,level,region,category,amount,segments,criteria,deadline,eligibility,how_to_apply,documents,tips")
    .eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const all = rows.map((r) => ({ ...r, region: r.region ?? undefined, segments: r.segments ?? [], criteria: r.criteria ?? {}, shortDescription: "", howToApply: r.how_to_apply ?? [], documents: r.documents ?? [], tips: r.tips ?? [], sourceUrl: "", sourceName: "", updatedAt: "" }));

const { data: users } = await sb.from("app_users").select("survey").not("survey", "is", null);
const anketas = (users ?? []).map((u) => u.survey).filter((s) => s && typeof s.hasChildren === "boolean");
const shows = new Map();
for (const s of anketas) for (const m of matchMeasures(s, all)) shows.set(m.slug, (shows.get(m.slug) ?? 0) + 1);

const sorted = [...shows.entries()].sort((a, b) => b[1] - a[1]);
const total = sorted.reduce((s, [, n]) => s + n, 0);
let acc = 0; const core = [];
for (const [slug, n] of sorted) { acc += n; core.push([slug, n]); if (acc >= total * 0.8) break; }

const bySlug = new Map(all.map((m) => [m.slug, m]));
const needsWork = ([slug]) => {
  const m = bySlug.get(slug);
  return (m.howToApply.length <= 1) || (m.tips.length === 0) || !m.eligibility || Object.keys(m.criteria).length <= 1;
};
const list = core.filter(needsWork).map(([slug, n]) => {
  const m = bySlug.get(slug);
  return { slug, shows: n, title: m.title, level: m.level, why: [
    m.howToApply.length <= 1 && "как оформить",
    !m.eligibility && "кому положено",
    m.tips.length === 0 && "полезно знать",
    Object.keys(m.criteria).length <= 1 && "условия",
  ].filter(Boolean) };
});
writeFileSync("scripts/_core-list.json", JSON.stringify(list, null, 1), "utf8");
console.log(`ядро: ${core.length} мер · требуют работы: ${list.length}`);
for (const x of list.slice(0, 12)) console.log(`  ${String(x.shows).padStart(4)} ${x.level === "federal" ? "ФЕД" : "рег"} ${x.title.slice(0, 46).padEnd(46)} — ${x.why.join(", ")}`);
