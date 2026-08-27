// Поиск мер по словам в названии и текстах.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,level,region,category,criteria,short_description,eligibility,is_published")
    .range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
for (const needle of process.argv.slice(2)) {
  const re = new RegExp(needle, "i");
  const inTitle = rows.filter((m) => re.test(m.title));
  const inText = rows.filter((m) => !re.test(m.title) && re.test([m.short_description, m.eligibility].join(" ")));
  console.log(`\n=== «${needle}» — в названии: ${inTitle.length}, только в тексте: ${inText.length}`);
  for (const m of inTitle) {
    console.log(`  ${m.is_published === false ? "[скрыта] " : ""}${m.title}`);
    console.log(`     ${m.slug} · ${m.level} · ${m.region ?? "—"} · ${m.category} · ${JSON.stringify(m.criteria)}`);
  }
  for (const m of inText.slice(0, 8)) console.log(`  (в тексте) ${m.title} — ${m.slug}`);
  if (inText.length > 8) console.log(`  … и ещё ${inText.length - 8} в тексте`);
}
