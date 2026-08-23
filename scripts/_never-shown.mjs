// Меры, которые не выпали ни одной живой анкете. Отделяем «просто нет таких
// семей в базе» от «регион представлен, а мера всё равно молчит».
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
  const { data, error } = await sb.from("measures").select("slug,title,level,region,criteria").eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const all = rows.map((r) => ({ ...r, region: r.region ?? undefined, segments: [], criteria: r.criteria ?? {}, shortDescription: "", howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }));
const { data: users } = await sb.from("app_users").select("survey").not("survey", "is", null);
const anketas = (users ?? []).map((u) => u.survey).filter((s) => s && typeof s.hasChildren === "boolean");

const shown = new Set();
for (const s of anketas) for (const m of matchMeasures(s, all)) shown.add(m.slug);
const regionsWithPeople = new Set(anketas.map((s) => s.region).filter(Boolean));

const never = all.filter((m) => !shown.has(m.slug));
const neverInLiveRegions = never.filter((m) => m.level === "federal" || (m.region && regionsWithPeople.has(m.region)));

console.log(`регионов среди анкет: ${regionsWithPeople.size} из 89`);
console.log(`мер не показалось никому: ${never.length}`);
console.log(`  из них в регионах, где живут наши семьи: ${neverInLiveRegions.length} ← это подозрительно`);
console.log(`  в регионах без анкет: ${never.length - neverInLiveRegions.length} ← просто некому было показать`);
console.log(`  федеральных среди молчащих: ${never.filter((m) => m.level === "federal").length}`);

// Чем ограничены молчащие меры в «живых» регионах.
const cnt = {};
for (const m of neverInLiveRegions) for (const k of Object.keys(m.criteria ?? {})) cnt[k] = (cnt[k] ?? 0) + 1;
console.log(`\nЧаще всего их запирают условия:`);
for (const [k, n] of Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${String(n).padStart(4)} · ${k}`);

console.log(`\nПримеры молчащих федеральных мер:`);
for (const m of never.filter((m) => m.level === "federal").slice(0, 8)) console.log(`  ${m.title.slice(0, 60)} — условия: ${Object.keys(m.criteria ?? {}).join(", ") || "нет"}`);
