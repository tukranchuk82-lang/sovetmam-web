// Проверка: что даст настоящий движок, если знать только четыре ответа квиза.
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
    .select("slug,title,level,region,category,amount,segments,criteria,deadline")
    .eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const all = rows.map((r) => ({ ...r, region: r.region ?? undefined, segments: r.segments ?? [], criteria: r.criteria ?? {}, shortDescription: "", howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }));

const cases = [
  ["Кострома · ребёнок до 3 лет · в декрете", { region: "Костромская область", hasChildren: true, childrenCount: 1, children: [{ birthMonth: 3, birthYear: 2025 }], employment: "parental-leave" }],
  ["Москва · трое детей · работает", { region: "Москва", hasChildren: true, childrenCount: 3, children: [{ birthMonth: 5, birthYear: 2014 }, { birthMonth: 2, birthYear: 2019 }, { birthMonth: 9, birthYear: 2022 }], employment: "working", employmentKind: "hired" }],
  ["Краснодар · ждёт первого · не работает", { region: "Краснодарский край", isPregnant: true, hasChildren: false, employment: "not-working" }],
  ["Свердловская · ребёнок-инвалид · семья СВО", { region: "Свердловская область", hasChildren: true, childrenCount: 2, children: [{ birthMonth: 4, birthYear: 2016 }, { birthMonth: 8, birthYear: 2020 }], hasDisabledChild: true, isSvoFamily: true, employment: "working", employmentKind: "hired" }],
];

for (const [name, profile] of cases) {
  const list = matchMeasures(profile, all);
  const fed = list.filter((m) => m.level === "federal").length;
  console.log(`${name}: ${list.length} мер (федеральных ${fed}, региональных ${list.length - fed})`);
  console.log("   примеры: " + list.slice(0, 3).map((m) => m.title.slice(0, 42)).join(" · "));
}
