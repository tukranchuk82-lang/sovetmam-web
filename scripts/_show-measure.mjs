import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("*").eq("slug", process.argv[2]).single();
for (const k of ["title","amount","short_description","criteria","how_to_apply","documents","tips","source_name","source_url","updated_at_label"]) {
  console.log(`${k}: ${typeof data[k] === "string" ? data[k] : JSON.stringify(data[k], null, 1)}\n`);
}
