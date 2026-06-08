// Партия 12: беременность первым ребёнком — полный дубль партий 10/11.
// Новое только 2 медицинских нюанса → дописываем в vedenie-beremennosti-oms.
// Запуск: node scripts/load-batch-12.mjs

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

const SLUG = "vedenie-beremennosti-oms";
const ADD_TIPS = [
  "Родить в перинатальном центре можно по направлению врача — это учреждение для сложных случаев, выбрать его «по желанию» нельзя.",
  "Беременных и молодые семьи в санаторий для сотрудников часто берут без очереди — узнайте подробности в профсоюзе вашей организации.",
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: row, error } = await supabase.from("measures").select("tips").eq("slug", SLUG).single();
  if (error) { console.error("Ошибка чтения: " + error.message); process.exit(1); }
  const cur = Array.isArray(row.tips) ? row.tips : [];
  const merged = [...cur];
  for (const t of ADD_TIPS) if (!merged.includes(t)) merged.push(t);
  const { error: e } = await supabase.from("measures").update({ tips: merged }).eq("slug", SLUG);
  if (e) { console.error(e.message); process.exit(1); }
  console.log(`${SLUG}: подсказок ${cur.length} → ${merged.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
