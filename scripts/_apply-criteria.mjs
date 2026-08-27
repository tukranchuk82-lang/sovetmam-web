// Общий применятель правок отбора: берёт список {slug, criteria} и пишет их,
// сохраняя прежние значения в резервный файл.
// Использование: import { apply } from "./_apply-criteria.mjs"; apply(name, PATCHES)
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function apply(name, PATCHES, { dryRun = false } = {}) {
  const slugs = Object.keys(PATCHES);
  const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
  if (error) throw error;
  if (before.length !== slugs.length) {
    const found = before.map((m) => m.slug);
    throw new Error("не нашлись: " + slugs.filter((s) => !found.includes(s)).join(", "));
  }
  for (const m of before) {
    console.log(m.title.replace(/ \([^)]+\)$/, "").slice(0, 64));
    console.log("   было: " + JSON.stringify(m.criteria));
    console.log("  стало: " + JSON.stringify(PATCHES[m.slug]));
  }
  if (dryRun) { console.log("\nсухой прогон"); return; }
  writeFileSync(`scripts/_backup-${name}.json`, JSON.stringify(before, null, 1), "utf8");
  for (const slug of slugs) {
    const { error: e } = await sb.from("measures").update({ criteria: PATCHES[slug] }).eq("slug", slug);
    if (e) throw new Error(`${slug}: ${e.message}`);
  }
  console.log(`\nзаписано: ${slugs.length}`);
}
