// Городские меры Нижнего Новгорода: заводим с явной пометкой «только для жителей города».
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const SCRATCH = "C:/Users/user/AppData/Local/Temp/claude/c--------------Dev-SovetMam/ceabb2c2-5a94-4b85-91a1-bb4ad96bd4b9/scratchpad/";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l.includes("=") && !l.startsWith("#")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const COLUMNS = ["title", "short_description", "category", "amount", "segments", "criteria", "eligibility", "how_to_apply", "documents", "tips", "source_url", "source_name", "deadline", "applies_by_child"];
const r = JSON.parse(readFileSync(SCRATCH + "day12_nizhny.json", "utf8"));
const city = r.new.filter((c) => ["nizh-008", "nizh-009", "nizh-010", "nizh-011", "nizh-012", "nizh-013"].includes(c.slug));
const { data: all } = await sb.from("measures").select("slug").ilike("slug", "nnov-%");
let n = Math.max(0, ...(all ?? []).map((m) => Number(m.slug.slice(5)) || 0));
const now = new Date().toISOString();
for (const c of city) {
  n += 1;
  const slug = `nnov-${String(n).padStart(3, "0")}`;
  const row = { slug, level: "regional", region: "Нижегородская область", sort_order: 0, is_published: true };
  for (const k of COLUMNS) if (c[k] !== undefined) row[k] = c[k];
  const bare = c.title.replace(/\s*\(город Нижний Новгород\)\s*$/, "");
  row.title = `Только для жителей Нижнего Новгорода: ${bare.charAt(0).toLowerCase()}${bare.slice(1)}`;
  const note = "Только для жителей города Нижнего Новгорода (не всей области). ";
  row.short_description = c.short_description.startsWith("Городск") ? note + c.short_description : note + c.short_description;
  row.updated_at_label = "октябрь 2026"; row.verified_at = now; row.verified_by = "сверка 12.10.2026";
  const { error } = await sb.from("measures").insert(row);
  console.log(slug, error ? "ОШИБКА " + error.message : "ok", "|", row.title.slice(0, 90));
}
const { data: closed } = await sb.from("measure_disputes").update({ status: "resolved", resolved_at: now, resolved_by: "решение 12.10.2026: завели с пометкой «только город»" }).eq("status", "open").like("title", "Нижегородская область: городская мера%").select("id");
console.log("закрыто споров:", closed?.length ?? 0);
