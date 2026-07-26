// Справочник сегментов + частота использования — чтобы новые меры размечались так же, как старые.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: segs } = await sb.from("segments").select("*");
console.log("=== segments (таблица) ===");
for (const s of segs || []) console.log(` ${s.id ?? s.slug} — ${s.title ?? ""}`);

let all = [];
let from = 0;
while (true) {
  const { data, error } = await sb.from("measures").select("segments,category").range(from, from + 999);
  if (error) throw error;
  all = all.concat(data);
  if (data.length < 1000) break;
  from += 1000;
}
const freq = {};
for (const m of all) for (const s of m.segments || []) freq[s] = (freq[s] || 0) + 1;
console.log(`\n=== segments на мерах (${all.length} мер) ===`);
for (const [k, v] of Object.entries(freq).sort((a, b) => b[1] - a[1])) console.log(`${String(v).padStart(5)}  ${k}`);

const cat = {};
for (const m of all) cat[m.category] = (cat[m.category] || 0) + 1;
console.log("\n=== категории ===");
for (const [k, v] of Object.entries(cat).sort((a, b) => b[1] - a[1])) console.log(`${String(v).padStart(5)}  ${k}`);
