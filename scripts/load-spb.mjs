// Санкт-Петербург — наполнение ядра полным содержанием (новый регион).
// Источник gu.spb.ru (портал госуслуг СПб) — WebFetch читает напрямую.
// Список — из файла «Санкт-Петербург.pdf» (письмо вице-губернатора), суммы 2026
// сверены по gu.spb.ru. Слаги spb-* (insert, idempotent upsert по slug).
// Запуск: node scripts/load-spb.mjs

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

const R = "Санкт-Петербург";
const SRC = "Правительство Санкт-Петербурга (gu.spb.ru)";
const APPLY = ["Подать заявление онлайн на gu.spb.ru, в МФЦ или в администрации района."];
const D = ["Заявление", "Документ, удостоверяющий личность и регистрацию в Санкт-Петербурге"];
const ALL = ["expecting-first", "expecting-second", "expecting-third-plus"];
let n = 0; const id = () => "spb-" + String(++n).padStart(3, "0");

const m = [
  { slug: id(), title: "Ежемесячное пособие на ребёнка от рождения до 1,5 лет (Санкт-Петербург)",
    short_description: "Ежемесячное пособие на ребёнка до 1,5 лет на товары детского ассортимента и продукты детского питания (зачисляется на карту «Детская»).",
    category: "Выплаты и пособия", amount: "5 037 ₽ (первый ребёнок), 6 499 ₽ (второй и далее); в неполных и военных семьях — 5 689 / 6 499 ₽",
    segments: ALL, criteria: { requiresChildren: true, requiresLowIncome: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельство о рождении ребёнка", "Сведения о доходах семьи"],
    tips: ["Доход семьи ниже 1,5 прожиточного минимума (кроме семей с детьми-инвалидами, ВИЧ, целиакией — им без проверки дохода).",
      "Средства — на карту «Детская», тратятся только на детские товары. Обращение — в течение 6 месяцев со дня рождения."], is_published: true },

  { slug: id(), title: "Ежемесячное пособие на ребёнка от 1,5 до 7 лет (Санкт-Петербург)",
    short_description: "Ежемесячное пособие на ребёнка от 1,5 до 7 лет на товары детского ассортимента и продукты питания.",
    category: "Выплаты и пособия", amount: "1 463 ₽ (малоимущим), 2 111 ₽ (неполные и военные семьи)",
    segments: ["expecting-second", "expecting-third-plus", "single-parent"], criteria: { requiresChildren: true, requiresLowIncome: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельство о рождении ребёнка", "Сведения о доходах семьи"],
    tips: ["Без проверки дохода — семьям с ребёнком-инвалидом, ВИЧ-инфицированным или с целиакией. Зачисляется на карту «Детская»."], is_published: true },

  { slug: id(), title: "Ежемесячное пособие на ребёнка от 7 до 16/18 лет (Санкт-Петербург)",
    short_description: "Ежемесячное пособие на ребёнка-школьника от 7 до 16 лет (или до 18 при обучении).",
    category: "Выплаты и пособия", amount: "1 358 ₽ (малоимущим), 1 963 ₽ (неполные и военные семьи)",
    segments: ["schoolchild", "single-parent", "expecting-third-plus"], criteria: { requiresChildren: true, requiresLowIncome: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельство о рождении ребёнка", "Сведения о доходах семьи"],
    tips: ["Доход семьи ниже 1,5 прожиточного минимума; для семей с детьми-инвалидами/ВИЧ/целиакией — без проверки дохода. Право подтверждается ежегодно."], is_published: true },

  { slug: id(), title: "Ежемесячное пособие на ребёнка-инвалида и ВИЧ-инфицированного ребёнка (Санкт-Петербург)",
    short_description: "Ежемесячное пособие на ребёнка-инвалида или ВИЧ-инфицированного ребёнка до 18 лет на товары детского ассортимента и специальное питание — без проверки дохода.",
    category: "Выплаты и пособия", amount: "выплачивается без проверки дохода (размер по возрасту ребёнка)",
    segments: ["disability"], criteria: { requiresDisabledChild: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Справка об инвалидности / медицинские документы ребёнка"],
    tips: ["Назначается независимо от дохода семьи. Зачисляется на карту «Детская» (детские товары, продукты и спец. питание)."], is_published: true },

  { slug: id(), title: "Пособие на ребёнка из семьи, где родители — инвалиды I/II групп (Санкт-Петербург)",
    short_description: "Ежемесячное пособие на ребёнка до 18 лет из семьи, где оба законных представителя (или единственный) являются инвалидами I и (или) II групп.",
    category: "Выплаты и пособия", amount: "выплачивается без проверки дохода",
    segments: ["disability", ...ALL], criteria: { regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Справки об инвалидности родителей", "Свидетельство о рождении ребёнка"],
    tips: ["Назначается семьям, где оба родителя (или единственный) — инвалиды I/II групп. Зачисляется на карту «Детская»."], is_published: true },

  { slug: id(), title: "Ежемесячная социальная выплата студенческим семьям (Санкт-Петербург)",
    short_description: "Крупная ежемесячная выплата студенческим семьям Санкт-Петербурга, где оба родителя учатся очно и получают первое профессиональное образование.",
    category: "Выплаты и пособия", amount: "19 746 ₽/мес",
    segments: ["student-family", ...ALL], criteria: { requiresChildren: true, requiresStudent: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Справки об очном обучении обоих родителей", "Свидетельство о рождении ребёнка"],
    tips: ["Оба родителя (или единственный) — очники до 30 лет, получают первое СПО/высшее образование, прописаны в СПб."], is_published: true },

  { slug: id(), title: "Единовременная выплата при рождении ребёнка (Санкт-Петербург)",
    short_description: "Единовременная компенсационная выплата при рождении ребёнка на приобретение предметов детского ассортимента и продуктов питания.",
    category: "Выплаты и пособия", amount: "45 258 ₽ (первый), 60 347 ₽ (второй), 75 430 ₽ (третий и последующие)",
    segments: ALL, criteria: { requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельство о рождении ребёнка"],
    tips: ["Обращение — в течение 1,5 лет со дня рождения. Средства зачисляются на карту «Детская»."], is_published: true },

  { slug: id(), title: "Выплата женщинам, родившим первого ребёнка в 19–24 года (Санкт-Петербург)",
    short_description: "Единовременная компенсационная выплата женщинам, родившим первого ребёнка в возрасте от 19 до 24 лет включительно.",
    category: "Выплаты и пособия", amount: "75 835 ₽",
    segments: ["expecting-first"], criteria: { requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельство о рождении первого ребёнка"],
    tips: ["Назначается однократно; обращение — до достижения ребёнком 1,5 лет."], is_published: true },

  { slug: id(), title: "Единовременная выплата беременной студентке (Санкт-Петербург)",
    short_description: "Единовременная выплата женщинам, вставшим на учёт по беременности до 12 недель и обучающимся очно.",
    category: "Выплаты и пособия", amount: "100 000 ₽",
    segments: ["student-family", "expecting-first"], criteria: { requiresPregnancy: true, requiresStudent: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Справка об очном обучении", "Документы о постановке на учёт по беременности"],
    tips: ["Постановка на учёт до 12 недель; очное обучение (включая академический отпуск). Обращение — после 12 недель и до родов."], is_published: true },

  { slug: id(), title: "Подарочный комплект новорождённому (Санкт-Петербург)",
    short_description: "Семьям с новорождённым ребёнком предоставляют подарочный комплект детских принадлежностей («Подарок новорождённому»).",
    category: "Выплаты и пособия", amount: "подарочный комплект (натуральная помощь)",
    segments: ALL, criteria: { requiresChildren: true, regions: [R] }, how_to_apply: ["Получить в роддоме при выписке; при неполучении — оформить через gu.spb.ru или МФЦ."],
    documents: [...D, "Свидетельство о рождении ребёнка"],
    tips: ["Комплект включает предметы ухода и одежду для новорождённого."], is_published: true },

  { slug: id(), title: "«Социальная няня» — присмотр за детьми до 3 лет (Санкт-Петербург)",
    short_description: "Бесплатный кратковременный присмотр и уход за детьми до 3 лет на дому для студенческих, многодетных, малоимущих, неполных семей и семей в трудной ситуации.",
    category: "Помощь и сопровождение", amount: "бесплатно",
    segments: ["student-family", "expecting-third-plus", "single-parent"], criteria: { requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельство о рождении ребёнка", "Документ о льготной категории"],
    tips: ["Услуга бесплатна. Для семей с детьми до 3 лет из перечисленных категорий."], is_published: true },

  { slug: id(), title: "Прокат предметов первой необходимости для детей до 2 лет (Санкт-Петербург)",
    short_description: "Бесплатный прокат предметов первой необходимости для детей до 2 лет нуждающимся семьям (коляски, кроватки и др.).",
    category: "Помощь и сопровождение", amount: "бесплатно (прокат)",
    segments: [...ALL, "single-parent", "student-family", "disability"], criteria: { requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Документ о льготной категории"],
    tips: ["Для неполных, студенческих, многодетных, малообеспеченных семей, семей с инвалидом и в трудной жизненной ситуации."], is_published: true },

  { slug: id(), title: "Материнский (семейный) капитал (Санкт-Петербург)",
    short_description: "Региональный материнский капитал при рождении или усыновлении третьего и последующих детей. Можно направить на жильё, образование, лечение, автомобиль и др.",
    category: "Выплаты и пособия", amount: "224 578,50 ₽",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельства о рождении детей"],
    tips: ["Право — при рождении/усыновлении третьего ребёнка (периоды 01.01.2012–30.06.2024 и 01.07.2024–31.12.2030).",
      "Направления: жильё (СПб и Ленобласть), образование, лечение/оздоровление ребёнка, автомобиль производства РФ, реабилитация детей-инвалидов, садовый участок. Сертификат — в первые 3 года жизни ребёнка."], is_published: true },

  { slug: id(), title: "Распоряжение средствами материнского капитала (Санкт-Петербург)",
    short_description: "Направления использования регионального материнского капитала Санкт-Петербурга: жильё, образование, лечение, автомобиль, реабилитация детей-инвалидов.",
    category: "Выплаты и пособия", amount: "224 578,50 ₽ (распоряжение средствами)",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Сертификат на материнский капитал", "Документы по выбранному направлению"],
    tips: ["Срок использования не ограничен. Можно направить на несколько целей."], is_published: true },

  { slug: id(), title: "Земельный капитал многодетным семьям (Санкт-Петербург)",
    short_description: "Денежная выплата многодетным семьям взамен предоставления земельного участка — на покупку участка для дачного строительства.",
    category: "Жильё и ипотека", amount: "497 589,53 ₽",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельства о рождении детей"],
    tips: ["Для семей с тремя и более детьми до 18 лет, состоящих на учёте на земельный участок. Средства — на покупку участка в СПб.",
      "Сумма фиксируется при выдаче сертификата и не индексируется."], is_published: true },

  { slug: id(), title: "Предоставление земельного участка для ИЖС или дачного строительства (Санкт-Петербург)",
    short_description: "Многодетным семьям Санкт-Петербурга предоставляют земельный участок для индивидуального жилищного или дачного строительства.",
    category: "Жильё и ипотека", amount: "земельный участок (натуральная мера)",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельства о рождении детей"],
    tips: ["Альтернатива — земельный капитал (денежная выплата)."], is_published: true },

  { slug: id(), title: "Ежемесячная выплата матерям пяти и более детей, получающим пенсию (Санкт-Петербург)",
    short_description: "Ежемесячная социальная выплата матерям, родившим и воспитавшим пять и более детей и получающим пенсию.",
    category: "Выплаты и пособия", amount: "4 526,65 ₽/мес",
    segments: ["expecting-third-plus"], criteria: { minChildren: 5, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельства о рождении детей", "Документ о назначении пенсии"],
    tips: ["Выплачивается независимо от дохода. Обращение — в течение 6 месяцев после возникновения права."], is_published: true },

  { slug: id(), title: "Ежегодная выплата многодетным на одежду для учёбы и спортивную форму (Санкт-Петербург)",
    short_description: "Ежегодная денежная выплата на детей из многодетных семей для обеспечения одеждой для учебных занятий и спортивной формой.",
    category: "Образование", amount: "11 017,52 ₽ (школьникам), 6 499,23 ₽ (студентам ссузов до 23 лет)",
    segments: ["expecting-third-plus", "schoolchild"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Документ, подтверждающий статус многодетной семьи"],
    tips: ["Выплачивается раз в год на каждого ребёнка; требуется ежегодное обращение."], is_published: true },

  { slug: id(), title: "Компенсация многодетным расходов на жильё и ЖКУ (Санкт-Петербург)",
    short_description: "Ежемесячная компенсация многодетным семьям части расходов на оплату жилого помещения и коммунальных услуг.",
    category: "Жильё и ипотека", amount: "компенсация части расходов (зависит от состава семьи и базовой единицы)",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Документ, подтверждающий статус многодетной семьи", "Документы об оплате ЖКУ"],
    tips: ["Предоставляется при отсутствии задолженности по ЖКУ; выплачивается ежемесячно."], is_published: true },

  { slug: id(), title: "Микроавтобус семьям с семью и более детьми (Санкт-Петербург)",
    short_description: "Семьям, воспитывающим семь и более несовершеннолетних детей, предоставляют пассажирский микроавтобус.",
    category: "Транспорт", amount: "микроавтобус (натуральная мера)",
    segments: ["expecting-third-plus"], criteria: { minChildren: 7, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельства о рождении детей"],
    tips: ["Для семей с 7 и более несовершеннолетними детьми."], is_published: true },

  { slug: id(), title: "Бесплатные путёвки на отдых и оздоровление детей (Санкт-Петербург)",
    short_description: "Оплата полной стоимости путёвок в организации отдыха и оздоровления детей и молодёжи.",
    category: "Здоровье", amount: "бесплатно (оплата полной стоимости путёвки)",
    segments: ["schoolchild", "expecting-third-plus", "disability"], criteria: { requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельство о рождении ребёнка", "Документ о льготной категории"],
    tips: ["Для льготных категорий детей; покрывается полная стоимость путёвки."], is_published: true },

  { slug: id(), title: "Замена газовых и электрических плит, газовых колонок (Санкт-Петербург)",
    short_description: "Льготным категориям семей с детьми компенсируют или производят замену газовых, электрических плит и газовых водонагревательных колонок.",
    category: "Жильё и ипотека", amount: "замена оборудования / компенсация расходов",
    segments: ["expecting-third-plus"], criteria: { regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Документы о замене оборудования"],
    tips: ["Условия и перечень получателей — на gu.spb.ru."], is_published: true },

  { slug: id(), title: "Объекты дачного фонда многодетным семьям с 5+ детьми (Санкт-Петербург)",
    short_description: "Многодетным семьям, имеющим пять и более детей до 16 лет, предоставляют объекты государственного дачного фонда.",
    category: "Жильё и ипотека", amount: "предоставление дачи (натуральная мера)",
    segments: ["expecting-third-plus"], criteria: { minChildren: 5, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Свидетельства о рождении детей"],
    tips: ["Для семей с 5 и более детьми до 16 лет."], is_published: true },

  { slug: id(), title: "Компенсация 50% стоимости обучения ребёнка из многодетной семьи (Санкт-Петербург)",
    short_description: "Компенсация половины стоимости платного очного обучения одного из детей из многодетной семьи в колледже или вузе СПб.",
    category: "Образование", amount: "50% стоимости обучения",
    segments: ["expecting-third-plus", "student-family"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Договор на платное обучение и документы об оплате"],
    tips: ["Для одного ребёнка из многодетной семьи (до 18 лет или 18–23 при самостоятельном обращении), очно, в организациях в ведении СПб."], is_published: true },

  { slug: id(), title: "Погашение ипотеки многодетным семьям до 550 тыс. ₽ (Санкт-Петербург)",
    short_description: "Дополнительное к федеральной выплате (450 000 ₽) погашение ипотечного кредита многодетным семьям — до 550 000 ₽ оставшейся задолженности.",
    category: "Жильё и ипотека", amount: "до 550 000 ₽ (сверх федеральных 450 000 ₽)",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, requiresMortgageIntent: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Кредитный договор", "Документ, подтверждающий статус многодетной семьи"],
    tips: ["Погашается задолженность, оставшаяся после федеральной выплаты 450 000 ₽, но не более 550 000 ₽."], is_published: true },

  { slug: id(), title: "Бесплатный проезд детям из многодетных семей (Санкт-Петербург)",
    short_description: "Дети из многодетных семей до 18 лет (и до 23 при очном обучении) ездят бесплатно на наземном городском транспорте и в метро.",
    category: "Транспорт", amount: "бесплатно",
    segments: ["expecting-third-plus", "schoolchild"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Документ, подтверждающий статус многодетной семьи"],
    tips: ["По льготному проездному документу. До 18 лет, либо до 23 при очном обучении."], is_published: true },

  { slug: id(), title: "Льготный проезд на пригородных поездах многодетным (Санкт-Петербург)",
    short_description: "Члены многодетных семей с 27 апреля по 31 октября ездят на пригородных электричках со скидкой за счёт бюджета города.",
    category: "Транспорт", amount: "оплата 10% стоимости билета (90% — за счёт бюджета)",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Документ, подтверждающий статус многодетной семьи"],
    tips: ["Действует в дачный сезон (27 апреля — 31 октября)."], is_published: true },

  { slug: id(), title: "Бесплатное посещение музеев и парков для многодетных (Санкт-Петербург)",
    short_description: "Члены многодетных семей бесплатно посещают музеи, парки культуры и отдыха и выставки в ведении органов власти Санкт-Петербурга.",
    category: "Культура и отдых", amount: "бесплатно",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: ["Предъявить документ, подтверждающий статус многодетной семьи, на входе."],
    documents: ["Документ, подтверждающий статус многодетной семьи"],
    tips: ["Для городских музеев, парков культуры и отдыха и выставок."], is_published: true },

  { slug: id(), title: "Бесплатное питание детей в образовательных учреждениях (Санкт-Петербург)",
    short_description: "Бесплатное (или льготное) питание детей льготных категорий в государственных школах и колледжах Санкт-Петербурга.",
    category: "Образование", amount: "бесплатно",
    segments: ["schoolchild", "expecting-third-plus", "single-parent", "disability"], criteria: { requiresChildren: true, regions: [R] }, how_to_apply: ["Подать заявление в образовательной организации."],
    documents: ["Заявление", "Документ, подтверждающий льготную категорию"],
    tips: ["Для детей из многодетных, малоимущих семей, детей с инвалидностью и других льготных категорий."], is_published: true },

  { slug: id(), title: "Бесплатные лекарства детям (Санкт-Петербург)",
    short_description: "Бесплатное обеспечение лекарствами и медизделиями детей первых трёх лет жизни, а также детей из многодетных семей до 6 лет.",
    category: "Здоровье", amount: "бесплатно",
    segments: [...ALL, "disability"], criteria: { requiresChildren: true, regions: [R] }, how_to_apply: ["Получить рецепт у врача и препараты в аптеке."],
    documents: ["Рецепт врача", "Полис ОМС и свидетельство о рождении ребёнка"],
    tips: ["Дети до 3 лет — всем; дети из многодетных семей — до 6 лет."], is_published: true },

  { slug: id(), title: "Парковочное разрешение многодетной семьи (Санкт-Петербург)",
    short_description: "Многодетные семьи Санкт-Петербурга могут оформить парковочное разрешение, дающее льготы при пользовании платными городскими парковками.",
    category: "Транспорт", amount: "льготная парковка (по разрешению)",
    segments: ["expecting-third-plus"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Документ, подтверждающий статус многодетной семьи", "Документы на автомобиль"],
    tips: ["Разрешение вносится в реестр; даёт льготы на платных парковках города."], is_published: true },

  // --- ЧЕРНОВИКИ: размер не подтверждён ---
  { slug: id(), title: "Ежегодная выплата на ребёнка с целиакией (Санкт-Петербург)",
    short_description: "Ежегодная компенсационная выплата на ребёнка, страдающего заболеванием целиакия, в Санкт-Петербурге.",
    category: "Здоровье", amount: "требует уточнения",
    segments: ["disability"], criteria: { requiresDisabledChild: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Медицинское заключение о заболевании целиакией"],
    tips: ["ВНИМАНИЕ: точный размер ежегодной выплаты требует уточнения по gu.spb.ru."], is_published: false },

  { slug: id(), title: "Выплата на рост стоимости жизни детям из многодетных семей по потере кормильца (Санкт-Петербург)",
    short_description: "Ежемесячная компенсационная выплата на возмещение роста стоимости жизни детям из многодетных семей, получающим пенсию по случаю потери кормильца.",
    category: "Выплаты и пособия", amount: "требует уточнения",
    segments: ["expecting-third-plus", "single-parent"], criteria: { minChildren: 3, requiresChildren: true, regions: [R] }, how_to_apply: APPLY,
    documents: [...D, "Документ о назначении пенсии по случаю потери кормильца"],
    tips: ["ВНИМАНИЕ: точный размер выплаты требует уточнения по gu.spb.ru."], is_published: false },
];

const measures = m.map((x, i) => ({ ...x, level: "regional", region: R, source_url: "https://gu.spb.ru/", source_name: SRC, updated_at_label: x.is_published ? "2026" : "требует сверки", sort_order: i + 1 }));

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const slugs = measures.map((x) => x.slug);
  const { data: ex } = await supabase.from("measures").select("slug").in("slug", slugs);
  const had = new Set((ex ?? []).map((r) => r.slug));
  const { error } = await supabase.from("measures").upsert(measures, { onConflict: "slug" });
  if (error) { console.error("Ошибка: " + error.message); process.exit(1); }
  const pub = measures.filter((x) => x.is_published).length;
  console.log(`${R}: ${measures.length} мер (создано ${slugs.filter((s) => !had.has(s)).length}), опубл. ${pub}, черновиков ${measures.length - pub}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
