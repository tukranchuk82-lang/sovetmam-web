// Регионы без живых анкет, где вычитка ещё не прошла, — по числу мер.
import { DONE } from "./vychitka-done.mjs";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("region").eq("is_published", true).not("region", "is", null).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const by = new Map();
for (const r of rows) by.set(r.region, (by.get(r.region) ?? 0) + 1);
const left = [...by.entries()].filter(([r]) => !DONE.has(r)).sort((a, b) => b[1] - a[1]);
let total = 0;
for (const [r, n] of left) { total += n; console.log(`  ${String(n).padStart(3)} мер · ${r}`); }
console.log(`регионов ${left.length}, мер ${total}`);
