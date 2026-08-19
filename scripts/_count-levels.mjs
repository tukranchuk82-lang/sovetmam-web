// Сколько у нас мер по уровням пирамиды 3–7 (муниципалитет, работодатель,
// вуз, НКО, бизнес) — то, что книга называет уровнями 3–7.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("slug,title,segments,level,is_published").eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
for (const [name, key] of [["Работодатель", "topic-employers"], ["Вуз/колледж", "topic-vuz"], ["НКО", "topic-nko"], ["Бизнес", "topic-business"], ["Скидки магазинов", "topic-shops"]]) {
  const list = rows.filter((m) => (m.segments ?? []).includes(key));
  console.log(`${name}: ${list.length}`);
  for (const m of list.slice(0, 8)) console.log(`   ${m.title.slice(0, 66)}`);
}
