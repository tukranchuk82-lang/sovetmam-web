// Проверка партии 5: лекарства должны выпадать семьям с малышом до 3 лет и
// многодетным, пока младшему нет шести, — и не выпадать многодетным с
// подростками.
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

const kid = (age) => ({ birthMonth: 6, birthYear: 2026 - age });
// В живой анкете возраст младшего лежит отдельным полем — движок смотрит
// именно на него, поэтому в проверочных профилях оно тоже обязано быть.
const young = (ages) => Math.min(...ages);
const cases = [
  ["Малыш 2 года", { region: "Костромская область", hasChildren: true, childrenCount: 1, childrenAges: [2], youngestChildAgeYears: 2, children: [kid(2)] }, true],
  ["Один ребёнок 5 лет", { region: "Костромская область", hasChildren: true, childrenCount: 1, childrenAges: [5], youngestChildAgeYears: 5, children: [kid(5)] }, false],
  ["Трое, младшему 5", { region: "Костромская область", hasChildren: true, childrenCount: 3, childrenAges: [12, 8, 5], youngestChildAgeYears: 5, children: [kid(12), kid(8), kid(5)] }, true],
  ["Трое, младшему 9", { region: "Костромская область", hasChildren: true, childrenCount: 3, childrenAges: [15, 12, 9], youngestChildAgeYears: 9, children: [kid(15), kid(12), kid(9)] }, false],
];
let ok = 0;
for (const [name, profile, expected] of cases) {
  const has = matchMeasures(profile, all).some((m) => m.slug === "besplatnye-lekarstva-detyam");
  const good = has === expected;
  if (good) ok++;
  console.log(`${good ? "✓" : "✗"} ${name.padEnd(22)} лекарства: ${has ? "показываем" : "скрыто"} (ждали ${expected ? "показ" : "скрытие"})`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
