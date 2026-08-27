// Все меры региона с условиями и текстом — для вычитки.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const region = process.argv[2];
const { data, error } = await sb.from("measures")
  .select("slug,title,amount,criteria,short_description,eligibility,category")
  .eq("region", region).eq("is_published", true).order("slug");
if (error) throw error;
console.log(`${region}: ${data.length} мер\n`);
for (const m of data) {
  console.log("─".repeat(72));
  console.log(`${m.slug} · ${m.title}`);
  console.log(`  сумма: ${m.amount ?? "—"}`);
  console.log(`  условия: ${JSON.stringify(m.criteria)}`);
  const txt = (m.eligibility ?? m.short_description ?? "").replace(/\s+/g, " ").trim();
  console.log(`  текст: ${txt.slice(0, 400)}`);
}
