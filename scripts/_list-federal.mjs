import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await sb.from("measures")
  .select("slug,title,category,amount,criteria,eligibility,short_description")
  .eq("level", "federal").eq("is_published", true).order("slug");
if (error) throw error;
console.log("федеральных живых:", data.length, "\n");
data.forEach((m, i) => {
  const txt = (m.eligibility ?? m.short_description ?? "").length;
  console.log(`${String(i + 1).padStart(3)} ${m.slug}`);
  console.log(`    ${m.title}`);
  console.log(`    ${JSON.stringify(m.criteria)}  · текста ${txt} зн.`);
});
