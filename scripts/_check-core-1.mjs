// Проверка партии 1: школьное питание должно выпадать семьям со школьниками
// 6–11 лет и не выпадать беременным и семьям с малышами.
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

const cases = [
  ["Беременная первым", { region: "Костромская область", pregnant: true, hasChildren: false }, false],
  ["Малыш 1 год", { region: "Костромская область", hasChildren: true, childrenCount: 1, childrenAges: [1], children: [{ birthMonth: 8, birthYear: 2025 }] }, false],
  ["Школьник 8 лет", { region: "Костромская область", hasChildren: true, childrenCount: 1, childrenAges: [8], children: [{ birthMonth: 3, birthYear: 2018 }] }, true],
  ["Подросток 15 лет", { region: "Костромская область", hasChildren: true, childrenCount: 1, childrenAges: [15], children: [{ birthMonth: 3, birthYear: 2011 }] }, false],
  ["Малыш 2 и школьник 9", { region: "Костромская область", hasChildren: true, childrenCount: 2, childrenAges: [2, 9], children: [{ birthMonth: 3, birthYear: 2024 }, { birthMonth: 5, birthYear: 2017 }] }, true],
];

let ok = 0;
for (const [name, profile, expected] of cases) {
  const list = matchMeasures(profile, all).map((m) => m.slug);
  const has = list.includes("besplatnoe-pitanie-shkolniki");
  const good = has === expected;
  if (good) ok++;
  console.log(`${good ? "✓" : "✗"} ${name.padEnd(22)} питание: ${has ? "показываем" : "скрыто"} (ждали ${expected ? "показ" : "скрытие"}) · всего мер: ${list.length}`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
