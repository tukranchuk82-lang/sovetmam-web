// Единое пособие: положено только при доходе не выше прожиточного минимума.
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
  ["Беременная, доход до 1 ПМ", { region: "Костромская область", pregnant: true, incomePm: 1, lowIncome: true }, true],
  ["Беременная, выше 2 ПМ", { region: "Костромская область", pregnant: true, incomePm: null, lowIncome: false }, false],
  ["Семья с ребёнком, до 1 ПМ", { region: "Костромская область", hasChildren: true, childrenCount: 1, childrenAges: [4], youngestChildAgeYears: 4, incomePm: 1, lowIncome: true }, true],
  ["Семья с ребёнком, 1,5 ПМ", { region: "Костромская область", hasChildren: true, childrenCount: 1, childrenAges: [4], youngestChildAgeYears: 4, incomePm: 1.5, lowIncome: false }, false],
];
let ok = 0;
for (const [name, profile, expected] of cases) {
  const has = matchMeasures(profile, all).some((m) => m.slug === "edinoe-posobie");
  const good = has === expected;
  if (good) ok++;
  console.log(`${good ? "✓" : "✗"} ${name.padEnd(28)} ${has ? "показываем" : "скрыто"} (ждали ${expected ? "показ" : "скрытие"})`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
