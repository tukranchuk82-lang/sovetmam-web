import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data, error } = await sb.from("app_users")
  .select("email,survey,survey_updated_at")
  .not("survey", "is", null)
  .order("survey_updated_at", { ascending: false, nullsFirst: false })
  .limit(6);
if (error) throw error;
for (const u of data) {
  const s = u.survey ?? {};
  console.log(`${u.survey_updated_at ?? "—"} | ${u.email}`);
  console.log(`   регион: ${s.region ?? "—"} | занятость: ${s.employmentStatus ?? "—"} | беременна: ${s.pregnant ?? "—"} | дети: ${JSON.stringify(s.children ?? s.hasChildren)}`);
}
