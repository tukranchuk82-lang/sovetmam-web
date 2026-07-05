// Еврейская автономная область — меры поддержки семей с детьми (регион. бюджет).
// Источник: официальное письмо председателя правительства ЕАО В.А. Жукова
// (pdf, на имя Т.В. Буцкой) + приложение. «Пакет» многодетных разложен на
// отдельные меры → 17 мер. Соцзащита: social.eao.ru; образование: komobreao.ru.
// Запуск: node scripts/_seed-eao.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Еврейская автономная область";
const SN = "Комитет социальной защиты населения Еврейской автономной области (social.eao.ru)";
const SN_EDU = "Комитет образования Еврейской автономной области (komobreao.ru)";
const SOC = "https://social.eao.ru/?page_id=34835";
const IPO = "https://social.eao.ru/?p=44554";
const EDU = "https://komobreao.ru/docscat/spravki-pisma-otchety-komitetaobrazovaniyaevrejskojavtonomnojoblasti";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в отдел социальной защиты населения по месту жительства, через МФЦ или на Госуслугах"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];

const rows = [
{ ...base, slug:"eao-001",
  title:"Выплата при рождении первого ребёнка (Еврейская автономная область)",
  short_description:"При рождении или усыновлении первого ребёнка семье выплачивают единовременную денежную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата при рождении первого ребёнка",
  segments:["expecting-first"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:DOCS,
  tips:["Оформляется при рождении или усыновлении первенца."],
  source_url:SOC, source_name:SN },

{ ...base, slug:"eao-002",
  title:"Областной материнский капитал при рождении второго ребёнка (Еврейская автономная область)",
  short_description:"При рождении второго ребёнка семья получает областной материнский (семейный) капитал.",
  category:"Выплаты и пособия", amount:"Областной материнский капитал (2-й ребёнок)",
  segments:["expecting-second"], criteria:reg({ requiresChildren:true, minChildren:2 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в области"],
  tips:["Дополняет федеральный материнский капитал."],
  source_url:SOC, source_name:SN },

{ ...base, slug:"eao-003",
  title:"Областной материнский капитал при рождении третьего ребёнка (Еврейская автономная область)",
  short_description:"При рождении или усыновлении третьего ребёнка семья получает областной материнский (семейный) капитал.",
  category:"Выплаты и пособия", amount:"Областной материнский капитал (3-й ребёнок)",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в области"],
  tips:["Отдельный капитал при рождении третьего ребёнка."],
  source_url:SOC, source_name:SN },

{ ...base, slug:"eao-004",
  title:"Погашение ипотеки при рождении третьего ребёнка (Еврейская автономная область)",
  short_description:"Семьям при рождении третьего или последующего ребёнка помогают погасить обязательства по ипотечному кредиту.",
  category:"Жильё и ипотека", amount:"До 550 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3, requiresMortgageIntent:true }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Ипотечный договор","Справка об остатке задолженности"],
  tips:["Региональная выплата дополняет федеральные 450 000 ₽ на погашение ипотеки."],
  source_url:IPO, source_name:SN },

{ ...base, slug:"eao-005",
  title:"Выплата при рождении двойни и более (Еврейская автономная область)",
  short_description:"Семьям при одновременном рождении двух и более детей выплачивают единовременную денежную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата при рождении двойни и более",
  segments:["expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:2 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей (одновременное рождение)"],
  tips:["Назначается при одновременном рождении двух и более детей."],
  source_url:SOC, source_name:SN },

{ ...base, slug:"eao-006",
  title:"Помощь студенческим семьям с детьми (Еврейская автономная область)",
  short_description:"Студенческим семьям с детьми оказывают социальную помощь: единовременную выплату при рождении ребёнка и ежемесячное пособие на каждого ребёнка.",
  category:"Выплаты и пособия", amount:"10 000 ₽ единовременно + 1 500 ₽ в месяц на каждого ребёнка",
  segments:["student-family","expecting-first","expecting-second"], criteria:reg({ requiresChildren:true, requiresStudent:true }),
  how_to_apply:HOW, documents:["Паспорта родителей","Справки об очном обучении","Свидетельство о рождении ребёнка"],
  tips:["Поддержка родителей, совмещающих учёбу и воспитание детей."],
  source_url:SOC, source_name:SN },

{ ...base, slug:"eao-007",
  title:"Поддержка отдельных категорий при получении образования (Еврейская автономная область)",
  short_description:"Отдельным категориям граждан предоставляют социальную поддержку при получении образования.",
  category:"Образование", amount:"Меры поддержки при обучении",
  segments:["schoolchild","expecting-third-plus","disability"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Обратиться через образовательную организацию / орган социальной защиты"],
  documents:["Паспорт","Справка об обучении","Документы о льготной категории"],
  tips:["Льготы и выплаты учащимся из льготных категорий."],
  source_url:SOC, source_name:SN },

{ ...base, slug:"eao-008",
  title:"Компенсация 50 % ЖКУ многодетным семьям (Еврейская автономная область)",
  short_description:"Многодетным семьям компенсируют 50 % расходов на содержание жилья, водоснабжение, водоотведение, газ и электроэнергию.",
  category:"Жильё и ипотека", amount:"50 % платы за ЖКУ",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы на жильё","Квитанции ЖКУ"],
  tips:["Охватывает содержание жилья и основные коммунальные услуги."],
  source_url:SOC, source_name:SN },

{ ...base, slug:"eao-009",
  title:"Ежегодная выплата на школьника многодетным семьям (Еврейская автономная область)",
  short_description:"Многодетным семьям ежегодно выплачивают единовременную выплату на каждого ребёнка-школьника.",
  category:"Выплаты и пособия", amount:"5 000 ₽ на каждого ребёнка-школьника",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Выплачивается с 1 июля до 15 декабря на каждого школьника."],
  source_url:SOC, source_name:SN },

{ ...base, slug:"eao-010",
  title:"Выплата 1 млн рублей семьям с 9 и более детьми (Еврейская автономная область)",
  short_description:"Семьям, имеющим девять и более детей, выплачивают единовременную денежную выплату.",
  category:"Выплаты и пособия", amount:"1 000 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:9 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"],
  tips:["Разовая выплата для самых больших семей."],
  source_url:SOC, source_name:SN },

{ ...base, slug:"eao-011",
  title:"Компенсация 100 % платы за детский сад многодетным (Еврейская автономная область)",
  short_description:"Многодетным семьям, в которых трое и более детей одновременно посещают детский сад, ежемесячно компенсируют плату за присмотр и уход.",
  category:"Образование", amount:"100 % среднего размера родительской платы",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Подать заявление в детский сад / Комитет образования области"],
  documents:["Паспорт","Удостоверение многодетной семьи","Договоры с детскими садами"],
  tips:["Условие — одновременное посещение детсада тремя и более детьми."],
  source_url:EDU, source_name:SN_EDU },

{ ...base, slug:"eao-012",
  title:"Первоочередной приём в детский сад детям из многодетных семей (Еврейская автономная область)",
  short_description:"Детей из многодетных семей принимают в дошкольные образовательные организации в первую очередь.",
  category:"Образование", amount:"Первоочередное зачисление в детский сад",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Указать льготу при подаче заявления в детский сад"],
  documents:["Паспорт","Удостоверение многодетной семьи","Свидетельство о рождении ребёнка"],
  tips:["Приоритет при зачислении в детский сад."],
  source_url:EDU, source_name:SN_EDU },

{ ...base, slug:"eao-013",
  title:"Освобождение от платы за детский сад семьям участников СВО (Еврейская автономная область)",
  short_description:"Семьи участников специальной военной операции освобождают от родительской платы за детский сад.",
  category:"Образование", amount:"Бесплатный детский сад",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:["Подать заявление в детский сад с документами участника СВО"],
  documents:["Паспорт","Документы, подтверждающие статус участника СВО","Договор с детским садом"],
  tips:["Полное освобождение от платы за присмотр и уход."],
  source_url:EDU, source_name:SN_EDU },

{ ...base, slug:"eao-014",
  title:"Бесплатный детский сад для детей-инвалидов, сирот и с туберкулёзной интоксикацией (Еврейская автономная область)",
  short_description:"За присмотр и уход за детьми-инвалидами, детьми-сиротами, детьми без попечения родителей и детьми с туберкулёзной интоксикацией в детских садах родительская плата не взимается.",
  category:"Образование", amount:"Бесплатный детский сад",
  segments:["disability","foster-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Подать заявление в детский сад с подтверждающими документами"],
  documents:["Паспорт","Документы, подтверждающие категорию ребёнка","Договор с детским садом"],
  tips:["Освобождение от платы за детский сад для указанных категорий детей."],
  source_url:EDU, source_name:SN_EDU },

{ ...base, slug:"eao-015",
  title:"Бесплатный проезд школьников из многодетных семей (Еврейская автономная область)",
  short_description:"Школьникам из многодетных семей предоставляют бесплатный проезд автомобильным транспортом в городском и пригородном сообщении.",
  category:"Транспорт", amount:"Бесплатный проезд для школьников",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Оформить льготу через школу / орган социальной защиты"],
  documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Кроме такси; в городском и пригородном сообщении."],
  source_url:EDU, source_name:SN_EDU },

{ ...base, slug:"eao-016",
  title:"Бесплатное питание школьников из многодетных семей (Еврейская автономная область)",
  short_description:"Обучающимся из многодетных семей в школах области с 1 января 2026 года предоставляют бесплатное питание.",
  category:"Образование", amount:"Бесплатное питание",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Подать заявление в школу"], documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Мера действует с 1 января 2026 года."],
  source_url:EDU, source_name:SN_EDU },

{ ...base, slug:"eao-017",
  title:"Бесплатное горячее питание 5–11 классов семьям участников СВО (Еврейская автономная область)",
  short_description:"Детям участников специальной военной операции, обучающимся в 5–11 классах, обеспечивают бесплатное горячее питание.",
  category:"Образование", amount:"Бесплатное горячее питание",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:["Подать заявление в школу с документами участника СВО"],
  documents:["Паспорт","Документы, подтверждающие статус участника СВО","Справка об обучении"],
  tips:["Дополняет федеральное бесплатное питание для учеников 1–4 классов."],
  source_url:EDU, source_name:SN_EDU },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,58)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("ЕАО В БАЗЕ ТЕПЕРЬ:", count);
