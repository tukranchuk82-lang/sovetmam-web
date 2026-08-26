// Проверка после доводки: сертификат на кружки не должен выпадать беременным
// и семьям с малышами до 5 лет.
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
  ["Малыш 3 года", { region: "Костромская область", hasChildren: true, childrenCount: 1, childrenAges: [3], children: [{ birthMonth: 5, birthYear: 2023 }] }, false],
  ["Ребёнок 6 лет", { region: "Костромская область", hasChildren: true, childrenCount: 1, childrenAges: [6], children: [{ birthMonth: 5, birthYear: 2020 }] }, true],
  ["Подросток 16 лет", { region: "Костромская область", hasChildren: true, childrenCount: 1, childrenAges: [16], children: [{ birthMonth: 5, birthYear: 2010 }] }, true],
];
let ok = 0;
for (const [name, profile, expected] of cases) {
  const has = matchMeasures(profile, all).some((m) => m.slug === "sertifikat-dopolnitelnogo-obrazovaniya");
  const good = has === expected;
  if (good) ok++;
  console.log(`${good ? "✓" : "✗"} ${name.padEnd(20)} сертификат: ${has ? "показываем" : "скрыт"} (ждали ${expected ? "показ" : "скрытие"})`);
}
console.log(`\nсовпало: ${ok} из ${cases.length}`);
