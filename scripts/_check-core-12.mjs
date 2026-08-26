// Пушкинская карта и образовательный кредит должны выпадать семьям с детьми
// подходящего возраста, включая студентов старше 18.
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
  const { data, error } = await sb.from("measures").select("slug,title,level,region,category,amount,segments,criteria,deadline").eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const all = rows.map((r) => ({ ...r, region: r.region ?? undefined, segments: r.segments ?? [], criteria: r.criteria ?? {}, shortDescription: "", howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }));

const family = (ages) => ({
  region: "Костромская область", hasChildren: true, childrenCount: ages.length,
  childrenAges: ages, youngestChildAgeYears: Math.min(...ages),
  children: ages.map((a) => ({ birthMonth: 6, birthYear: 2026 - a })),
});
const cases = [
  ["Ребёнок 10 лет", family([10]), { push: false, kredit: false }],
  ["Подросток 15 лет", family([15]), { push: true, kredit: false }],
  ["Подросток 17 лет", family([17]), { push: true, kredit: true }],
  ["Студент 20 лет", family([20]), { push: true, kredit: true }],
];
let ok = 0, total = 0;
for (const [name, profile, expect] of cases) {
  const list = matchMeasures(profile, all).map((m) => m.slug);
  const got = { push: list.includes("pushkinskaya-karta"), kredit: list.includes("obrazovatelnyy-kredit") };
  for (const k of ["push", "kredit"]) { total++; if (got[k] === expect[k]) ok++; }
  console.log(`  ${name.padEnd(18)} Пушкинская карта: ${got.push ? "да " : "нет"} · образовательный кредит: ${got.kredit ? "да" : "нет"}`);
}
console.log(`\nсовпало: ${ok} из ${total}`);
