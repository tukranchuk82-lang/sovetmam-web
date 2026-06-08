// Список всех мер в базе: slug, название, уровень, статус публикации, сегменты.
// Запуск: node scripts/list-measures.mjs

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await supabase
    .from("measures")
    .select("slug,title,level,category,is_published,segments")
    .order("category", { ascending: true })
    .order("is_published", { ascending: false });
  if (error) { console.error("Ошибка: " + error.message); process.exit(1); }

  const pub = data.filter((m) => m.is_published).length;
  console.log(`Всего мер: ${data.length} (опубликовано: ${pub}, черновиков: ${data.length - pub})\n`);
  let cat = null;
  for (const m of data) {
    if (m.category !== cat) { cat = m.category; console.log(`\n=== ${cat ?? "(без категории)"} ===`); }
    const mark = m.is_published ? "✓" : "·";
    const seg = (m.segments ?? []).length ? ` [${m.segments.join(",")}]` : "";
    console.log(`  ${mark} ${m.slug} — ${m.title}${seg}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
