// Ивановская область — меры поддержки семей с детьми (региональный бюджет).
// Источник: официальное письмо директора Департамента соцзащиты А.Ю. Деминой
// (pdf, на имя Т.В. Буцкой) + приложение на 7 листов. Крупный блок мер для
// семей СВО. Близкие меры объединены → 44 меры. Порталы: szn.ivanovoobl.ru,
// семья37.рф, ivanovoobl.ru/region/support (СВО). Запуск: node scripts/_seed-ivanovo.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Ивановская область";
const SN = "Департамент социальной защиты населения Ивановской области (szn.ivanovoobl.ru)";
const SN_GOV = "Правительство Ивановской области (ivanovoobl.ru)";
const SZN = "https://szn.ivanovoobl.ru/informatsiya-dlya-naseleniya/vyplaty-i-posobiya/";
const SVO = "https://ivanovoobl.ru/region/support";
const DSA_IPO = "https://dsa.ivanovoobl.ru/deyatelnost/osnovnye-napravleniya-deyatelnosti/realizatsiya-zhilishchnykh-programm/podprogramma-gosudarstvennaya-podderzhka-grazhdan-v-sfere-ipotechnogo-zhilishchnogo-kreditovaniya/";
const DSA_MOL = "https://dsa.ivanovoobl.ru/deyatelnost/osnovnye-napravleniya-deyatelnosti/realizatsiya-zhilishchnykh-programm/realizatsiya-podprogrammy-obespechenie-zhilem-molodykh-semey/";
const ZAN = "https://zan.ivanovoobl.ru/pravovye-akty/komiteta/Приказ_комитета_n8_03_04_2024.pdf";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в отдел социальной защиты населения по месту жительства, через МФЦ или на Госуслугах"];
const HOW_SVO = ["Оформить через координатора помощи участникам СВО, фонд «Защитники Отечества» или орган социальной защиты"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];
const DOCS_SVO = ["Паспорт","Документы, подтверждающие статус участника СВО / члена его семьи","Свидетельство о рождении ребёнка"];

const rows = [
// --- Общие меры ---
{ ...base, slug:"ivn-001", title:"Выплата на питание беременным женщинам (Ивановская область)",
  short_description:"Беременным женщинам ежемесячно выплачивают денежную выплату на полноценное питание.",
  category:"Здоровье", amount:"Ежемесячная выплата на питание",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresPregnancy:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка о беременности","Заключение врача"],
  tips:["По медицинскому заключению."], source_url:"https://семья37.рф/page19", source_name:SN },

{ ...base, slug:"ivn-002", title:"Выплата беременной студентке очной формы (Ивановская область)",
  short_description:"Беременной женщине, обучающейся очно, выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата",
  segments:["expecting-first","student-family"], criteria:reg({ requiresPregnancy:true, requiresStudent:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка о беременности","Справка об очном обучении"],
  tips:["Поддержка будущих мам-студенток."], source_url:"https://семья37.рф/page19", source_name:SN },

{ ...base, slug:"ivn-003", title:"Выплата на питание кормящим матерям (Ивановская область)",
  short_description:"Кормящим матерям ежемесячно выплачивают денежную выплату на полноценное питание.",
  category:"Здоровье", amount:"Ежемесячная выплата на питание",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:1 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка","Заключение врача"],
  tips:["По медицинскому заключению, в период кормления."], source_url:"https://семья37.рф/page13", source_name:SN },

{ ...base, slug:"ivn-004", title:"Пособие на ребёнка (Ивановская область)",
  short_description:"Малообеспеченным семьям выплачивают ежемесячное пособие на ребёнка.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие (при доходе ниже прожиточного минимума)",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:DOCS, tips:["При доходе семьи ниже прожиточного минимума."],
  source_url:"https://семья37.рф/page13", source_name:SN },

{ ...base, slug:"ivn-005", title:"Выплата по уходу за первым ребёнком до 1,5 лет (Ивановская область)",
  short_description:"Семьям ежемесячно выплачивают выплату по уходу за первым ребёнком до достижения им полутора лет.",
  category:"Выплаты и пособия", amount:"Ежемесячная выплата на ребёнка до 1,5 лет",
  segments:["expecting-first"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:1 }),
  how_to_apply:HOW, documents:DOCS, tips:["На первого ребёнка до 1,5 лет."],
  source_url:"https://семья37.рф/page13", source_name:SN },

{ ...base, slug:"ivn-006", title:"Выплата на улучшение жилья при рождении ребёнка (Ивановская область)",
  short_description:"Единовременную выплату на улучшение жилищных условий дают при рождении первого ребёнка у матери до 24 лет и при рождении второго ребёнка в течение 3 лет с даты рождения первого.",
  category:"Жильё и ипотека", amount:"Единовременная выплата на улучшение жилищных условий",
  segments:["expecting-first","expecting-second"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Документы о жилищных условиях"],
  tips:["Условие по возрасту мамы (до 24 лет) и срокам между рождениями."],
  source_url:"https://семья37.рф/page13", source_name:SN },

{ ...base, slug:"ivn-007", title:"Региональный студенческий (материнский) капитал (Ивановская область)",
  short_description:"Студенческим семьям при рождении ребёнка предоставляют региональный студенческий (материнский) капитал.",
  category:"Выплаты и пособия", amount:"Региональный студенческий капитал",
  segments:["student-family","expecting-first","expecting-second"], criteria:reg({ requiresChildren:true, requiresStudent:true }),
  how_to_apply:HOW, documents:["Паспорта родителей","Справки об обучении","Свидетельство о рождении ребёнка"],
  tips:["Отдельный капитал для студенческих семей."], source_url:"https://семья37.рф/page13", source_name:SN },

{ ...base, slug:"ivn-008", title:"Региональный материнский (семейный) капитал (Ивановская область)",
  short_description:"При рождении второго и последующих детей семья получает региональный материнский капитал.",
  category:"Выплаты и пособия", amount:"Региональный материнский капитал",
  segments:["expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:2 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей"],
  tips:["Дополняет федеральный материнский капитал."], source_url:"https://семья37.рф/page3", source_name:SN },

{ ...base, slug:"ivn-009", title:"Выплата при рождении третьего ребёнка в молодой семье (Ивановская область)",
  short_description:"Молодым семьям, проживающим в области, при рождении третьего или последующего ребёнка выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата молодой семье",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорта родителей","Свидетельства о рождении детей"],
  tips:["Для молодых семей при рождении 3-го и последующих детей."], source_url:"https://семья37.рф/page3", source_name:SN },

{ ...base, slug:"ivn-010", title:"Компенсация найма жилья молодой семье с детьми (Ивановская область)",
  short_description:"Молодым семьям с детьми компенсируют стоимость найма жилого помещения.",
  category:"Жильё и ипотека", amount:"Компенсация стоимости найма жилья",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорта родителей","Свидетельство о рождении ребёнка","Договор найма жилья"],
  tips:["Помогает молодым семьям, снимающим жильё."], source_url:"https://семья37.рф/page37", source_name:SN },

{ ...base, slug:"ivn-011", title:"Субсидия на газовое оборудование (Ивановская область)",
  short_description:"Отдельным категориям семей предоставляют субсидию на покупку и установку газового оборудования.",
  category:"Жильё и ипотека", amount:"Субсидия на газовое оборудование",
  segments:["expecting-third-plus","single-parent","disability"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о льготной категории","Документы на домовладение"],
  tips:["На покупку и установку газового оборудования при догазификации."],
  source_url:"https://szn.ivanovoobl.ru/upload/medialibrary/3f1/5bhvhuomnv6jl0zq62t1idtaascdxfnj/", source_name:SN },

{ ...base, slug:"ivn-012", title:"Земельный участок или выплата многодетным семьям (Ивановская область)",
  short_description:"Семьям с тремя и более детьми бесплатно предоставляют земельный участок в собственность либо единовременную выплату на приобретение участка для ИЖС или ЛПХ.",
  category:"Жильё и ипотека", amount:"Участок бесплатно или выплата на его приобретение",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"],
  tips:["Можно получить участок или деньги на его покупку."],
  source_url:"https://szn.ivanovoobl.ru/informatsiya-dlya-naseleniya/zemelnye-uchastki-dlya-mnogodetnykh-semey/zayavlenie-v-elektronnom-vide/", source_name:SN },

{ ...base, slug:"ivn-013", title:"Компенсация ЖКУ и топлива многодетным семьям (Ивановская область)",
  short_description:"Многодетным семьям компенсируют расходы на оплату жилья, коммунальных услуг и топлива.",
  category:"Жильё и ипотека", amount:"Компенсация расходов на ЖКУ и топливо",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Квитанции ЖКУ"],
  tips:["Включает и компенсацию расходов на топливо."], source_url:"https://семья37.рф/page3", source_name:SN },

{ ...base, slug:"ivn-014", title:"Компенсация обучения детей из многодетных семей (Ивановская область)",
  short_description:"Многодетным семьям компенсируют стоимость обучения детей в колледжах и вузах.",
  category:"Образование", amount:"Компенсация стоимости обучения (СПО и ВО)",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Договор об обучении","Документы об оплате"],
  tips:["Для платного обучения в СПО и вузах."], source_url:"https://семья37.рф/page3", source_name:SN },

{ ...base, slug:"ivn-015", title:"Бесплатные лекарства детям до 6 лет (Ивановская область)",
  short_description:"Детей в возрасте до 6 лет бесплатно обеспечивают лекарствами по рецептам.",
  category:"Здоровье", amount:"Бесплатные лекарства по рецепту (дети до 6 лет)",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:6 }),
  how_to_apply:["Получить рецепт у врача и обратиться в аптеку, отпускающую льготные лекарства"],
  documents:["Полис ОМС","Льготный рецепт","Свидетельство о рождении ребёнка"],
  tips:["Для всех детей до 6 лет по рецептам врачей."], source_url:"https://семья37.рф/page3", source_name:SN },

{ ...base, slug:"ivn-016", title:"Социальный контракт (Ивановская область)",
  short_description:"Малообеспеченным семьям оказывают государственную социальную помощь по социальному контракту.",
  category:"Работа и занятость", amount:"Выплаты по социальному контракту (по направлению)",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Сведения о доходах семьи","Документы по программе"],
  tips:["Направления: работа, обучение, ИП/самозанятость, ЛПХ."], source_url:SZN, source_name:SN },

{ ...base, slug:"ivn-017", title:"Путёвки в лагеря для детей 6–15 лет (Ивановская область)",
  short_description:"Детям в возрасте от 6 до 15 лет включительно предоставляют путёвки в организации отдыха и оздоровления области.",
  category:"Культура и отдых", amount:"Путёвка на отдых и оздоровление",
  segments:["schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт родителя","Свидетельство о рождении ребёнка"],
  tips:["Для детей 6–15 лет включительно."], source_url:"https://szn.ivanovoobl.ru/informatsiya-dlya-naseleniya/otdykh-detey-i-ikh-ozdorovlenie/", source_name:SN },

{ ...base, slug:"ivn-018", title:"Первоочередной приём в детский сад многодетным (Ивановская область)",
  short_description:"Детей из многодетных семей принимают в детские сады в первоочередном порядке.",
  category:"Образование", amount:"Первоочередное зачисление в детский сад",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Указать льготу при подаче заявления в детский сад"], documents:["Паспорт","Удостоверение многодетной семьи","Свидетельство о рождении ребёнка"],
  tips:["Приоритет при зачислении в детский сад."], source_url:"https://семья37.рф/page3", source_name:SN },

{ ...base, slug:"ivn-019", title:"Освобождение от платы за детский сад многодетным (Ивановская область)",
  short_description:"Многодетные семьи освобождают от родительской платы за присмотр и уход за детьми в детских садах.",
  category:"Образование", amount:"Бесплатный детский сад",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Подать заявление в детский сад"], documents:["Паспорт","Удостоверение многодетной семьи","Договор с детским садом"],
  tips:["Полное освобождение от платы за детсад."], source_url:"https://семья37.рф/page3", source_name:SN },

{ ...base, slug:"ivn-020", title:"Бесплатное горячее питание для 5–11 классов и СПО (Ивановская область)",
  short_description:"Обучающимся 5–11 классов и очникам колледжей области один раз в день предоставляют бесплатное горячее питание.",
  category:"Образование", amount:"Бесплатное горячее питание (1 раз в день)",
  segments:["schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Подать заявление в образовательную организацию"], documents:["Паспорт","Справка об обучении"],
  tips:["Дополняет федеральное бесплатное питание для 1–4 классов."], source_url:"https://семья37.рф/page3", source_name:SN },

// --- Занятость и культура ---
{ ...base, slug:"ivn-021", title:"Помощь на открытие своего дела многодетным родителям (Ивановская область)",
  short_description:"Многодетным родителям, зарегистрированным как ищущие работу, при регистрации ИП, юрлица, КФХ или самозанятости оказывают единовременную финансовую помощь.",
  category:"Работа и занятость", amount:"Единовременная финансовая помощь на старт бизнеса",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Обратиться в центр занятости населения области"], documents:["Паспорт","Удостоверение многодетной семьи","Бизнес-план"],
  tips:["Для регистрации ИП, юрлица, КФХ или самозанятости."], source_url:ZAN, source_name:SN_GOV },

{ ...base, slug:"ivn-022", title:"Профобучение многодетных родителей (Ивановская область)",
  short_description:"Многодетным родителям, ищущим работу, предоставляют профессиональное обучение и дополнительное профессиональное образование.",
  category:"Работа и занятость", amount:"Бесплатное обучение",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Обратиться в центр занятости населения области"], documents:["Паспорт","Удостоверение многодетной семьи"],
  tips:["Помогает освоить новую профессию для трудоустройства."], source_url:ZAN, source_name:SN_GOV },

{ ...base, slug:"ivn-023", title:"Временное трудоустройство подростков 14–18 лет (Ивановская область)",
  short_description:"Несовершеннолетним 14–18 лет организуют временное трудоустройство в свободное от учёбы время.",
  category:"Работа и занятость", amount:"Оплачиваемая временная работа",
  segments:["schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Обратиться в центр занятости населения области"], documents:["Паспорт подростка","СНИЛС","Согласие родителя (для 14–15 лет)"],
  tips:["Подработка школьникам на каникулах."], source_url:"https://zan.ivanovoobl.ru/deyatelnost/osnovnye-napravleniya-deyatelnosti/vremennaya-zanyatost/", source_name:SN_GOV },

{ ...base, slug:"ivn-024", title:"«Театр для многодетных семей» (Ивановская область)",
  short_description:"Члены многодетных семей бесплатно посещают театры области в рамках проекта «Театр для многодетных семей».",
  category:"Культура и отдых", amount:"Бесплатно",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Уточнить условия в театре / удостоверение многодетной семьи"], documents:["Удостоверение многодетной семьи"],
  tips:["Семейный культурный досуг без затрат."], source_url:"https://dkt.ivanovoobl.ru/novosti-i-meropriyatiya/proekt-teatr-dlya-mnogodetnykh-semey/", source_name:SN_GOV },

{ ...base, slug:"ivn-025", title:"Бесплатное посещение музеев многодетными (Ивановская область)",
  short_description:"Члены многодетных семей бесплатно посещают музеи области.",
  category:"Культура и отдых", amount:"Бесплатно",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Предъявить удостоверение многодетной семьи в кассе музея"], documents:["Удостоверение многодетной семьи"],
  tips:["Возможность семейного досуга без затрат."], source_url:"https://ivanovoobl.ru/?type=news&id=64589", source_name:SN_GOV },

{ ...base, slug:"ivn-026", title:"Льготное посещение филармонии (Ивановская область)",
  short_description:"Семьям с детьми предоставляют льготное посещение Ивановской государственной филармонии.",
  category:"Культура и отдых", amount:"Льготные билеты",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Уточнить льготы в кассе филармонии"], documents:["Документы, подтверждающие льготную категорию"],
  tips:["Скидки на концерты филармонии."], source_url:"https://ivfilarmonia.ru/", source_name:SN_GOV },

{ ...base, slug:"ivn-027", title:"Бесплатный зоопарк детям из многодетных семей (Ивановская область)",
  short_description:"Дети из многодетных семей бесплатно посещают Ивановский зоопарк.",
  category:"Культура и отдых", amount:"Бесплатно",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Предъявить удостоверение многодетной семьи в кассе зоопарка"], documents:["Удостоверение многодетной семьи"],
  tips:["Бесплатное посещение зоопарка для детей."], source_url:"https://ivzoopark.ru/informaciya-dlya-posetiteley", source_name:SN_GOV },

{ ...base, slug:"ivn-028", title:"Бесплатный проезд детям из многодетных семей и сиротам (Ивановская область)",
  short_description:"Детям из многодетных семей, а также детям-сиротам и детям без попечения родителей предоставляют бесплатный проезд на автомобильном и городском электрическом транспорте.",
  category:"Транспорт", amount:"Бесплатный проезд",
  segments:["schoolchild","expecting-third-plus","foster-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи / документы о статусе сироты","Справка об обучении"],
  tips:["На межмуниципальных и муниципальных маршрутах."], source_url:"https://семья37.рф/page3", source_name:SN },

{ ...base, slug:"ivn-029", title:"Льготный проезд детям-инвалидам (Ивановская область)",
  short_description:"Детям-инвалидам предоставляют льготный проезд на автомобильном и городском электрическом транспорте.",
  category:"Транспорт", amount:"Льготный проезд",
  segments:["disability"], criteria:reg({ requiresChildren:true, requiresDisabledChild:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка об инвалидности ребёнка"],
  tips:["На межмуниципальных и муниципальных маршрутах."], source_url:"https://семья37.рф/page21", source_name:SN },

{ ...base, slug:"ivn-030", title:"Субсидия на ипотеку семьям (Ивановская область)",
  short_description:"Гражданам предоставляют субсидию на оплату первоначального взноса по ипотеке или на погашение основного долга и процентов.",
  category:"Жильё и ипотека", amount:"Субсидия на первоначальный взнос или погашение ипотеки",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, requiresMortgageIntent:true }),
  how_to_apply:HOW, documents:["Паспорт","Ипотечный договор","Документы о нуждаемости в жилье"],
  tips:["В рамках госпрограммы обеспечения жильём."], source_url:DSA_IPO, source_name:SN_GOV },

{ ...base, slug:"ivn-031", title:"Социальная выплата молодым семьям на жильё (Ивановская область)",
  short_description:"Молодым семьям предоставляют социальную выплату на приобретение или строительство жилья.",
  category:"Жильё и ипотека", amount:"Социальная выплата на жильё",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Встать в очередь по программе «Обеспечение жильём молодых семей»"], documents:["Паспорта супругов","Свидетельства о рождении детей","Документы о нуждаемости"],
  tips:["Можно направить на первоначальный взнос по ипотеке."], source_url:DSA_MOL, source_name:SN_GOV },

// --- Семьи участников СВО ---
{ ...base, slug:"ivn-032", title:"Выплата 30 000 ₽ детям участников СВО при поступлении в вуз/ссуз (Ивановская область)",
  short_description:"Детям, пасынкам и падчерицам участников СВО, поступившим на обучение по программам высшего или среднего специального образования, выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"30 000 ₽",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Для поступивших на бакалавриат, специалитет или в колледж."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-033", title:"Первоочередные путёвки детям из семей СВО (Ивановская область)",
  short_description:"Детям 6–15 лет из семей участников СВО в первоочередном порядке предоставляют путёвки в лагеря отдыха и оздоровления области.",
  category:"Культура и отдых", amount:"Первоочередная путёвка",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Для детей 6–15 лет из семей участников СВО."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-034", title:"Присмотр за детьми и соцуслуги семьям участников СВО (Ивановская область)",
  short_description:"Супругам участников СВО предоставляют кратковременный присмотр за детьми до 7 лет (до 2 раз в неделю), а нуждающимся родителям участников СВО — социальные услуги на дому.",
  category:"Помощь и сопровождение", amount:"Бесплатный присмотр за детьми и соцуслуги на дому",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Присмотр — до 180 минут за одно посещение, до 2 раз в неделю."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-035", title:"Первоочередное зачисление в детсады и школы детям участников СВО (Ивановская область)",
  short_description:"Детей участников СВО зачисляют в детские сады и школы в первоочередном порядке; для учащихся 1–6 классов также бесплатна группа продлённого дня.",
  category:"Образование", amount:"Первоочередное зачисление + бесплатная продлёнка (1–6 классы)",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Продлёнка бесплатна для 1–6 классов, в том числе в случае гибели участника СВО."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-036", title:"Бесплатное питание 5–11 классов детям участников СВО (Ивановская область)",
  short_description:"Детям участников СВО, обучающимся в 5–11 классах, один раз в день предоставляют бесплатное горячее питание.",
  category:"Образование", amount:"Бесплатное горячее питание",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Дополняет федеральное питание для 1–4 классов."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-037", title:"Освобождение от платы за детский сад детям участников СВО (Ивановская область)",
  short_description:"Детей участников СВО освобождают от родительской платы за присмотр и уход в детском саду.",
  category:"Образование", amount:"Бесплатный детский сад",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Полное освобождение от платы за детсад."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-038", title:"Образовательные сертификаты на вуз детям участников СВО (Ивановская область)",
  short_description:"Детям участников СВО предоставляют образовательные сертификаты, гарантирующие оплату обучения в вузах области при непоступлении на бюджет.",
  category:"Образование", amount:"Сертификат на оплату обучения в вузе",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Действует при непоступлении на бюджетные места."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-039", title:"Бесплатное профобучение участникам СВО и их семьям (Ивановская область)",
  short_description:"Участник СВО и члены его семьи, ищущие работу, бесплатно получают дополнительное профессиональное образование (обучение).",
  category:"Работа и занятость", amount:"Бесплатное обучение",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true }),
  how_to_apply:["Обратиться в центр занятости населения области"], documents:DOCS_SVO, tips:["Для трудоустройства участников СВО и членов их семей."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-040", title:"Абонемент на театры и концерты семьям участников СВО (Ивановская область)",
  short_description:"Семьям участников СВО предоставляют абонемент на 5 бесплатных посещений театрально-концертных учреждений культуры ежемесячно.",
  category:"Культура и отдых", amount:"5 бесплатных посещений в месяц",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Ежемесячно — 5 бесплатных посещений."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-041", title:"Бесплатная юридическая помощь семьям участников СВО (Ивановская область)",
  short_description:"Членам семей участников СВО оказывают бесплатную юридическую помощь в Адвокатской палате области.",
  category:"Помощь и сопровождение", amount:"Бесплатная юридическая помощь",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true }),
  how_to_apply:["Обратиться в Адвокатскую палату Ивановской области"], documents:DOCS_SVO, tips:["Консультации и правовая поддержка."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-042", title:"Освобождение от транспортного налога участнику СВО (Ивановская область)",
  short_description:"Участника СВО с 1 января 2025 года освобождают от транспортного налога на одно транспортное средство мощностью до 250 л.с.",
  category:"Налоги и льготы", amount:"Освобождение от транспортного налога (до 250 л.с.)",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true }),
  how_to_apply:HOW_SVO, documents:["Паспорт","Документы, подтверждающие статус участника СВО","Документы на транспортное средство"],
  tips:["На одно ТС мощностью до 250 л.с. (до 183,9 кВт)."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-043", title:"Субсидия на газовое оборудование участникам СВО (Ивановская область)",
  short_description:"Участников СВО и членов их семей включают в льготные категории для субсидии на покупку газового оборудования и работы по газификации участка.",
  category:"Жильё и ипотека", amount:"Не менее 100 000 ₽ на домовладение",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true }),
  how_to_apply:HOW_SVO, documents:["Паспорт","Документы, подтверждающие статус участника СВО","Документы на домовладение"],
  tips:["Субсидия — не менее 100 000 ₽ на одно домовладение."], source_url:SVO, source_name:SN_GOV },

{ ...base, slug:"ivn-044", title:"Бесплатные кружки и секции детям участников СВО (Ивановская область)",
  short_description:"Детям участников СВО предоставляют бесплатное посещение кружков и занятий по дополнительным программам, а также первоочередное зачисление в спортивные секции.",
  category:"Культура и отдых", amount:"Бесплатные кружки + первоочередной приём в секции",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Кружки, секции и спортивная подготовка, в том числе в случае гибели участника СВО."], source_url:SVO, source_name:SN_GOV },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,56)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("ИВАНОВСКАЯ ОБЛАСТЬ В БАЗЕ ТЕПЕРЬ:", count);
