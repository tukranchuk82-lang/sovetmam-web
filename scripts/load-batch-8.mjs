// Партия 8: меры №25 (жильё от работодателя) и №36 (ЖКУ чернобыльцам).
// Без подходящего сегмента — пустой segments (попадут в общий /catalog).
// Запуск: node scripts/load-batch-8.mjs

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

const measures = [
  {
    slug: "pomoshch-s-zhilyem-ot-rabotodatelya",
    title: "Помощь с жильём от работодателя",
    short_description:
      "Некоторые работодатели помогают сотрудникам с жильём — оплачивают аренду, первый взнос, проценты по ипотеке, иногда покупают квартиру.",
    level: "federal",
    region: null,
    category: "Жильё и ипотека",
    amount: "Зависит от работодателя",
    segments: [],
    criteria: {},
    how_to_apply: ["Уточните условия в отделе кадров или коллективном договоре работодателя"],
    documents: [],
    tips: [
      "Такая поддержка не обязательна по закону, но многие компании (особенно крупные и государственные) её предоставляют. Спросите у работодателя, есть ли жилищные программы для сотрудников.",
    ],
    source_url: "https://www.gosuslugi.ru/",
    source_name: "Работодатель / коллективный договор",
    updated_at_label: "2026",
    is_published: false,
  },
  {
    slug: "kompensaciya-zhku-chernobyl",
    title: "Компенсация 50% ЖКУ пострадавшим от чернобыльской катастрофы",
    short_description:
      "Гражданам, пострадавшим от чернобыльской катастрофы, и совместно проживающим с ними членам семьи компенсируют 50% расходов на жильё и коммунальные услуги.",
    level: "federal",
    region: null,
    category: "Налоги и льготы",
    amount: "50% расходов на ЖКУ",
    segments: [],
    criteria: {},
    how_to_apply: ["Оформить в МФЦ или органах соцзащиты после оплаты квитанций"],
    documents: [],
    tips: [],
    source_url: "https://www.gosuslugi.ru/",
    source_name: "МФЦ / органы соцзащиты",
    updated_at_label: "2026",
    is_published: false,
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await supabase.from("measures").upsert(measures, { onConflict: "slug" });
  if (error) { console.error("Ошибка: " + error.message); process.exit(1); }
  console.log(`✅ Добавлено мер: ${measures.length} (черновики)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
