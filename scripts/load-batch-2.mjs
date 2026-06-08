// Партия 2: меры из текстового «резюме» по выплатам при беременности/рождении.
// 2 новые меры (черновики) + обогащение существующих декретных (студентки-очницы).
// Идемпотентно (upsert по slug). Запуск: node scripts/load-batch-2.mjs

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const envPath = join(projectRoot, ".env.local");
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

const SRC_URL = "https://www.gosuslugi.ru/";
const SRC_NAME = "Госуслуги для родителей";
const ALL_BIRTH = ["expecting-first", "expecting-second", "expecting-third-plus"];

const measures = [
  // НОВАЯ
  {
    slug: "posobie-po-uhodu-do-1-5-let",
    title: "Ежемесячное пособие по уходу за ребёнком до 1,5 лет",
    short_description:
      "Ежемесячная выплата работавшим родителям (или другим работающим родственникам) в отпуске по уходу за ребёнком до 1,5 лет.",
    level: "federal",
    region: null,
    category: "Выплаты и пособия",
    // ВНИМАНИЕ: суммы в исходном тексте не было — стандарт по закону, проверьте.
    amount: "40% среднего заработка (есть установленные законом минимум и максимум)",
    segments: ALL_BIRTH,
    criteria: { requiresChildren: true, maxYoungestChildAgeYears: 1 },
    how_to_apply: [
      "Если работали — обратитесь к работодателю",
      "Иначе подайте заявление через Госуслуги, МФЦ или СоцФонд (СФР)",
    ],
    documents: ["Заявление", "Свидетельство о рождении ребёнка"],
    sort_order: 90,
  },
  // НОВАЯ
  {
    slug: "vyplata-iz-matkapitala-do-3-let",
    title: "Ежемесячная выплата из материнского капитала на ребёнка до 3 лет",
    short_description:
      "Семьи с доходом меньше 2 прожиточных минимумов на человека могут получать ежемесячную выплату из материнского капитала на ребёнка до 3 лет.",
    level: "federal",
    region: null,
    category: "Выплаты и пособия",
    // ВНИМАНИЕ: суммы в тексте не было — стандарт = 1 ПМ на ребёнка в регионе, проверьте.
    amount: "1 прожиточный минимум на ребёнка в вашем регионе",
    segments: ALL_BIRTH,
    criteria: {
      requiresChildren: true,
      requiresLowIncome: true,
      maxYoungestChildAgeYears: 3,
    },
    how_to_apply: ["Подайте заявление через Госуслуги, МФЦ или СоцФонд (СФР)"],
    documents: [
      "Заявление",
      "Свидетельство о рождении ребёнка",
      "Сведения о доходах семьи",
    ],
    sort_order: 100,
  },
  // ОБОГАЩЕНИЕ существующей декретной (добавлены студентки-очницы + сегмент «Студенческая семья»)
  {
    slug: "posobie-po-beremennosti-i-rodam",
    title: "Пособие по беременности и родам",
    short_description:
      "Декретные выплаты — 100% среднего заработка за каждый день отпуска по беременности и родам. Положено работающим и студенткам очной формы (в том числе на платном обучении).",
    level: "federal",
    region: null,
    category: "Выплаты и пособия",
    amount: "Минимум 124 702,20 ₽ за 140 дней, максимум 1 324 515,60 ₽ за 194 дня",
    segments: [...ALL_BIRTH, "student-family"],
    criteria: { requiresPregnancy: true },
    how_to_apply: [
      "Получите листок нетрудоспособности по беременности и родам в женской консультации",
      "Работающим — передайте его работодателю; студенткам — в учебное заведение",
      "Неработающим — подайте заявление через Госуслуги, МФЦ или СоцФонд (СФР)",
    ],
    documents: [
      "Листок нетрудоспособности по беременности и родам",
      "Заявление",
    ],
    sort_order: 10,
  },
].map((m) => ({
  ...m,
  source_url: SRC_URL,
  source_name: SRC_NAME,
  updated_at_label: "2026",
  is_published: false,
}));

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase в .env.local"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const slugs = measures.map((m) => m.slug);
  const { data: existing } = await supabase.from("measures").select("slug").in("slug", slugs);
  const had = new Set((existing ?? []).map((r) => r.slug));

  const { error } = await supabase.from("measures").upsert(measures, { onConflict: "slug" });
  if (error) { console.error("Ошибка записи: " + error.message); process.exit(1); }

  const created = slugs.filter((s) => !had.has(s)).length;
  console.log(`\n✅ Обработано: ${measures.length} (новых: ${created}, обновлено: ${measures.length - created})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
