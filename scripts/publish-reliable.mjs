// Публикация «надёжных» мер — федеральные из официальных источников
// с конкретными суммами. Региональные МО, заготовки и vuz-меры остаются
// черновиками на проверку. Запуск: node scripts/publish-reliable.mjs

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

const RELIABLE = [
  "posobie-po-beremennosti-i-rodam",
  "posobie-beremennoy-zhene-prizyvnika",
  "edinovremennoe-pri-rozhdenii-rebenka",
  "pogashenie-ipoteki-mnogodetnym",
  "ostatok-materinskogo-kapitala",
  "posobie-usynovlenie-osobyh-detey",
  "semeynaya-nalogovaya-vyplata-2025",
  "posobie-po-uhodu-do-1-5-let",
  "vyplata-iz-matkapitala-do-3-let",
  "posobie-na-rebenka-voennosluzhashego-po-prizyvu",
  "stipendii-gosudarstvennye",
  "stipendii-prezidentskie-imennye",
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data, error } = await supabase
    .from("measures")
    .update({ is_published: true })
    .in("slug", RELIABLE)
    .select("slug");
  if (error) { console.error("Ошибка: " + error.message); process.exit(1); }

  console.log(`\n✅ Опубликовано мер: ${data?.length ?? 0}`);
  const got = new Set((data ?? []).map((r) => r.slug));
  const missing = RELIABLE.filter((s) => !got.has(s));
  if (missing.length) console.warn("Не найдены (пропущены): " + missing.join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });
