// Проверка «будильника»: у каких эталонных семей и какие сроки видны.
//
// Запуск: node --experimental-strip-types scripts/_check-deadlines.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { deadlineStatus, matchMeasures } from "../src/lib/measures.ts";
import { PERSONAS } from "./podbor-personas.mjs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb
    .from("measures")
    .select("slug,title,level,region,category,amount,segments,criteria,deadline")
    .eq("is_published", true)
    .range(f, f + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}
const all = rows.map((r) => ({
  ...r,
  region: r.region ?? undefined,
  segments: r.segments ?? [],
  criteria: r.criteria ?? {},
  shortDescription: "",
  howToApply: [],
  documents: [],
  tips: [],
  sourceUrl: "",
  sourceName: "",
  updatedAt: "",
}));

console.log(`мер со сроком в базе: ${all.filter((m) => m.deadline).length}\n`);

let urgentTotal = 0;
for (const p of PERSONAS) {
  const matched = matchMeasures(p.survey, all);
  const withDeadline = matched
    .map((m) => ({ m, d: deadlineStatus(p.survey, m) }))
    .filter((x) => x.d);
  const urgent = withDeadline.filter((x) => x.d.urgent);
  urgentTotal += urgent.length;
  if (!withDeadline.length) {
    console.log(`· ${p.name} — сроков нет`);
    continue;
  }
  console.log(`${urgent.length ? "!" : "·"} ${p.name} — со сроком ${withDeadline.length}, срочных ${urgent.length}`);
  for (const { m, d } of withDeadline) {
    console.log(`     ${d.urgent ? "🔴" : "  "} ${m.title.replace(/ \([^)]+\)$/, "").slice(0, 56)} — ${d.text}`);
  }
}
console.log(`\nсрочных плашек всего: ${urgentTotal}`);
