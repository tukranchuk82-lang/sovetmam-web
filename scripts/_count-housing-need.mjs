// Сколько мер требуют статуса «нуждающиеся в улучшении жилищных условий» —
// критерия, которого нет ни в анкете, ни в движке.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("slug,title,level,short_description,criteria").eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const re = /нуждающ|улучшени\w+ жилищн|учёт\w* нуждающ|учет\w* нуждающ|аварийн\w+ жиль/i;
const hit = rows.filter((m) => re.test(`${m.title} ${m.short_description ?? ""}`));
console.log(`мер со статусом «нуждающиеся в жилье»: ${hit.length} (федеральных ${hit.filter((m) => m.level === "federal").length})`);
const re2 = /признан\w* нуждающ|состоящ\w* на учёте|состоящ\w* на учете|вставш\w* на учёт нуждающ/i;
console.log(`из них статус назван прямым условием: ${hit.filter((m) => re2.test(`${m.title} ${m.short_description ?? ""}`)).length}`);
