// Какие регионы ещё не вычитаны — по числу живых семей.
import { DONE } from "./vychitka-done.mjs";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: users } = await sb.from("app_users").select("survey").not("survey", "is", null);
const byRegion = new Map();
for (const u of users ?? []) {
  const r = u.survey?.region;
  if (r) byRegion.set(r, (byRegion.get(r) ?? 0) + 1);
}
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("region").eq("is_published", true).not("region", "is", null).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const measuresBy = new Map();
for (const r of rows) measuresBy.set(r.region, (measuresBy.get(r.region) ?? 0) + 1);
const left = [...byRegion.entries()].filter(([r]) => !DONE.has(r)).sort((a, b) => b[1] - a[1]);
console.log("осталось регионов с семьями:", left.length);
let fam = 0, mer = 0;
for (const [r, n] of left) { fam += n; mer += measuresBy.get(r) ?? 0; console.log(`  ${String(n).padStart(3)} семей · ${r} · мер ${measuresBy.get(r) ?? 0}`); }
console.log(`итого семей ${fam}, мер ${mer}`);
