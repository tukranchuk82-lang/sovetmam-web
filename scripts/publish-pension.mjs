// Наполняем и публикуем последний черновик — досрочную пенсию многодетным.
// Условия — устоявшиеся (ст. 32 ФЗ-400). Запуск: node scripts/publish-pension.mjs

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

const fields = {
  short_description:
    "Многодетные мамы выходят на страховую пенсию раньше общего срока: с 3 детьми — в 57 лет, с 4 — в 56, с 5 и более — в 50 лет.",
  amount: "досрочный выход на пенсию (на 3–10 лет раньше)",
  how_to_apply: ["Подать заявление в Социальный фонд России (через Госуслуги, СФР или МФЦ) при наступлении права"],
  documents: ["Свидетельства о рождении детей", "Документы о страховом стаже"],
  tips: [
    "Право даётся при страховом стаже не менее 15 лет и при условии, что дети воспитаны до достижения 8 лет.",
    "В пенсионный стаж засчитывается по 1,5 года за каждого ребёнка (до 6 лет в сумме), плюс начисляются пенсионные баллы — за каждого последующего ребёнка больше.",
  ],
  source_url: "https://sfr.gov.ru/",
  source_name: "ст. 32 ФЗ № 400-ФЗ «О страховых пенсиях»",
  is_published: true,
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await supabase
    .from("measures").update(fields).eq("slug", "dosrochnaya-pensiya-mnogodetnym").select("slug,is_published");
  if (error) { console.error(error.message); process.exit(1); }
  if (!data?.length) { console.warn("dosrochnaya-pensiya-mnogodetnym: не найдена"); return; }
  console.log(`dosrochnaya-pensiya-mnogodetnym: опубликована = ${data[0].is_published}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
