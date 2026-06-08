// Партия 7: жилищные меры 11–36 (консолидировано). Все — черновики.
// Запуск: node scripts/load-batch-7.mjs

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

const ALL_BIRTH = ["expecting-first", "expecting-second", "expecting-third-plus"];

const base = {
  level: "federal",
  region: null,
  category: "Жильё и ипотека",
  amount: null,
  documents: [],
  tips: [],
  how_to_apply: ["Уточните условия и подайте заявление через Госуслуги, МФЦ или СоцФонд"],
  source_url: "https://www.gosuslugi.ru/",
  source_name: "Госуслуги",
  updated_at_label: "2026",
  is_published: false,
};

const measures = [
  {
    ...base,
    slug: "voennaya-ipoteka",
    title: "Военная ипотека (накопительно-ипотечная система)",
    short_description:
      "Для военнослужащих — участников НИС: государство вносит первоначальный взнос и ежемесячные ипотечные платежи в период военной службы.",
    segments: ["svo-family"],
    criteria: { requiresSvoFamily: true, requiresMortgageIntent: true },
    how_to_apply: ["Оформляется через накопительно-ипотечную систему (НИС) и банк-кредитор"],
  },
  {
    ...base,
    slug: "lgotnye-ipoteki-territorii-it",
    title: "Льготные ипотеки: новые территории и ИТ-ипотека",
    short_description: "Дополнительные программы льготной ипотеки для отдельных территорий и категорий.",
    amount: "ставка до 2–6% годовых",
    segments: ALL_BIRTH,
    criteria: { requiresMortgageIntent: true },
    tips: [
      "Льготная ипотека на новых территориях РФ, в Курской и Белгородской областях — ставка до 2% годовых.",
      "ИТ-ипотека — до 6% для сотрудников аккредитованных Минцифры ИТ-компаний (до 2030 года, кроме Москвы и Санкт-Петербурга; ставка может снижаться регионом или банком).",
    ],
  },
  {
    ...base,
    slug: "zhilishchnye-programmy-specialistov",
    title: "Жилищные программы для специалистов (земские и научные)",
    short_description:
      "Программы для специалистов на селе и в науке — выплаты можно направить на покупку жилья.",
    segments: ALL_BIRTH,
    criteria: {},
    tips: [
      "«Земский доктор» — выплата врачам и фельдшерам, переехавшим работать в сельскую местность (обычно на 5 лет); можно направить на покупку жилья.",
      "«Земский учитель» — аналогичная выплата учителям на селе.",
      "«Земский тренер» — аналогичная выплата тренерам на селе.",
      "«Молодой учёный» — социальная выплата (жилищный сертификат) научным работникам с учёной степенью, стажем от 5 лет, до 35 лет (кандидаты) / 40 лет (доктора).",
      "ЖСК с господдержкой — для работников образования, культуры, науки, здравоохранения, ОПК, госслужбы и участников СВО: бесплатный участок и снижение стоимости жилья на 10–15%.",
    ],
  },
  {
    ...base,
    slug: "zhilyo-dlya-studencheskih-semey",
    title: "Жильё для студенческих семей",
    short_description: "Студенческим семьям доступны общежития и льготная аренда жилья.",
    segments: ["student-family"],
    criteria: { requiresStudent: true },
    tips: [
      "Семейные общежития для студенческих семей — в том числе на период академического отпуска (по локальным актам вуза).",
      "Квартиры студенческим семьям в арендном доме по программе ДОМ.РФ.",
      "Субсидирование аренды жилья, если оба супруга — обучающиеся вуза (региональное законодательство).",
    ],
  },
  {
    ...base,
    slug: "uchyot-nuzhdayushchihsya-v-zhilye",
    title: "Постановка на учёт нуждающихся в жилье",
    short_description:
      "Семью могут поставить на учёт нуждающихся в жилье — при аварийном или слишком тесном жилье и низком доходе.",
    segments: ALL_BIRTH,
    criteria: {},
    how_to_apply: ["Подать заявление в орган местного самоуправления"],
    tips: [
      "Аварийное жильё — основание встать на учёт нуждающихся в новом жилье.",
      "Тесное жильё (площадь ниже региональной нормы на человека) при доходе ниже прожиточного минимума — тоже основание; норму уточняйте в «Семейном МФЦ».",
      "В отдельных регионах (Санкт-Петербург, ХМАО, Челябинская область) есть социальная аренда квартир для тех, кто зарабатывает чуть выше прожиточного минимума.",
    ],
  },
  {
    ...base,
    slug: "nalogovyy-vychet-zhilye",
    title: "Налоговый вычет при покупке жилья и по ипотеке",
    short_description:
      "Работающие могут вернуть 13% НДФЛ с расходов на покупку жилья и на проценты по ипотеке.",
    category: "Налоги и льготы",
    amount: "до 260 000 ₽ (с покупки) + до 390 000 ₽ (с процентов по ипотеке)",
    segments: ALL_BIRTH,
    criteria: {},
    how_to_apply: ["Оформить через личный кабинет ФНС или на Госуслугах"],
  },
  {
    ...base,
    slug: "zhilyo-dop-ploshchad-invalid",
    title: "Жильё с дополнительной площадью для семьи с инвалидом",
    short_description:
      "Если в семье есть инвалид с тяжёлой формой хронического заболевания (по перечню Минздрава), может быть предоставлено жильё с дополнительной площадью, на первом этаже и с повышенной доступностью.",
    segments: ["disability"],
    criteria: { requiresDisabledChild: true },
    how_to_apply: ["Встать на учёт в органе местного самоуправления с медицинскими документами"],
  },
  {
    ...base,
    slug: "subsidiya-zhku-maloimushchim-svo",
    title: "Субсидия на оплату ЖКУ малоимущим семьям и семьям участников СВО",
    short_description:
      "Компенсация части расходов на ЖКУ (не менее 30%) малообеспеченным семьям, участникам СВО и семьям погибших военнослужащих.",
    category: "Налоги и льготы",
    segments: ALL_BIRTH,
    criteria: { requiresLowIncome: true },
    how_to_apply: ["Оформить через Госуслуги, МФЦ, СоцФонд или органы соцзащиты"],
    tips: ["Размер и условия устанавливают регионы — уточняйте в своём регионе."],
  },
  {
    ...base,
    slug: "kompensaciya-zhku-deti-invalidy",
    title: "Компенсация 50% ЖКУ и капремонта семьям с детьми-инвалидами",
    short_description:
      "Семьям с детьми-инвалидами компенсируют 50% расходов на ЖКУ и 50% взноса на капитальный ремонт.",
    category: "Налоги и льготы",
    segments: ["disability"],
    criteria: { requiresDisabledChild: true },
    how_to_apply: ["Оформить возврат в МФЦ или органах соцзащиты после оплаты квитанций"],
  },
  {
    ...base,
    slug: "kompensaciya-zhku-semyi-pogibshih",
    title: "Компенсация ЖКУ семьям погибших военнослужащих и силовиков",
    short_description:
      "Компенсация расходов на жильё и коммунальные услуги членам семей погибших военнослужащих и сотрудников силовых органов.",
    category: "Налоги и льготы",
    segments: ["svo-family"],
    criteria: { requiresSvoFamily: true },
    how_to_apply: ["Оформить в МФЦ или органах соцзащиты"],
    tips: [
      "Распространяется на семьи погибших военнослужащих, сотрудников ОВД, ФСИН, Пограничной службы ФСБ, таможни и др., а также инвалидов войны и ветеранов боевых действий.",
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
  const created = slugs.filter((s) => !had.has(s)).length;
  console.log(`\n✅ Обработано: ${measures.length} (новых: ${created}, обновлено: ${measures.length - created})`);
}

main().catch((e) => { console.error(e); process.exit(1); });
