// Регрессия после двенадцати пачек разметки: прогоняем живые анкеты и
// смотрим, не осталось ли пустых подборок и не выросли ли они неправдоподобно.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { matchMeasures } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("slug,title,level,region,category,amount,segments,criteria,deadline").eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const all = rows.map((r) => ({ ...r, region: r.region ?? undefined, segments: r.segments ?? [], criteria: r.criteria ?? {}, shortDescription: "", howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }));
const { data: users } = await sb.from("app_users").select("email,survey").not("survey", "is", null);
const sizes = [];
let empty = 0, checked = 0;
for (const u of users ?? []) {
  const s = u.survey;
  if (!s || typeof s.hasChildren !== "boolean") continue;
  checked++;
  const n = matchMeasures(s, all).length;
  sizes.push(n);
  if (n === 0) empty++;
}
sizes.sort((a, b) => a - b);
console.log(`анкет проверено: ${checked}`);
console.log(`пустых подборок: ${empty}`);
console.log(`меньше всего мер: ${sizes[0]} · середина: ${sizes[Math.floor(sizes.length / 2)]} · больше всего: ${sizes[sizes.length - 1]}`);
