// Москва — наполнение ядра полным содержанием.
//
// Источник: письмо Депсоцзащиты Москвы (файл «Москва.pdf») + dszn.ru/mos.ru
// (dszn.ru WebFetch читает напрямую). Суммы на 2026 сверены. Идемпотентно
// (upsert по slug). Существующая мера moskva-vyplata-molodoy-semye обогащается.
// Префикс msk-* безопасен от старого reg-%-удалятора (load-regions-auto.mjs).
//
// Запуск: node scripts/load-moskva.mjs

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

const R = "Москва";
const SRC = "Депсоцзащиты Москвы (dszn.ru / mos.ru)";
const ALL_BIRTH = ["expecting-first", "expecting-second", "expecting-third-plus"];
const APPLY = [
  "Подать заявление онлайн на mos.ru (mos.ru → Услуги) или в центре госуслуг «Мои документы».",
];

const measures = [
  // ОБОГАЩЕНИЕ существующей записи
  {
    slug: "moskva-vyplata-molodoy-semye",
    title: "Дополнительное пособие молодым семьям при рождении ребёнка («лужковские», Москва)",
    short_description:
      "Крупная единовременная выплата молодым московским семьям при рождении ребёнка. Размер растёт с очерёдностью и зависит от прожиточного минимума.",
    level: "regional", region: R, category: "Выплаты и пособия",
    amount: "126 710 ₽ за первого, 177 394 ₽ за второго, 253 420 ₽ за третьего и последующих",
    segments: ALL_BIRTH,
    criteria: { requiresChildren: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Паспорта родителей с московской регистрацией", "Свидетельство о рождении ребёнка", "Свидетельство о браке"],
    tips: [
      "Условие: оба родителя (или единственный родитель) — не старше 36 лет, есть московская регистрация.",
      "Размер кратен прожиточному минимуму: 5 ПМ за первого, 7 ПМ за второго, 10 ПМ за третьего и последующих детей.",
      "Обратиться нужно в течение 1 года со дня рождения ребёнка.",
    ],
    source_url: "https://www.mos.ru/otvet-socialnaya-podderjka/list-kak-poluchit-vyplaty-pri-rozhdenii-rebenka/",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 1,
  },
  {
    slug: "msk-edinovremennaya-pri-rozhdenii",
    title: "Единовременная компенсационная выплата при рождении ребёнка (Москва)",
    short_description:
      "Московская единовременная выплата при рождении (усыновлении) ребёнка — дополнительно к федеральному пособию. Размер зависит от очерёдности ребёнка.",
    level: "regional", region: R, category: "Выплаты и пособия",
    amount: "8 157 ₽ за первого, 21 498 ₽ за второго и последующих; 74 121 ₽ при рождении троих и более одновременно",
    segments: ALL_BIRTH,
    criteria: { requiresChildren: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Паспорт заявителя с московской регистрацией", "Свидетельство о рождении ребёнка"],
    tips: [
      "Выплачивается дополнительно к федеральному единовременному пособию при рождении (28 450,45 ₽ в 2026).",
      "При рождении одновременно троих и более детей — повышенная выплата на семью.",
      "Обратиться нужно в течение 6 месяцев со дня рождения ребёнка.",
    ],
    source_url: "https://www.mos.ru/otvet-socialnaya-podderjka/kak-oformit-edinovremennuyu-vyplatu-na-vozmeschenie-rashodov-v-svyazi-s-rozhdeniem-usynovleniem-rebenka/",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 2,
  },
  {
    slug: "msk-ezhemesyachnoe-posobie-rebenok",
    title: "Ежемесячное пособие в связи с рождением и воспитанием ребёнка (Москва)",
    short_description:
      "Основное московское ежемесячное пособие малообеспеченным семьям на ребёнка. Размер зависит от дохода семьи и считается от прожиточного минимума ребёнка.",
    level: "regional", region: R, category: "Выплаты и пособия",
    amount: "50%, 75% или 100% прожиточного минимума ребёнка (в 2026 ПМ ребёнка — 21 903 ₽)",
    segments: [...ALL_BIRTH, "single-parent"],
    criteria: { requiresChildren: true, requiresLowIncome: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Паспорт заявителя", "Свидетельства о рождении детей", "Сведения о доходах семьи"],
    tips: [
      "Базовый размер — 50% ПМ ребёнка; 75% — если при базовом размере доход остаётся ниже ПМ; 100% — если и при 75% доход ниже ПМ.",
      "Назначается семьям со среднедушевым доходом ниже прожиточного минимума.",
    ],
    source_url: "https://www.mos.ru/otvet-socialnaya-podderjka/kak-oformit-ezhemesyachnoe-posobie-v-svyazi-s-rozhdeniem-i-vospitaniem-rebenka/",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 3,
  },
  {
    slug: "msk-nabor-novorozhdennomu",
    title: "Подарок новорождённому «Наше сокровище» или выплата (Москва)",
    short_description:
      "При рождении ребёнка московские семьи получают подарочный набор «Наше сокровище» с предметами для ухода за новорождённым или равноценную денежную выплату взамен.",
    level: "regional", region: R, category: "Выплаты и пособия",
    amount: "набор «Наше сокровище» или 20 000 ₽ взамен",
    segments: ALL_BIRTH,
    criteria: { requiresChildren: true, regions: [R] },
    how_to_apply: ["Выбрать набор или выплату при регистрации рождения ребёнка (в роддоме / ЗАГС / на mos.ru)."],
    documents: ["Заявление", "Паспорт заявителя", "Свидетельство о рождении ребёнка"],
    tips: ["Набор выдают в роддоме; если он не получен, можно оформить выплату 20 000 ₽ через mos.ru."],
    source_url: "https://www.mos.ru/otvet-socialnaya-podderjka/list-kak-poluchit-vyplaty-pri-rozhdenii-rebenka/",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 4,
  },
  {
    slug: "msk-mnogodetnym-rost-zhizni",
    title: "Выплата многодетным на возмещение роста стоимости жизни (Москва)",
    short_description:
      "Ежемесячная компенсационная выплата многодетным семьям Москвы на возмещение роста стоимости жизни — на каждого ребёнка.",
    level: "regional", region: R, category: "Выплаты и пособия",
    amount: "1 782 ₽/мес на ребёнка (семьи с 3–4 детьми); 2 226 ₽/мес (семьи с 5+ детьми)",
    segments: ["expecting-third-plus"],
    criteria: { minChildren: 3, requiresChildren: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Удостоверение многодетной семьи", "Свидетельства о рождении детей"],
    tips: ["Выплата на каждого ребёнка до 18 лет (или до 23 лет при очном обучении)."],
    source_url: "https://dszn.ru/press-center/news/14024",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 5,
  },
  {
    slug: "msk-mnogodetnym-zhku",
    title: "Выплата многодетным на оплату жилья и ЖКУ (Москва)",
    short_description:
      "Ежемесячная компенсационная выплата многодетным семьям Москвы на возмещение расходов по оплате жилого помещения и коммунальных услуг.",
    level: "regional", region: R, category: "Жильё и ипотека",
    amount: "1 550 ₽/мес (семьи с 3–4 детьми); 3 098 ₽/мес (семьи с 5+ детьми)",
    segments: ["expecting-third-plus"],
    criteria: { minChildren: 3, requiresChildren: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Удостоверение многодетной семьи"],
    tips: ["Назначается на семью; размер выше для семей с пятью и более детьми."],
    source_url: "https://dszn.ru/press-center/news/14024",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 6,
  },
  {
    slug: "msk-mnogodetnym-tovary",
    title: "Выплата многодетным на товары детского ассортимента (Москва)",
    short_description:
      "Ежемесячная компенсационная выплата семьям Москвы с пятью и более детьми на приобретение детских товаров.",
    level: "regional", region: R, category: "Выплаты и пособия",
    amount: "2 672 ₽/мес на семью (5+ детей)",
    segments: ["expecting-third-plus"],
    criteria: { minChildren: 5, requiresChildren: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Удостоверение многодетной семьи"],
    tips: ["Для семей, воспитывающих пять и более несовершеннолетних детей."],
    source_url: "https://dszn.ru/press-center/news/14024",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 7,
  },
  {
    slug: "msk-mnogodetnym-telefon",
    title: "Выплата многодетным за пользование телефоном (Москва)",
    short_description:
      "Ежемесячная компенсационная выплата многодетным семьям Москвы на оплату стационарного телефона.",
    level: "regional", region: R, category: "Выплаты и пособия",
    amount: "292 ₽/мес на семью (3+ детей)",
    segments: ["expecting-third-plus"],
    criteria: { minChildren: 3, requiresChildren: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Удостоверение многодетной семьи"],
    tips: ["Назначается семьям, имеющим трёх и более детей."],
    source_url: "https://dszn.ru/press-center/news/14024",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 8,
  },
  {
    slug: "msk-mnogodetnym-odezhda",
    title: "Ежегодная выплата многодетным на школьную одежду (Москва)",
    short_description:
      "Ежегодная компенсационная выплата многодетным семьям Москвы на покупку комплекта детской одежды для посещения школьных занятий.",
    level: "regional", region: R, category: "Образование",
    amount: "14 827 ₽ в год на каждого ребёнка (6–18 лет)",
    segments: ["expecting-third-plus", "schoolchild"],
    criteria: { minChildren: 3, requiresChildren: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Удостоверение многодетной семьи"],
    tips: ["Выплачивается раз в год на каждого ребёнка-школьника 6–18 лет."],
    source_url: "https://dszn.ru/press-center/news/14024",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 9,
  },
  {
    slug: "msk-mnogodetnym-10-detey",
    title: "Выплаты семьям с 10 и более детьми (Москва)",
    short_description:
      "Дополнительные выплаты московским семьям, воспитывающим десять и более детей: ежемесячная компенсация и ежегодные выплаты ко Дню семьи и ко Дню знаний.",
    level: "regional", region: R, category: "Выплаты и пособия",
    amount: "ежемесячно 2 672 ₽; ежегодно 29 651 ₽ ко Дню семьи и 44 473 ₽ ко Дню знаний",
    segments: ["expecting-third-plus"],
    criteria: { minChildren: 10, requiresChildren: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Удостоверение многодетной семьи"],
    tips: ["Назначается семьям, воспитывающим десять и более детей; выплаты ко Дню семьи (15 мая) и ко Дню знаний (1 сентября)."],
    source_url: "https://dszn.ru/press-center/news/14024",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 10,
  },
  {
    slug: "msk-rost-stoimosti-produktov",
    title: "Выплата на возмещение роста стоимости продуктов (дети до 3 лет, Москва)",
    short_description:
      "Ежемесячная компенсационная выплата московским семьям на возмещение роста стоимости продуктов питания для ребёнка в возрасте до трёх лет.",
    level: "regional", region: R, category: "Выплаты и пособия",
    amount: "1 004 ₽/мес",
    segments: ALL_BIRTH,
    criteria: { requiresChildren: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Свидетельство о рождении ребёнка"],
    tips: ["Назначается на детей в возрасте до 3 лет."],
    source_url: "https://dszn.ru/press-center/news/14024",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 11,
  },
  {
    slug: "msk-rost-zhizni-otdelnye",
    title: "Выплата на рост стоимости жизни отдельным категориям семей (Москва)",
    short_description:
      "Ежемесячная компенсационная выплата на детей одиноких матерей, детей военнослужащих по призыву и детей, чьи родители уклоняются от уплаты алиментов.",
    level: "regional", region: R, category: "Выплаты и пособия",
    amount: "одиноким матерям 1 116 ₽ (447 ₽ без пособия); детям военнослужащих по призыву и при уклонении от алиментов — 892 ₽/мес",
    segments: ["single-parent", "svo-family"],
    criteria: { requiresChildren: true, requiresSingleParent: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Документы, подтверждающие категорию (одинокая мать / военнослужащий по призыву / уклонение от алиментов)"],
    tips: ["Одиноким матерям/отцам, получающим ежемесячное пособие на ребёнка, — 1 116 ₽; не получающим — 447 ₽."],
    source_url: "https://www.mos.ru/otvet-socialnaya-podderjka/",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 12,
  },
  {
    slug: "msk-kompensaciya-detsad",
    title: "Компенсация родительской платы за детский сад (Москва)",
    short_description:
      "Частичный возврат родительской платы за государственный детский сад семьям Москвы.",
    level: "regional", region: R, category: "Образование",
    amount: "20% на первого ребёнка, 50% на второго, 70% на третьего и последующих",
    segments: ALL_BIRTH,
    criteria: { requiresChildren: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Паспорт заявителя", "Свидетельства о рождении детей"],
    tips: ["Размер зависит от очерёдности ребёнка в семье."],
    source_url: "https://www.mos.ru/pgu2/landing/target/770000000017",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 13,
  },
  {
    slug: "msk-besplatnoe-pitanie-shkolnikov",
    title: "Бесплатное питание школьников (Москва)",
    short_description:
      "Бесплатное горячее питание для учеников московских школ: завтрак для всех 1–4 классов и двухразовое питание для детей из социально незащищённых и многодетных семей в 1–11 классах.",
    level: "regional", region: R, category: "Образование", amount: "бесплатно",
    segments: ["schoolchild", "expecting-third-plus", "single-parent", "disability"],
    criteria: { requiresChildren: true, regions: [R] },
    how_to_apply: ["Подать заявление в школе, где учится ребёнок (или через mos.ru)."],
    documents: ["Заявление", "Документ, подтверждающий льготную категорию (для двухразового питания)"],
    tips: ["Бесплатный завтрак — всем ученикам 1–4 классов; завтрак и обед — детям из многодетных и социально незащищённых семей в 1–11 классах."],
    source_url: "https://www.mos.ru/pgu2/faq/predostavlenie_pitaniya_z",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 14,
  },
  {
    slug: "msk-molochnaya-kuhnya",
    title: "Бесплатные продукты детского питания (молочная кухня, Москва)",
    short_description:
      "Бесплатное обеспечение продуктами детского питания (молочные смеси, молоко, творог, каши, пюре, соки) по заключению врача для детей первых трёх лет жизни и других льготных категорий.",
    level: "regional", region: R, category: "Здоровье", amount: "бесплатно",
    segments: [...ALL_BIRTH, "disability"],
    criteria: { requiresChildren: true, regions: [R] },
    how_to_apply: ["Получить заключение (рецепт) у участкового педиатра и оформить выдачу на молочно-раздаточном пункте."],
    documents: ["Заключение (рецепт) врача", "Полис ОМС и свидетельство о рождении ребёнка"],
    tips: ["Положено детям до 3 лет; детям из многодетных семей — до 7 лет; детям-инвалидам и детям с хроническими заболеваниями — по перечню; кормящим матерям — по заключению врача."],
    source_url: "https://dszn.ru/",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 15,
  },
  {
    slug: "msk-besplatnye-lekarstva-detyam",
    title: "Бесплатные лекарства детям (Москва)",
    short_description:
      "Дети первых трёх лет жизни (а из многодетных семей — до 6 лет) обеспечиваются лекарственными препаратами по рецептам врачей бесплатно.",
    level: "regional", region: R, category: "Здоровье", amount: "бесплатно",
    segments: [...ALL_BIRTH, "disability"],
    criteria: { requiresChildren: true, regions: [R] },
    how_to_apply: ["Получить рецепт у врача и получить препараты в льготной аптеке."],
    documents: ["Рецепт врача", "Полис ОМС и свидетельство о рождении ребёнка"],
    tips: ["Дети до 3 лет — всем; дети из многодетных семей — до 6 лет; дети-инвалиды — по федеральным и городским нормам."],
    source_url: "https://docs.cntd.ru/document/3660711",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 16,
  },
  {
    slug: "msk-adresnaya-pomoshch",
    title: "Адресная социальная помощь семьям с детьми (Москва)",
    short_description:
      "Помощь москвичам в трудной жизненной ситуации и семьям с детьми в социально опасном положении: единовременная денежная выплата, продуктовая и вещевая помощь, товары длительного пользования.",
    level: "regional", region: R, category: "Помощь и сопровождение", amount: "по решению комиссии (деньгами или натурой)",
    segments: ["single-parent", ...ALL_BIRTH],
    criteria: { requiresChildren: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Паспорт заявителя", "Документы, подтверждающие трудную жизненную ситуацию"],
    tips: ["Может предоставляться деньгами, продуктами, одеждой или техникой (электронный сертификат). Решение принимает комиссия соцзащиты."],
    source_url: "https://dszn.ru/deyatelnost/Lgoty-Adresnaya-pomoshch",
    source_name: SRC, updated_at_label: "2026", is_published: true, sort_order: 17,
  },

  // --- ЧЕРНОВИК: точный размер требует уточнения ---
  {
    slug: "msk-uhod-rebenok-invalid",
    title: "Ежемесячная выплата по уходу за ребёнком-инвалидом (Москва)",
    short_description:
      "Московская ежемесячная компенсационная выплата неработающему родителю (или иному лицу), который занят уходом за ребёнком-инвалидом.",
    level: "regional", region: R, category: "Выплаты и пособия", amount: "требует уточнения",
    segments: ["disability"],
    criteria: { requiresDisabledChild: true, regions: [R] },
    how_to_apply: APPLY,
    documents: ["Заявление", "Справка об инвалидности ребёнка", "Документы, подтверждающие отсутствие занятости ухаживающего"],
    tips: [
      "Назначается неработающему трудоспособному лицу, занятому уходом за ребёнком-инвалидом.",
      "ВНИМАНИЕ: точный размер московской выплаты на 2026 требует сверки (для приёмных/усыновлённых детей-инвалидов суммы выше — 39 856 / 40 767 ₽).",
    ],
    source_url: "https://www.mos.ru/otvet-socialnaya-podderjka/",
    source_name: SRC, updated_at_label: "требует сверки", is_published: false, sort_order: 18,
  },
];

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
  const pub = measures.filter((m) => m.is_published).length;
  console.log(`${R}: обработано ${measures.length} (создано ${created}, обновлено ${measures.length - created})`);
  console.log(`  опубликовано ${pub}, черновиков ${measures.length - pub}`);
  for (const m of measures) console.log(`  ${m.is_published ? "✓" : "✎"} ${m.slug} — ${m.amount}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
