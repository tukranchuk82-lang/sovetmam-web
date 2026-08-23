// Что чинить в первую очередь: пересекаем частоту показов меры в живых
// подборках с признаками «карточка неполная» и «разметка слабая».
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
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
    .select("slug,title,level,region,category,amount,segments,criteria,deadline,short_description,how_to_apply,documents,tips")
    .eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const all = rows.map((r) => ({ ...r, region: r.region ?? undefined, segments: r.segments ?? [], criteria: r.criteria ?? {}, shortDescription: r.short_description ?? "", howToApply: r.how_to_apply ?? [], documents: r.documents ?? [], tips: r.tips ?? [], sourceUrl: "", sourceName: "", updatedAt: "" }));

const { data: users } = await sb.from("app_users").select("survey").not("survey", "is", null);
const anketas = (users ?? []).map((u) => u.survey).filter((s) => s && typeof s.hasChildren === "boolean");

const shows = new Map();
for (const s of anketas) for (const m of matchMeasures(s, all)) shows.set(m.slug, (shows.get(m.slug) ?? 0) + 1);

// Признаки, по которым мера требует работы.
const thin = (m) => (m.howToApply ?? []).length <= 1;              // «как оформить» одной строкой
const noTips = (m) => (m.tips ?? []).length === 0;                  // нет «важно знать»
const weakCriteria = (m) => Object.keys(m.criteria ?? {}).length <= 1; // почти нет условий отбора
const needsWork = (m) => thin(m) || noTips(m) || weakCriteria(m);

const seen = all.filter((m) => (shows.get(m.slug) ?? 0) > 0);
const never = all.length - seen.length;

console.log(`анкет: ${anketas.length} · мер в базе: ${all.length}`);
console.log(`показывались хотя бы одной семье: ${seen.length} · не показались никому: ${never}`);

// Сколько мер покрывает 80% всех показов.
const sorted = [...shows.entries()].sort((a, b) => b[1] - a[1]);
const totalShows = sorted.reduce((s, [, n]) => s + n, 0);
let acc = 0, core = 0;
for (const [, n] of sorted) { acc += n; core++; if (acc >= totalShows * 0.8) break; }
console.log(`\n80% всех показов дают ${core} мер (из ${seen.length} показанных)`);

const bySlug = new Map(all.map((m) => [m.slug, m]));
const coreSlugs = sorted.slice(0, core).map(([s]) => s);
const coreNeeds = coreSlugs.filter((s) => needsWork(bySlug.get(s)));
console.log(`из этих ${core} требуют работы: ${coreNeeds.length}`);
console.log(`  из них «как оформить» одной строкой: ${coreSlugs.filter((s) => thin(bySlug.get(s))).length}`);
console.log(`  без «важно знать»: ${coreSlugs.filter((s) => noTips(bySlug.get(s))).length}`);
console.log(`  почти без условий отбора: ${coreSlugs.filter((s) => weakCriteria(bySlug.get(s))).length}`);

console.log(`\nПО ВСЕЙ БАЗЕ требуют работы: ${all.filter(needsWork).length}`);
console.log(`  показываются людям: ${seen.filter(needsWork).length}`);
console.log(`  пока никому не показывались: ${all.filter((m) => needsWork(m) && !shows.has(m.slug)).length}`);

console.log(`\nСАМЫЕ ЧАСТЫЕ МЕРЫ, которые надо вычитать первыми:`);
for (const [slug, n] of sorted.filter(([s]) => needsWork(bySlug.get(s))).slice(0, 15)) {
  const m = bySlug.get(slug);
  const why = [thin(m) && "как оформить", noTips(m) && "важно знать", weakCriteria(m) && "условия"].filter(Boolean).join(", ");
  console.log(`  ${String(n).padStart(4)} показов · ${m.title.slice(0, 46).padEnd(46)} — ${why}`);
}
