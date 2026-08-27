import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const s = l.trim(); if (!s || s.startsWith("#") || !s.includes("=")) continue;
  const i = s.indexOf("="); env[s.slice(0, i)] = s.slice(i + 1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await sb.from("measures").select("*").in("slug", process.argv.slice(2));
if (error) throw error;
for (const m of data) {
  console.log("=".repeat(72));
  console.log(m.title, "|", m.slug, "|", m.level, "|", m.region ?? "—");
  console.log("amount:", m.amount, "| категория:", m.category);
  console.log("criteria:", JSON.stringify(m.criteria));
  console.log("segments:", JSON.stringify(m.segments));
  console.log("--- lead ---\n" + (m.lead ?? m.summary ?? "—"));
  console.log("--- eligibility ---\n" + (m.eligibility ?? "—"));
}
