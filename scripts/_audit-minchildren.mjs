// Ищем расхождения: в названии/описании сказано «пять и более детей», а в
// условиях подбора стоит меньше — такая мера выпадает семьям, которым не
// положена.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb.from("measures").select("slug,title,short_description,criteria,region,is_published").range(from, from + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}

const WORDS = [
  [5, /(пять|пяти|пятью|5)\s*(и более|или более|\+)|пятерых|5\+|пятью и более/i],
  [4, /(четыре|четырёх|четырех|четырьмя|4)\s*(и более|или более|\+)|4\+/i],
];
const bad = [];
for (const m of rows) {
  const text = `${m.title} ${m.short_description ?? ""}`;
  for (const [need, re] of WORDS) {
    if (!re.test(text)) continue;
    const has = m.criteria?.minChildren ?? 0;
    if (has < need) bad.push({ slug: m.slug, need, has, title: m.title, region: m.region, pub: m.is_published });
    break;
  }
}
console.log(`проверено мер: ${rows.length}; расхождений: ${bad.length}\n`);
for (const b of bad) console.log(`${b.slug} [${b.region ?? "фед"}]${b.pub ? "" : " (скрыта)"} — нужно minChildren ${b.need}, стоит ${b.has}\n   ${b.title}`);
