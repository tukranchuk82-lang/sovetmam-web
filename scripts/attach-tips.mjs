// Привязка «Полезно знать» (фактов/советов) к существующим мерам.
// Запуск: node scripts/attach-tips.mjs

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

const TIPS = {
  "posobie-po-beremennosti-i-rodam": [
    "Можно не уходить в декрет или совмещать декретные выплаты с подработкой на другой работе.",
    "Беременной студентке возможен перевод с платного обучения на бюджетное.",
    "Студенткам во время декрета продолжают платить академическую и социальную стипендию.",
  ],
  "posobie-po-uhodu-do-1-5-let": [
    "В отпуск по уходу может уйти не только мама, но и папа, бабушка или дедушка — если они работают.",
    "Отпуск по уходу за ребёнком возможен до 3 лет, но ежемесячные выплаты идут до 1,5 лет.",
    "За время отпуска по уходу для пенсии засчитывается 1,5 года стажа за каждого ребёнка плюс пенсионные баллы.",
  ],
  "edinovremennoe-pri-rozhdenii-rebenka": [
    "Помимо государственной выплаты, работодатель может выплатить свою материальную помощь при рождении ребёнка — от нескольких тысяч до 1 млн ₽ и более (зависит от компании).",
  ],
  "edinoe-posobie": [
    "На Госуслугах можно отправить запрос и узнать, какие меры поддержки положены именно вашей семье.",
    "Региональные ежемесячные выплаты уточняйте на Госуслугах, в МФЦ или в отделении СоцФонда — они зависят от вашего региона.",
  ],
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  for (const [slug, tips] of Object.entries(TIPS)) {
    const { data, error } = await supabase
      .from("measures")
      .update({ tips })
      .eq("slug", slug)
      .select("slug");
    if (error) { console.error(`${slug}: ошибка — ${error.message}`); continue; }
    if (!data || data.length === 0) console.warn(`${slug}: меры нет в базе — пропущено`);
    else console.log(`${slug}: +${tips.length} заметок`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
