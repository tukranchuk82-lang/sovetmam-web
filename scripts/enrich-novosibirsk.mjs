// Новосибирская область — дозаполнение заглушек полным содержанием.
// Источник mtsr.nso.ru (Минтруда и соцразвития НСО) — WebFetch читает напрямую.
// Суммы на 2026 со страницы-каталога /page/2134 и отдельных страниц. Update по slug.
// Запуск: node scripts/enrich-novosibirsk.mjs

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim(); if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("="); if (i === -1) continue;
    const k = t.slice(0, i).trim(); let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

const R = "Новосибирская область";
const SRC = "Минтруда и соцразвития Новосибирской области (mtsr.nso.ru)";
const APPLY = ["Подать заявление через Госуслуги, в МФЦ или в центре соцподдержки по месту жительства."];
const DOC = ["Заявление", "Документ, удостоверяющий личность и проживание в Новосибирской области"];

const updates = [
  { slug: "reg-novosibirskaya-oblast-001",
    title: "Приобретение автомобиля для многодетных семей (Новосибирская область)",
    short_description: "Семьям, воспитывающим семь и более несовершеннолетних детей, область предоставляет автомобиль.",
    category: "Транспорт", amount: "автомобиль (натуральная помощь)",
    segments: ["expecting-third-plus"], criteria: { minChildren: 7, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Свидетельства о рождении детей"],
    tips: ["Для семей с 7 и более несовершеннолетними детьми, проживающих в области не менее 3 лет (Постановление № 322-п от 09.07.2012)."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-002",
    title: "Выплата на ремонт, строительство или приобретение жилья (5+ детей, Новосибирская область)",
    short_description: "Единовременная денежная выплата многодетным семьям с пятью и более детьми на ремонт, строительство или приобретение жилья.",
    category: "Жильё и ипотека", amount: "100 000 ₽",
    segments: ["expecting-third-plus"], criteria: { minChildren: 5, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Свидетельства о рождении детей", "Документы о расходах на жильё"],
    tips: ["Для семей с 5 и более детьми, проживающих в области не менее 3 лет."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-003",
    title: "Выплата при поступлении ребёнка из многодетной семьи в вуз (Новосибирская область)",
    short_description: "Единовременная выплата многодетным семьям при поступлении ребёнка в организацию высшего образования.",
    category: "Образование", amount: "11 000 ₽",
    segments: ["expecting-third-plus", "student-family"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Документ о поступлении ребёнка в вуз"],
    tips: ["При поступлении ребёнка из многодетной семьи в организацию высшего образования."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-004",
    title: "Выплата при поступлении ребёнка из многодетной семьи в колледж (Новосибирская область)",
    short_description: "Единовременная выплата многодетным семьям при поступлении ребёнка в профессиональную образовательную организацию (колледж/техникум).",
    category: "Образование", amount: "требует уточнения",
    segments: ["expecting-third-plus", "student-family"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Документ о поступлении ребёнка в колледж/техникум"],
    tips: ["ВНИМАНИЕ: точный размер выплаты при поступлении в ПОО (ссуз) требует уточнения (для вуза — 11 000 ₽)."], is_published: false },

  { slug: "reg-novosibirskaya-oblast-005",
    title: "Ежегодная выплата на школьно-письменные принадлежности (Новосибирская область)",
    short_description: "Ежегодная выплата многодетным семьям на школьно-письменные принадлежности на весь период обучения ребёнка в школе.",
    category: "Образование", amount: "4 000 ₽ в год",
    segments: ["expecting-third-plus", "schoolchild"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Документ, подтверждающий статус многодетной семьи"],
    tips: ["Выплачивается ежегодно на весь период обучения ребёнка в общеобразовательной организации."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-006",
    title: "Компенсация части стоимости обучения детей из многодетных семей (Новосибирская область)",
    short_description: "Многодетным семьям компенсируют часть стоимости платного обучения ребёнка по программам профессионального образования.",
    category: "Образование", amount: "20% стоимости (семьи с 3–4 детьми), 30% (5+ детей)",
    segments: ["expecting-third-plus", "student-family"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Договор на платное обучение и документы об оплате"],
    tips: ["Выплачивается ежегодно по завершении учебного года. Размер зависит от числа детей в семье."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-007",
    title: "Областной семейный капитал (Новосибирская область)",
    short_description: "Областной семейный капитал при рождении или усыновлении третьего ребёнка с 2012 года.",
    category: "Выплаты и пособия", amount: "163 141,68 ₽",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Свидетельства о рождении детей"],
    tips: ["Право возникает при рождении/усыновлении третьего ребёнка с 01.01.2012; проживание в области не менее 3 лет."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-008",
    title: "Распоряжение средствами областного семейного капитала (Новосибирская область)",
    short_description: "Направления использования областного семейного капитала: улучшение жилищных условий, образование детей, газификация и другие цели.",
    category: "Выплаты и пособия", amount: "163 141,68 ₽ (распоряжение средствами капитала)",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Сертификат на областной семейный капитал", "Документы по выбранному направлению"],
    tips: ["Направить капитал можно на жильё, образование детей, газификацию и другие установленные цели."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-009",
    title: "Ежемесячная выплата на ребёнка-инвалида (Новосибирская область)",
    short_description: "Ежемесячная региональная выплата семьям, воспитывающим ребёнка-инвалида. Назначается автоматически.",
    category: "Выплаты и пособия", amount: "518,78 ₽/мес",
    segments: ["disability"], criteria: { requiresDisabledChild: true, regions: [R] }, how_to_apply: ["Назначается беззаявительно на основе реестра инвалидов."],
    documents: ["Не требуются — выплата назначается автоматически"],
    tips: ["Предоставляется в беззаявительном порядке на основании данных федерального реестра инвалидов."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-010",
    title: "Ежемесячная выплата на ВИЧ-инфицированного ребёнка (Новосибирская область)",
    short_description: "Ежемесячная региональная выплата семьям, воспитывающим ВИЧ-инфицированного ребёнка.",
    category: "Выплаты и пособия", amount: "518,78 ₽/мес",
    segments: ["disability"], criteria: { requiresDisabledChild: true, regions: [R] }, how_to_apply: ["Назначается беззаявительно на основе межведомственного взаимодействия."],
    documents: ["Не требуются — выплата назначается автоматически"],
    tips: ["Предоставляется в беззаявительном порядке."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-011",
    title: "Ежемесячная выплата на питание детям-инвалидам с тяжёлыми заболеваниями (Новосибирская область)",
    short_description: "Ежемесячная выплата на питание детям-инвалидам с онкологическими, гематологическими и другими тяжёлыми заболеваниями (диабет, целиакия, муковисцидоз, ФКУ).",
    category: "Здоровье", amount: "951,12 ₽/мес",
    segments: ["disability"], criteria: { requiresDisabledChild: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Медицинские документы, подтверждающие заболевание ребёнка"],
    tips: ["Для детей-инвалидов с онкологией, гематологией, сахарным диабетом, целиакией, муковисцидозом, фенилкетонурией."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-012",
    title: "Ежемесячное пособие на ребёнка (Новосибирская область)",
    short_description: "Ежемесячное пособие на ребёнка семьям с доходом ниже прожиточного минимума. Для отдельных категорий размер повышен.",
    category: "Выплаты и пособия", amount: "520,24 ₽ (базовый), 780,34 ₽ (повышенный)",
    segments: ["expecting-first", "expecting-second", "expecting-third-plus", "single-parent"], criteria: { requiresChildren: true, requiresLowIncome: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Свидетельства о рождении детей", "Сведения о доходах семьи"],
    tips: ["Для семей со среднедушевым доходом не выше прожиточного минимума. Выплачивается на детей до 16 лет (до 18 — учащимся)."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-013",
    title: "Дополнительное пособие при рождении ребёнка в молодой семье (Новосибирская область)",
    short_description: "Дополнительное единовременное пособие молодым семьям при рождении ребёнка. Размер растёт с очерёдностью.",
    category: "Выплаты и пособия", amount: "6 600 ₽ (первый), 13 200 ₽ (второй), 19 800 ₽ (третий и далее)",
    segments: ["expecting-first", "expecting-second", "expecting-third-plus"], criteria: { requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Свидетельство о рождении ребёнка", "Свидетельство о браке"],
    tips: ["Условие: хотя бы один из супругов моложе 35 лет. Обращение — в течение 6 месяцев со дня рождения ребёнка."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-014",
    title: "Выплата молодым семьям на присмотр и уход за детьми (Новосибирская область)",
    short_description: "Компенсация молодым семьям и родителям-студентам расходов на присмотр и уход за детьми (детский сад).",
    category: "Образование", amount: "не более 600 ₽/мес на ребёнка",
    segments: ["expecting-first", "expecting-second", "expecting-third-plus", "student-family"], criteria: { requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Договор с детским садом", "Документы об оплате"],
    tips: ["Для молодых семей и родителей-студентов при посещении ребёнком детского сада."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-015",
    title: "Компенсация части родительской платы за детский сад (Новосибирская область)",
    short_description: "Частичный возврат родительской платы за детский сад семьям с доходом не выше 1,5 прожиточного минимума или при инвалидности ребёнка.",
    category: "Образование", amount: "20% на первого ребёнка, 50% на второго, 70% на третьего и последующих",
    segments: ["expecting-first", "expecting-second", "expecting-third-plus"], criteria: { requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Свидетельства о рождении детей", "Сведения о доходах семьи"],
    tips: ["Условие: доход семьи не выше 1,5 прожиточного минимума либо наличие инвалидности. Размер зависит от очерёдности ребёнка."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-016",
    title: "Социальная помощь малоимущим при рождении двойни или тройни (Новосибирская область)",
    short_description: "Единовременная социальная помощь малоимущим семьям при одновременном рождении двух и более детей.",
    category: "Выплаты и пособия", amount: "5 500 ₽",
    segments: ["expecting-second", "expecting-third-plus"], criteria: { requiresChildren: true, requiresLowIncome: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Свидетельства о рождении детей", "Сведения о доходах семьи"],
    tips: ["Единовременно — малоимущим семьям при одновременном рождении двух и более детей."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-017",
    title: "Выплата взамен земельного участка для ИЖС (Новосибирская область)",
    short_description: "Многодетным семьям, состоящим на учёте на бесплатный земельный участок, предоставляют денежную выплату вместо участка.",
    category: "Жильё и ипотека", amount: "313 571 ₽ (3 детей), 418 095 ₽ (4 детей), 522 619 ₽ (5+ детей)",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: ["Подать заявление в орган местного самоуправления муниципального района или городского округа."],
    documents: [...DOC, "Свидетельства о рождении детей", "Документы о целевом использовании средств"],
    tips: ["Для многодетных (3+ детей), состоящих на учёте на участок под ИЖС. Средства — на покупку земли, жильё, строительство, ремонт, подключение к сетям.",
      "С 01.01.2025 заявления принимают органы местного самоуправления."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-018",
    title: "Компенсация расходов на ЖКУ и топливо многодетным семьям (Новосибирская область)",
    short_description: "Ежемесячная компенсация многодетным семьям части расходов на коммунальные услуги и приобретение топлива.",
    category: "Жильё и ипотека", amount: "ежемесячная компенсация части расходов на ЖКУ и топливо",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Документ, подтверждающий статус многодетной семьи", "Документы о расходах на ЖКУ"],
    tips: ["Размер считается от фактических расходов по данным региональной базы (Закон НСО № 380-ОЗ от 06.12.2013)."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-019",
    title: "Компенсация расходов на газификацию жилья (Новосибирская область)",
    short_description: "Компенсация расходов на газификацию жилья льготным категориям, включая многодетные семьи, семьи с детьми-инвалидами и участников СВО.",
    category: "Жильё и ипотека", amount: "до 100 000 ₽",
    segments: ["expecting-third-plus", "disability", "svo-family"], criteria: { regions: [R] }, how_to_apply: ["Подать документы в центр социальной поддержки по месту жительства."],
    documents: [...DOC, "Выписка из ЕГРН о собственности на жильё", "Договор на газификацию, акт выполненных работ и платёжные документы"],
    tips: ["Компенсируют проектные работы, монтаж и газовое оборудование (котёл, плита, счётчик и др.). Дом должен быть в региональной программе газификации; выплата однократная.",
      "Категории: многодетные, малоимущие, семьи с детьми-инвалидами, участники СВО и их семьи и др."], is_published: true },

  { slug: "reg-novosibirskaya-oblast-020",
    title: "Выплата семьям с тремя и более детьми-инвалидами (Новосибирская область)",
    short_description: "Ежемесячная выплата семьям, воспитывающим троих и более детей-инвалидов, нуждающихся в постоянном уходе на дому.",
    category: "Выплаты и пособия", amount: "16 500 ₽/мес (на одного ребёнка-инвалида)",
    segments: ["disability", "expecting-third-plus"], criteria: { minChildren: 3, requiresDisabledChild: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...DOC, "Справки об инвалидности детей"],
    tips: ["На содержание работника по уходу за детьми-инвалидами в домашних условиях."], is_published: true },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  let pub = 0, draft = 0, missing = 0;
  for (const u of updates) {
    const { is_published, ...fields } = u;
    const { data, error } = await supabase.from("measures")
      .update({ ...fields, source_name: SRC, updated_at_label: is_published ? "2026" : "требует сверки", is_published })
      .eq("slug", u.slug).select("slug");
    if (error) { console.error(`✗ ${u.slug}: ${error.message}`); continue; }
    if (!data || !data.length) { console.warn(`? ${u.slug}: не найдена`); missing++; continue; }
    is_published ? pub++ : draft++;
    console.log(`${is_published ? "✓" : "✎"} ${u.slug} — ${u.amount}`);
  }
  console.log(`\n${R}: обновлено ${pub + draft} (опубл. ${pub}, черновиков ${draft}), не найдено ${missing}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
