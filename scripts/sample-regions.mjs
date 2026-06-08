import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const t = line.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i === -1) continue;
  const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!(k in process.env)) process.env[k] = v;
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
for (const region of ["Челябинская область", "Кировская область"]) {
  const { data } = await supabase.from("measures").select("title,category,segments,source_url").eq("region", region).order("slug");
  console.log(`\n===== ${region} (${data.length}) =====`);
  for (const m of data) console.log(`• [${m.category}] ${m.title.slice(0, 95)}  {${(m.segments||[]).join(",")}}`);
}
