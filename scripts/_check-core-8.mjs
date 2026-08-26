// Проверка партии 8: кому теперь выпадают ипотеки.
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

const base = { mortgageIntent: true, hasChildren: true };
const cases = [
  ["Кострома, ребёнок 3 года", { ...base, region: "Костромская область", childrenCount: 1, childrenAges: [3], youngestChildAgeYears: 3 }, { semeynaya: true, dv: false }],
  ["Кострома, один ребёнок 15", { ...base, region: "Костромская область", childrenCount: 1, childrenAges: [15], youngestChildAgeYears: 15 }, { semeynaya: false, dv: false }],
  ["Кострома, двое 15 и 12", { ...base, region: "Костромская область", childrenCount: 2, childrenAges: [15, 12], youngestChildAgeYears: 12 }, { semeynaya: true, dv: false }],
  ["Хабаровск, ребёнок 15", { ...base, region: "Хабаровский край", childrenCount: 1, childrenAges: [15], youngestChildAgeYears: 15 }, { semeynaya: false, dv: true }],
  ["Мурманск, ребёнок 2 года", { ...base, region: "Мурманская область", childrenCount: 1, childrenAges: [2], youngestChildAgeYears: 2 }, { semeynaya: true, dv: true }],
];
let ok = 0, total = 0;
for (const [name, profile, expect] of cases) {
  const list = matchMeasures(profile, all).map((m) => m.slug);
  const got = { semeynaya: list.includes("semeynaya-ipoteka"), dv: list.includes("dalnevostochnaya-arkticheskaya-ipoteka") };
  for (const key of ["semeynaya", "dv"]) {
    total++;
    const good = got[key] === expect[key];
    if (good) ok++;
    if (!good) console.log(`✗ ${name}: ${key} — ${got[key] ? "показываем" : "скрыто"}, ждали ${expect[key] ? "показ" : "скрытие"}`);
  }
  console.log(`  ${name.padEnd(26)} семейная: ${got.semeynaya ? "да " : "нет"} · дальневосточная: ${got.dv ? "да" : "нет"}`);
}
console.log(`\nсовпало: ${ok} из ${total}`);
