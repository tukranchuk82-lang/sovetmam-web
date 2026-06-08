// Чистка дублей, возникших при загрузке партий (создавались без сверки с сидами).
// Запуск: node scripts/cleanup-duplicates.mjs

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

// Удаляем дубли (оставляем более полную версию каждой меры)
const DELETE = [
  "edinovremennoe-pri-rozhdenii", // сидовый дубль — оставляем edinovremennoe-pri-rozhdenii-rebenka
  "posobie-po-beremennosti", // сидовый дубль — оставляем posobie-po-beremennosti-i-rodam
  "vyplata-iz-matkapitala-do-3-let", // мой дубль — оставляем сидовый vyplata-iz-matkapitala
];

// Восстанавливаем «Семейную ипотеку» (я перезаписал её черновиком и снял с публикации)
const SEMEYNAYA_FIX = {
  short_description:
    "Льготная ставка по ипотеке для семей с детьми на покупку жилья или строительство дома.",
  amount: "ставка до 6% годовых",
  how_to_apply: [
    "Выберите банк, участвующий в программе семейной ипотеки.",
    "Подайте заявку на ипотеку и подтвердите наличие детей.",
    "Оформите кредит на покупку или строительство жилья по льготной ставке.",
  ],
  documents: ["Паспорт", "Свидетельства о рождении детей", "Документы по доходам для банка"],
  tips: [
    "В регионах бывают дополнительные жилищные меры: региональный семейный капитал на покупку жилья, оплата аренды студенческим семьям, социальный найм для малоимущих. Уточняйте в своём регионе.",
  ],
  source_url: "https://спроси.дом.рф/",
  source_name: "ДОМ.РФ",
  is_published: true,
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  for (const slug of DELETE) {
    const { data, error } = await supabase.from("measures").delete().eq("slug", slug).select("slug");
    if (error) console.error(`${slug}: ошибка удаления — ${error.message}`);
    else console.log(`Удалено: ${slug} (${data?.length ?? 0})`);
  }

  const { data, error } = await supabase
    .from("measures")
    .update(SEMEYNAYA_FIX)
    .eq("slug", "semeynaya-ipoteka")
    .select("slug,is_published");
  if (error) console.error("semeynaya-ipoteka: " + error.message);
  else console.log(`semeynaya-ipoteka: восстановлена, опубликована = ${data?.[0]?.is_published}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
