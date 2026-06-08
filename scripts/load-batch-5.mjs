// Партия 5: опека/приёмные семьи (МО), школьные меры (МО), академические
// стипендии (федеральные). Родственные меры консолидированы. Все — черновики.
// Запуск: node scripts/load-batch-5.mjs

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

const MO = "Московская область";
const MO_SRC = "Госуслуги Московской области / usynovite.mosreg.ru";
const USYN = "https://usynovite.mosreg.ru/parents/materialnaya-podderzhka";

const base = {
  region: null,
  amount: null,
  documents: [],
  tips: [],
  updated_at_label: "2026",
  is_published: false,
};

function moReg(extra) {
  return {
    ...base,
    level: "regional",
    region: MO,
    how_to_apply: ["Подать заявление через Госуслуги Московской области, МФЦ или органы соцзащиты МО"],
    source_name: MO_SRC,
    ...extra,
    criteria: { ...(extra.criteria ?? {}), regions: [MO] },
  };
}

const measures = [
  // --- Опека и приёмные семьи (МО), сегмент foster-family ---
  moReg({
    slug: "mo-usynovlenie-posobiya",
    title: "Пособия при усыновлении ребёнка (Московская область)",
    short_description:
      "Единовременное и ежемесячное пособия при усыновлении ребёнка из МО или жителями МО в любом регионе.",
    category: "Выплаты и пособия",
    segments: ["foster-family"],
    source_url: `${USYN}/materialnaya-podderzhka-semey-usynovlenie`,
    tips: [
      "Единовременное пособие при усыновлении ребёнка.",
      "Ежемесячное пособие при усыновлении ребёнка.",
    ],
  }),
  moReg({
    slug: "mo-opeka-vyplaty",
    title: "Выплаты опекунам и попечителям (Московская область)",
    short_description:
      "Вознаграждение опекунам и выплаты на содержание подопечных детей в Московской области.",
    category: "Выплаты и пособия",
    segments: ["foster-family"],
    source_url: `${USYN}/materialnaya-podderzhka-semey-opeka-popechitelstvo`,
    tips: [
      "Ежемесячное вознаграждение опекунам (попечителям).",
      "Ежемесячная выплата на содержание несовершеннолетних подопечных.",
      "Ежегодное денежное пособие на детей под опекой.",
      "Выплаты для подопечных — суворовцев, нахимовцев, кадетов.",
    ],
  }),
  moReg({
    slug: "mo-priemnaya-semya-vyplaty",
    title: "Выплаты приёмным семьям (Московская область)",
    short_description:
      "Вознаграждение приёмным родителям и выплаты на содержание приёмных детей в Московской области.",
    category: "Выплаты и пособия",
    segments: ["foster-family"],
    source_url: `${USYN}/materialnaya-podderzhka-semey-priemnaya-semya`,
    tips: [
      "Ежемесячное вознаграждение приёмным родителям.",
      "Ежемесячная выплата на содержание приёмных детей.",
      "Ежегодное денежное пособие на приёмных детей.",
      "Материальная помощь приёмной семье на организацию отдыха детей.",
    ],
  }),

  // --- Школьные/прочие (МО), сегмент schoolchild ---
  moReg({
    slug: "mo-pitanie-shkolnikov",
    title: "Бесплатное питание школьников льготных категорий (Московская область)",
    short_description:
      "Бесплатное питание в школах для детей из многодетных и малоимущих семей, детей-инвалидов, детей с ОВЗ и получающих пенсию по потере кормильца.",
    category: "Здоровье",
    segments: ["schoolchild"],
    source_url: "https://uslugi.mosreg.ru/services/23083",
  }),
  moReg({
    slug: "mo-otdyh-detey",
    title: "Отдых и оздоровление детей (Московская область)",
    short_description:
      "Бесплатные и льготные путёвки, компенсация стоимости путёвок и организация отдыха детей.",
    category: "Здоровье",
    segments: ["schoolchild"],
    source_url: "https://uslugi.mosreg.ru/services/932",
  }),
  moReg({
    slug: "mo-podarok-pervoklassniku",
    title: "Подарочный набор первокласснику малоимущим семьям (Московская область)",
    short_description:
      "Подарочный набор для первоклассника семьям со среднедушевым доходом ниже прожиточного минимума.",
    category: "Образование",
    segments: ["schoolchild"],
    criteria: { requiresLowIncome: true },
    source_url: "https://uslugi.mosreg.ru/services/21629",
  }),
  moReg({
    slug: "mo-vyplaty-shkolnikam-dostizheniya",
    title: "Выплаты школьникам за достижения (Московская область)",
    short_description:
      "Единовременные выплаты победителям и призёрам всероссийской олимпиады школьников и спортсменам, представлявшим МО.",
    category: "Образование",
    segments: ["schoolchild"],
    source_url: "https://mosreg.ru/",
  }),
  moReg({
    slug: "mo-deti-svo-obrazovanie",
    title: "Меры для детей участников СВО в образовании (Московская область)",
    short_description:
      "Бесплатное горячее питание, льготные путёвки, освобождение от платы за детсад и внеочередное зачисление в школу для детей участников СВО.",
    category: "Образование",
    segments: ["schoolchild", "svo-family"],
    source_url: "https://uslugi.mosreg.ru/services/23083",
  }),

  // --- Академические стипендии (федеральные), сегмент student-family ---
  {
    ...base,
    slug: "stipendii-gosudarstvennye",
    title: "Государственные стипендии студентам (ГАС, ГСС, ПГАС)",
    short_description:
      "Академическая, социальная и повышенная стипендии студентам-бюджетникам очной формы обучения.",
    level: "federal",
    category: "Образование",
    amount: "от 954 ₽ (ГАС) до 20 000 ₽ (ПГАС)",
    segments: ["student-family"],
    criteria: { requiresStudent: true },
    how_to_apply: ["Назначается вузом по результатам сессии или по документам о льготной категории"],
    source_url: "https://www.gosuslugi.ru/",
    source_name: "Закон № 273-ФЗ «Об образовании» / ваш вуз",
    tips: [
      "Государственная академическая стипендия (ГАС) — от 954 ₽, за сессии на «хорошо» и «отлично».",
      "Государственная социальная стипендия (ГСС) — от 3 340 ₽ (вузы), 1 214 ₽ (колледжи); для сирот, инвалидов I–II групп, малоимущих и др.",
      "Повышенная академическая стипендия (ПГАС) — часто 10 000–20 000 ₽, за особые достижения в учёбе, науке, спорте, творчестве.",
      "Материальная помощь — студентам в трудной жизненной ситуации (рождение ребёнка, потеря кормильца); размер устанавливает вуз.",
    ],
  },
  {
    ...base,
    slug: "stipendii-prezidentskie-imennye",
    title: "Президентские, правительственные и именные стипендии, гранты",
    short_description:
      "Стипендии и гранты студентам за выдающиеся успехи в учёбе, науке и творчестве.",
    level: "federal",
    category: "Образование",
    amount: "от 15 000 до 30 000 ₽/мес; грант — до 1 000 000 ₽",
    segments: ["student-family"],
    criteria: { requiresStudent: true },
    how_to_apply: ["Выдвигаются вузом; уточните условия отбора в вашем учебном заведении"],
    source_url: "https://www.gosuslugi.ru/",
    source_name: "Закон № 273-ФЗ «Об образовании»",
    tips: [
      "Стипендия Президента РФ — 30 000 ₽/мес (325 стипендий ежегодно), с 3 курса по приоритетным направлениям.",
      "Стипендия Правительства РФ — 20 000 ₽/мес (5 700 стипендий), за выдающиеся успехи в учёбе и науке.",
      "Именные стипендии РФ — 15 000 ₽/мес (на один год).",
      "Стипендия Президента РФ для обучения за рубежом — покрывает обучение, визу, проезд, проживание.",
      "Грант «Студенческий стартап» — до 1 000 000 ₽ на реализацию проекта.",
      "Стипендия имени Д.И. Менделеева — за достижения в химии (сумма уточняется).",
      "В вашем регионе могут быть свои стипендии (например, Стипендия Республики Карелия).",
    ],
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const slugs = measures.map((m) => m.slug);
  const { data: existing } = await supabase.from("measures").select("slug").in("slug", slugs);
  const had = new Set((existing ?? []).map((r) => r.slug));
  const { error } = await supabase.from("measures").upsert(measures, { onConflict: "slug" });
  if (error) { console.error("Ошибка записи: " + error.message); process.exit(1); }

  // Доп: у меры на одежду многодетным добавим сегмент «школьник»
  const { error: e2 } = await supabase
    .from("measures")
    .update({ segments: ["expecting-third-plus", "schoolchild"] })
    .eq("slug", "mo-vyplata-odezhda-mnogodetnym");
  if (e2) console.warn("Обновление сегментов одежды: " + e2.message);

  const created = slugs.filter((s) => !had.has(s)).length;
  console.log(`\n✅ Обработано: ${measures.length} (новых: ${created}, обновлено: ${measures.length - created})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
