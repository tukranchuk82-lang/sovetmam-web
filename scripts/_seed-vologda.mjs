// Вологодская область — меры поддержки семей с детьми (региональный бюджет).
// Источник: официальная форма субъекта (.doc, запрос Т.В. Буцкой), структура
// по сферам (соцзащита/образование/здравоохранение/культура/жильё). Общие
// ссылки-рубрики отсеяны, «пакеты» разложены, земельные строки объединены → 36 мер.
// Суммы 2024–2026 из формы. Портал: vologda-oblast.ru. Запуск: node scripts/_seed-vologda.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Вологодская область";
const SN = "Правительство Вологодской области / Департамент социальной защиты населения (vologda-oblast.ru)";
const VO = "https://vologda-oblast.ru/family/";
const U_BIRTH = VO+"posobiya-naznachaemye-pri-rozhdenii-detey/";
const U_EDU = VO+"vyplaty-svyazannye-s-obrazovaniem-detey/";
const U_MONTH = VO+"ezhemesyachnye-posobiya-na-detey/";
const U_KOM = VO+"kompensatsii-svyazannye-s-kommunalnymi-raskhodami/";
const U_SEVER = VO+"strategiya-2-0/semya-oplot-russkogo-severa/";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в отделение социальной защиты населения по месту жительства, через МФЦ или на Госуслугах"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];

const rows = [
// --- Социальная защита ---
{ ...base, slug:"vol-001",
  title:"Выплата при рождении первого ребёнка маме до 25 лет (Вологодская область)",
  short_description:"Женщине в возрасте до 25 лет при рождении первого ребёнка выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"100 000 ₽",
  segments:["expecting-first"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт матери","Свидетельство о рождении первого ребёнка"],
  tips:["Право — если на дату рождения ребёнка матери менее 25 лет."],
  source_url:U_BIRTH, source_name:SN },

{ ...base, slug:"vol-002",
  title:"Выплата при рождении третьего ребёнка в молодой семье (Вологодская область)",
  short_description:"Молодым семьям при рождении, начиная с 1 января 2025 года, третьего или последующего ребёнка выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"300 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорта родителей","Свидетельства о рождении детей"],
  tips:["Для детей, рождённых с 1 января 2025 года."],
  source_url:U_BIRTH, source_name:SN },

{ ...base, slug:"vol-003",
  title:"Выплата при рождении третьего и последующих детей (Вологодская область)",
  short_description:"При рождении или усыновлении третьего и каждого последующего ребёнка семье выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"150 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей"],
  tips:["Выплачивается на каждого третьего и последующего ребёнка."],
  source_url:VO+"edinovremennaya-vyplata-na-tretego-rebenka/", source_name:SN },

{ ...base, slug:"vol-004",
  title:"Пособие малоимущим при рождении второго и третьего ребёнка (Вологодская область)",
  short_description:"Малоимущим семьям при рождении второго или третьего ребёнка выплачивают дополнительное единовременное пособие.",
  category:"Выплаты и пособия", amount:"Дополнительное единовременное пособие",
  segments:["expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:2, requiresLowIncome:true }),
  how_to_apply:HOW, documents:DOCS,
  tips:["Для семей с доходом ниже прожиточного минимума."],
  source_url:U_BIRTH, source_name:SN },

{ ...base, slug:"vol-005",
  title:"Компенсация найма жилья молодой семье при рождении ребёнка (Вологодская область)",
  short_description:"Молодым семьям (родителям до 35 лет включительно) при рождении ребёнка компенсируют стоимость найма жилого помещения.",
  category:"Жильё и ипотека", amount:"До 20 000 ₽",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорта родителей","Свидетельство о рождении ребёнка","Договор найма жилья"],
  tips:["Для семей, где родителям не более 35 лет."],
  source_url:U_BIRTH, source_name:SN },

{ ...base, slug:"vol-006",
  title:"Пособие отцам, воспитывающим пять и более детей без матери (Вологодская область)",
  short_description:"Отцам, воспитывающим пять и более детей без матери не менее года, выплачивают единовременное пособие.",
  category:"Выплаты и пособия", amount:"Единовременное пособие",
  segments:["expecting-third-plus","single-parent"], criteria:reg({ requiresChildren:true, minChildren:5, requiresSingleParent:true }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Документы, подтверждающие воспитание детей без матери"],
  tips:["Для одиноких отцов пяти и более детей."],
  source_url:VO+"motherhood/", source_name:SN },

{ ...base, slug:"vol-007",
  title:"Пособие на рождение малоимущим женщинам без права на пособие по БиР (Вологодская область)",
  short_description:"Малоимущим женщинам, не имеющим права на пособие по беременности и родам, при рождении ребёнка выплачивают единовременное пособие.",
  category:"Выплаты и пособия", amount:"Единовременное пособие на рождение ребёнка",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:DOCS,
  tips:["Для неработающих малоимущих мам без пособия по БиР."],
  source_url:U_BIRTH, source_name:SN },

{ ...base, slug:"vol-008",
  title:"Пособие малоимущим на детей, идущих в первый класс (Вологодская область)",
  short_description:"Малоимущим семьям выплачивают единовременное пособие на детей, идущих в первый класс.",
  category:"Образование", amount:"Единовременное пособие первоклассникам",
  segments:["schoolchild"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка","Справка о зачислении в 1 класс","Сведения о доходах семьи"],
  tips:["Помощь к 1 сентября для малоимущих семей."],
  source_url:U_EDU, source_name:SN },

{ ...base, slug:"vol-009",
  title:"Пособие семьям с детьми, больными целиакией (Вологодская область)",
  short_description:"Семьям, воспитывающим детей, больных целиакией, выплачивают ежемесячное пособие (на лечебное питание).",
  category:"Здоровье", amount:"Ежемесячное пособие на лечебное питание",
  segments:["disability"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Медицинское заключение о заболевании ребёнка","Свидетельство о рождении ребёнка"],
  tips:["Помогает покрыть расходы на безглютеновое питание."],
  source_url:U_MONTH, source_name:SN },

{ ...base, slug:"vol-010",
  title:"Пособие семьям с детьми, больными фенилкетонурией (Вологодская область)",
  short_description:"Семьям, воспитывающим детей, больных фенилкетонурией, выплачивают ежемесячное пособие (на лечебное питание).",
  category:"Здоровье", amount:"Ежемесячное пособие на лечебное питание",
  segments:["disability"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Медицинское заключение о заболевании ребёнка","Свидетельство о рождении ребёнка"],
  tips:["Помогает покрыть расходы на специализированное питание."],
  source_url:U_MONTH, source_name:SN },

{ ...base, slug:"vol-011",
  title:"Пособие на ребёнка-инвалида или ВИЧ-инфицированного ребёнка (Вологодская область)",
  short_description:"Семьям, воспитывающим ребёнка-инвалида или ВИЧ-инфицированного ребёнка, выплачивают ежемесячное пособие.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие",
  segments:["disability"], criteria:reg({ requiresChildren:true, requiresDisabledChild:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка об инвалидности / медицинское заключение","Свидетельство о рождении ребёнка"],
  tips:["Назначается одному из родителей (законных представителей)."],
  source_url:U_MONTH, source_name:SN },

{ ...base, slug:"vol-012",
  title:"Компенсация ЖКУ многодетным семьям (Вологодская область)",
  short_description:"Многодетным семьям ежемесячно компенсируют часть расходов на жильё и коммунальные услуги.",
  category:"Жильё и ипотека", amount:"50 % платы за жильё и ЖКУ (в пределах норматива), 100 % за вывоз ТКО",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы на жильё","Квитанции ЖКУ"],
  tips:["Вывоз твёрдых коммунальных отходов компенсируется полностью."],
  source_url:U_KOM, source_name:SN },

{ ...base, slug:"vol-013",
  title:"Компенсация на топливо многодетным семьям (Вологодская область)",
  short_description:"Многодетным семьям, живущим в домах без центрального отопления, ежегодно выплачивают компенсацию на приобретение топлива.",
  category:"Жильё и ипотека", amount:"10 000 ₽ в год на семью",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы на жильё без центрального отопления"],
  tips:["Действует с 1 января 2024 года, если семья не получает компенсацию за отопление."],
  source_url:U_KOM, source_name:SN },

{ ...base, slug:"vol-014",
  title:"Компенсация на сжиженный газ многодетным семьям (Вологодская область)",
  short_description:"Многодетным семьям, живущим в домах без централизованного газоснабжения и без стационарных электроплит, ежегодно выплачивают компенсацию на сжиженный газ.",
  category:"Жильё и ипотека", amount:"4 100 ₽ в год на семью",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы на жильё без централизованного газоснабжения"],
  tips:["Действует с 1 января 2024 года."],
  source_url:U_KOM, source_name:SN },

{ ...base, slug:"vol-015",
  title:"Компенсация родительской платы за детский сад (Вологодская область)",
  short_description:"Родителям компенсируют часть платы за присмотр и уход за детьми в детских садах.",
  category:"Образование", amount:"20 % / 50 % / 70 % платы (на 1-го / 2-го / 3-го ребёнка)",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Подать заявление в детский сад"], documents:["Паспорт","Свидетельства о рождении детей","Договор с детским садом"],
  tips:["Размер компенсации растёт с числом детей."],
  source_url:U_EDU, source_name:SN },

{ ...base, slug:"vol-016",
  title:"Компенсация обучения детей из многодетных семей по СПО и ВО (Вологодская область)",
  short_description:"Многодетным семьям компенсируют часть стоимости платного обучения детей по программам среднего профессионального и высшего образования.",
  category:"Образование", amount:"50 % стоимости, но не более 50 000 ₽ за учебный год",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Договор об обучении","Документы об оплате обучения"],
  tips:["Касается платного обучения в колледжах и вузах."],
  source_url:"https://socium.gov35.ru/deyatelnost/zadachi-funktsii/mery-sotsialnoy-podderzhki/index.php?ELEMENT_ID=53874", source_name:SN },

{ ...base, slug:"vol-017",
  title:"Средства ухода новорождённым из семей в трудной ситуации (Вологодская область)",
  short_description:"Новорождённых детей из семей, находящихся в трудной жизненной ситуации, обеспечивают средствами ухода.",
  category:"Помощь и сопровождение", amount:"Бесплатные средства ухода за новорождённым",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:1 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка","Документы о трудной жизненной ситуации"],
  tips:["Подгузники, средства гигиены и другие принадлежности для малыша."],
  source_url:VO+"lekarstvennoe-i-inoe-obespechenie-detey/", source_name:SN },

{ ...base, slug:"vol-018",
  title:"Пункты проката вещей для новорождённых (Вологодская область)",
  short_description:"Студенческим, молодым семьям, одиноким матерям и другим нуждающимся выдают в прокат предметы первой необходимости для новорождённых (коляски, кроватки, пеленальные столики и др.).",
  category:"Помощь и сопровождение", amount:"Бесплатный прокат вещей для новорождённого",
  segments:["expecting-first","expecting-second","student-family","single-parent"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:1 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка"],
  tips:["Коляски, кроватки, пеленальные столики и другие вещи во временное пользование."],
  source_url:U_SEVER, source_name:SN },

{ ...base, slug:"vol-019",
  title:"«Социальная няня» — присмотр за детьми до 3 лет (Вологодская область)",
  short_description:"Студенческим, многодетным и иным семьям организуют кратковременный присмотр и уход за детьми до 3 лет — в организациях соцобслуживания или на дому.",
  category:"Помощь и сопровождение", amount:"Бесплатный присмотр за ребёнком",
  segments:["expecting-first","expecting-second","expecting-third-plus","student-family"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка","Документы о льготной категории"],
  tips:["Помогает родителям малышей выкроить время на дела или учёбу."],
  source_url:U_SEVER, source_name:SN },

{ ...base, slug:"vol-020",
  title:"Путёвки в лагеря детям из многодетных семей (Вологодская область)",
  short_description:"Детям из многодетных семей оплачивают стоимость путёвок в детские оздоровительные лагеря.",
  category:"Культура и отдых", amount:"Оплата стоимости путёвки",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельство о рождении ребёнка"],
  tips:["Оздоровление детей в каникулы."],
  source_url:VO+"ozdorovlenie-i-otdykh-detey/", source_name:SN },

{ ...base, slug:"vol-021",
  title:"Автомобиль многодетным семьям с 7 и более детьми (Вологодская область)",
  short_description:"Многодетные семьи, воспитывающие семь и более детей, обеспечивают автомобилями.",
  category:"Транспорт", amount:"Предоставление автомобиля",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:7 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"],
  tips:["Для больших семей — микроавтобус или легковой автомобиль."],
  source_url:VO+"predostavlenie-avtomobilnogo-transporta-mnogodetnym-semyam-vospityvayushchim-vosem-i-bolee-detey/", source_name:SN },

// --- Образование ---
{ ...base, slug:"vol-022",
  title:"Социальная поддержка детей-сирот и детей без попечения родителей (Вологодская область)",
  short_description:"Детям-сиротам, детям, оставшимся без попечения родителей, и лицам из их числа предоставляют меры социальной поддержки в сфере образования.",
  category:"Образование", amount:"Комплекс мер поддержки",
  segments:["foster-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Обратиться в орган опеки и попечительства / образовательную организацию"],
  documents:["Документы о статусе сироты / без попечения","Документы законного представителя"],
  tips:["Льготы при обучении, обеспечение, стипендии и др."],
  source_url:"https://pravo.gov35.ru/gov_piipravprosvgrazhdan/", source_name:SN },

{ ...base, slug:"vol-023",
  title:"Меры поддержки детей с ограниченными возможностями здоровья (Вологодская область)",
  short_description:"Детям с ограниченными возможностями здоровья предоставляют меры социальной поддержки в сфере образования.",
  category:"Образование", amount:"Комплекс мер поддержки",
  segments:["disability"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Обратиться в образовательную организацию"],
  documents:["Паспорт законного представителя","Заключение ПМПК","Свидетельство о рождении ребёнка"],
  tips:["Включает специальные условия обучения и обеспечение."],
  source_url:"https://pravo.gov35.ru/gov_piipravprosvgrazhdan/", source_name:SN },

{ ...base, slug:"vol-024",
  title:"Поддержка детей-инвалидов и ВИЧ-инфицированных детей при надомном обучении (Вологодская область)",
  short_description:"Детям-инвалидам и ВИЧ-инфицированным детям при обучении на дому предоставляют меры социальной поддержки.",
  category:"Образование", amount:"Комплекс мер поддержки при надомном обучении",
  segments:["disability"], criteria:reg({ requiresChildren:true, requiresDisabledChild:true }),
  how_to_apply:["Обратиться в образовательную организацию / орган управления образованием"],
  documents:["Паспорт законного представителя","Справка об инвалидности / медзаключение","Заключение об обучении на дому"],
  tips:["Для детей, обучающихся на дому по медицинским показаниям."],
  source_url:"https://pravo.gov35.ru/gov_piipravprosvgrazhdan/", source_name:SN },

{ ...base, slug:"vol-025",
  title:"Выплата на школьную и спортивную одежду (Вологодская область)",
  short_description:"Семьям выплачивают денежную выплату на приобретение комплекта одежды для школьных занятий и спортивной формы на каждого ребёнка.",
  category:"Выплаты и пособия", amount:"3 000 ₽ раз в два года на каждого ребёнка",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Выплачивается раз в два года на каждого ребёнка."],
  source_url:U_EDU, source_name:SN },

{ ...base, slug:"vol-026",
  title:"Выплата на проезд школьникам (Вологодская область)",
  short_description:"Семьям ежемесячно выплачивают денежную выплату на проезд детей на городском транспорте и автобусах пригородных и внутрирайонных маршрутов.",
  category:"Транспорт", amount:"300 ₽ в месяц",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Кроме такси; действует на городских и пригородных маршрутах."],
  source_url:U_EDU, source_name:SN },

{ ...base, slug:"vol-027",
  title:"Льготное питание обучающихся (Вологодская область)",
  short_description:"Отдельным категориям обучающихся в государственных школах предоставляют льготное питание.",
  category:"Образование", amount:"83 ₽ в день",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Подать заявление в школу"], documents:["Паспорт","Справка об обучении","Документы о льготной категории"],
  tips:["Дополняет федеральное бесплатное питание для учеников 1–4 классов."],
  source_url:U_EDU, source_name:SN },

{ ...base, slug:"vol-028",
  title:"Выплата на частный детский сад для детей 1,5–3 лет (Вологодская область)",
  short_description:"Родителям детей от 1,5 до 3 лет, посещающих частные дошкольные организации, ежемесячно выплачивают денежную выплату на оплату услуг.",
  category:"Образование", amount:"4 000 ₽ в месяц",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка","Договор с частной дошкольной организацией"],
  tips:["Для детей, посещающих частные детсады и ИП с образовательной лицензией."],
  source_url:U_EDU, source_name:SN },

{ ...base, slug:"vol-029",
  title:"«Первоклассный Вологжанин» — наборы первоклассникам (Вологодская область)",
  short_description:"Детей, идущих в первый класс школ области, обеспечивают наборами школьных принадлежностей в рамках губернаторской программы «Первоклассный Вологжанин».",
  category:"Образование", amount:"Бесплатный набор школьных принадлежностей",
  segments:["schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка","Справка о зачислении в 1 класс"],
  tips:["Ранее программа называлась «В первый раз! В первый класс!»."],
  source_url:U_EDU, source_name:SN },

// --- Здравоохранение ---
{ ...base, slug:"vol-030",
  title:"«С днём рождения, малыш!» — набор новорождённому (Вологодская область)",
  short_description:"Новорождённых детей обеспечивают набором детских принадлежностей в рамках губернаторской программы «С днём рождения, малыш!».",
  category:"Помощь и сопровождение", amount:"Бесплатный набор для новорождённого",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:1 }),
  how_to_apply:["Набор выдают в роддоме при рождении ребёнка"], documents:["Паспорт","Свидетельство о рождении ребёнка"],
  tips:["Комплект вещей первой необходимости для малыша."],
  source_url:VO+"happybirthday/", source_name:SN },

{ ...base, slug:"vol-031",
  title:"Бесплатные лекарства детям до 3 лет и детям из многодетных до 6 лет (Вологодская область)",
  short_description:"Детей первых трёх лет жизни, а также детей из многодетных семей до шести лет обеспечивают лекарствами по утверждённым перечням.",
  category:"Здоровье", amount:"Бесплатные лекарства (по перечням)",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:6 }),
  how_to_apply:["Получить рецепт у врача и обратиться в аптеку, отпускающую льготные лекарства"],
  documents:["Полис ОМС","Льготный рецепт","Свидетельство о рождении ребёнка"],
  tips:["До 3 лет — всем детям, до 6 лет — детям из многодетных семей."],
  source_url:"https://minzdrav.gov35.ru/vedomstvennaya-informatsiya/lgoty/", source_name:SN },

// --- Культура ---
{ ...base, slug:"vol-032",
  title:"Губернаторская программа «Культурный вторник» (Вологодская область)",
  short_description:"В рамках программы «Культурный вторник» жителям области доступно бесплатное или льготное посещение учреждений культуры.",
  category:"Культура и отдых", amount:"Бесплатное / льготное посещение",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Уточнить условия участия в учреждении культуры"], documents:["Документы, удостоверяющие личность"],
  tips:["Возможность культурного досуга для семей."],
  source_url:"https://cultinfo.ru/projects/kulturnyy-vtornik-project/", source_name:SN },

{ ...base, slug:"vol-033",
  title:"«Верещагинская карта» (Вологодская область)",
  short_description:"Культурно-просветительская программа «Верещагинская карта» даёт школьникам доступ к культурным мероприятиям области.",
  category:"Культура и отдых", amount:"Доступ к культурным мероприятиям по карте",
  segments:["schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Оформить «Верещагинскую карту» (по аналогии с Пушкинской картой)"], documents:["Документы, удостоверяющие личность"],
  tips:["Региональный аналог Пушкинской карты для приобщения к культуре."],
  source_url:"https://vologdatuz.ru/vereshhaginskaya-karta/", source_name:SN },

{ ...base, slug:"vol-034",
  title:"Губернаторская программа «Культура рядом» (Вологодская область)",
  short_description:"Программа «Культура рядом» приближает культурные мероприятия к жителям районов области.",
  category:"Культура и отдых", amount:"Доступ к культурным мероприятиям",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Следить за афишей мероприятий программы"], documents:["Документы, удостоверяющие личность"],
  tips:["Культурные события в шаговой доступности."],
  source_url:"https://cultinfo.ru/projects/kultura-ryadom/", source_name:SN },

// --- Жильё и имущество ---
{ ...base, slug:"vol-035",
  title:"Выплата многодетным на улучшение жилищных условий (Вологодская область)",
  short_description:"Многодетным семьям предоставляют меру социальной поддержки по улучшению жилищных условий в виде единовременной денежной выплаты.",
  category:"Жильё и ипотека", amount:"500 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы о жилищных условиях"],
  tips:["Единовременная выплата на покупку или строительство жилья."],
  source_url:"https://gosuslugi35.ru/service_cat?serviceUnionId=1213", source_name:SN },

{ ...base, slug:"vol-036",
  title:"Бесплатный земельный участок или выплата многодетным (Вологодская область)",
  short_description:"Семьям с тремя и более детьми бесплатно предоставляют земельный участок (ИЖС, садоводство, ЛПХ) либо взамен — единовременную денежную выплату.",
  category:"Жильё и ипотека", amount:"Участок бесплатно или выплата: 223 400 ₽ (ИЖС) / 122 635 ₽ (ЛПХ, садоводство)",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Встать на учёт на земельный участок в органе местного самоуправления"],
  documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"],
  tips:["Вместо участка под ИЖС можно получить 223 400 ₽, под ЛПХ/садоводство — 122 635 ₽."],
  source_url:VO+"certificate/", source_name:SN },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,58)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("ВОЛОГОДСКАЯ ОБЛАСТЬ В БАЗЕ ТЕПЕРЬ:", count);
