// Заготовка меры: досрочная пенсия многодетным мамам (черновик, детали уточнить).
// Запуск: node scripts/add-pension-stub.mjs

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

const measure = {
  slug: "dosrochnaya-pensiya-mnogodetnym",
  title: "Досрочная пенсия многодетным мамам",
  short_description:
    "Многодетные матери могут выйти на страховую пенсию по старости раньше общего пенсионного возраста.",
  level: "federal",
  region: null,
  category: "Налоги и льготы",
  amount: null,
  segments: ["expecting-third-plus"],
  criteria: { requiresChildren: true, minChildren: 3 },
  how_to_apply: [
    "Уточните условия и подайте заявление в СоцФонд (СФР) или через Госуслуги",
  ],
  documents: [],
  tips: [
    "По действующему законодательству: 3 ребёнка — пенсия в 57 лет, 4 ребёнка — в 56 лет, 5 и более — в 50 лет; при страховом стаже не менее 15 лет и воспитании детей до 8 лет.",
    "ЗАГОТОВКА: регулируется в т.ч. Федеральным законом № 443 от 28.11.2025 — детали нужно сверить и дополнить (условия могут отличаться).",
  ],
  source_url: "https://www.gosuslugi.ru/",
  source_name: "Госуслуги / СоцФонд",
  updated_at_label: "2026",
  is_published: false,
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await supabase.from("measures").upsert(measure, { onConflict: "slug" });
  if (error) { console.error("Ошибка: " + error.message); process.exit(1); }
  console.log("✅ Заготовка добавлена черновиком: " + measure.slug);
}

main().catch((e) => { console.error(e); process.exit(1); });
