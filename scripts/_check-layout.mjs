// Новая раскладка: два блока, внутри — срочное, выплаты, бесплатно, скидки, права.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { groupPodbor, POCKET_ORDER, POCKET_TITLE } from "../src/lib/_pg-run.ts";

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

const profile = {
  region: "Костромская область", hasChildren: true, childrenCount: 3,
  children: [{ birthMonth: 5, birthYear: 2014 }, { birthMonth: 3, birthYear: 2019 }, { birthMonth: 9, birthYear: 2025 }],
  familyStatus: "married", employment: "working", employmentKind: "hired", lowIncome: true,
};
const g = groupPodbor(profile, all, new Date("2026-08-23T12:00:00"));

console.log(`ВАМ ПОДХОДИТ: ${g.total} мер (срочных ${g.urgentCount})\n`);
for (const [block, name] of [[g.federal, "ФЕДЕРАЛЬНЫЕ"], [g.regional, "МЕРЫ РЕГИОНА"]]) {
  console.log(`${name} · ${block.count}`);
  if (block.urgent.length) {
    console.log(`  ⏳ скоро истечёт срок · ${block.urgent.length}`);
    for (const it of block.urgent) console.log(`      ${it.measure.title.slice(0, 52)} — ${it.deadline.text}`);
  }
  for (const key of POCKET_ORDER) {
    const items = block.pockets[key];
    if (!items.length) continue;
    console.log(`  ${POCKET_TITLE[key]} · ${items.length}`);
    for (const it of items.slice(0, key === "support" ? 8 : 3)) console.log(`      ${it.measure.title.slice(0, 56)}`);
  }
  console.log();
}
