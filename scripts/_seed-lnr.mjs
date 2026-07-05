// Луганская Народная Республика — меры поддержки семей с детьми (регион. бюджет).
// Источник: официальное письмо председателя правительства ЛНР Е.В. Ковальчук
// (pdf, на имя Т.В. Буцкой) + приложение на 4 л. Дубли по СПО объединены → 22 меры.
// Новый регион: большинство федеральных выплат — федеральные; здесь региональный
// блок, сумм в источнике нет. Порталы: sovminlnr.ru, edu.lpr-reg.ru, pravo.gov.ru.
// Запуск: node scripts/_seed-lnr.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Луганская Народная Республика";
const SN = "Правительство Луганской Народной Республики (sovminlnr.ru)";
const P_MNOGO = "https://sovminlnr.ru/akty-soveta-ministrov/postanovleniya/33779-ob-utverzhdenii-poryadka-predostavleniya-mer-socialnoy-podderzhki-mnogodetnym-semyam-na-territorii-luganskoy-narodnoy-respubliki.html";
const P_DETI = "https://sovminlnr.ru/akty-soveta-ministrov/postanovleniya/33750-ob-utverzhdenii-poryadka-naznacheniya-i-vyplaty-dopolnitelnyh-mer-socialnoy-podderzhki-semey-s-detmi-v-luganskoy-narodnoy-respublike.html";
const P_GAZ = "https://sovminlnr.ru/akty-soveta-ministrov/postanovleniya/34827-ob-utverzhdenii-poryadka-predostavleniya-subsidiy-lgotnym-kategoriyam-grazhdan-na-pokupku-i-ustanovku-gazoispolzuyuschego-oborudovaniya-provedenie-rabot-pri-socialnoy-gazifikacii-dogazifikacii.html";
const P_SK = "https://sovminlnr.ru/akty-soveta-ministrov/postanovleniya/32629-o-predostavlenii-gosudarstvennoy-socialnoy-pomoschi-na-osnovanii-socialnogo-kontrakta.html";
const EDU = "https://edu.lpr-reg.ru/";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в орган социальной защиты населения по месту жительства или через МФЦ"];
const HOW_EDU = ["Обратиться в образовательную организацию"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];

const rows = [
{ ...base, slug:"lnr-001", title:"Ежемесячное пособие многодетным семьям (Луганская Народная Республика)",
  short_description:"Многодетным семьям выплачивают ежемесячное пособие.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие многодетной семье",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"],
  tips:["Базовая выплата для многодетных семей."], source_url:P_MNOGO, source_name:SN },

{ ...base, slug:"lnr-002", title:"Выплата на проезд многодетным семьям (Луганская Народная Республика)",
  short_description:"Многодетным семьям ежемесячно выплачивают денежную выплату на проезд в общественном транспорте (кроме такси).",
  category:"Транспорт", amount:"Ежемесячная выплата на проезд",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи"],
  tips:["Кроме такси; на транспорте общего пользования."], source_url:P_MNOGO, source_name:SN },

{ ...base, slug:"lnr-003", title:"Компенсация на школьную и спортивную одежду многодетным (Луганская Народная Республика)",
  short_description:"Многодетным семьям компенсируют затраты на одежду для учебных занятий и спортивную форму.",
  category:"Выплаты и пособия", amount:"Компенсация затрат на одежду и спортивную форму",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Компенсация расходов к учебному году."], source_url:P_MNOGO, source_name:SN },

{ ...base, slug:"lnr-004", title:"Компенсация ЖКУ многодетным семьям (Луганская Народная Республика)",
  short_description:"Многодетным семьям ежемесячно компенсируют часть расходов на жильё и коммунальные услуги.",
  category:"Жильё и ипотека", amount:"Ежемесячная компенсация расходов на ЖКУ",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Квитанции ЖКУ"],
  tips:["Компенсирует часть коммунальных платежей."], source_url:P_MNOGO, source_name:SN },

{ ...base, slug:"lnr-005", title:"Компенсация на твёрдое топливо (уголь) многодетным (Луганская Народная Республика)",
  short_description:"Многодетным семьям компенсируют расходы на приобретение твёрдого бытового топлива (угля).",
  category:"Жильё и ипотека", amount:"Компенсация на приобретение угля",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы на жильё с печным отоплением"],
  tips:["Для домов, отапливаемых углём."], source_url:P_MNOGO, source_name:SN },

{ ...base, slug:"lnr-006", title:"Единовременное пособие по беременности и родам (Луганская Народная Республика)",
  short_description:"Женщинам выплачивают единовременное пособие по беременности и родам (дополнительная региональная мера).",
  category:"Выплаты и пособия", amount:"Единовременное пособие по беременности и родам",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresPregnancy:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка о беременности / документы о родах"],
  tips:["Дополнительная региональная выплата."], source_url:P_DETI, source_name:SN },

{ ...base, slug:"lnr-007", title:"Пособие по уходу за ребёнком до 3 лет (Луганская Народная Республика)",
  short_description:"Семьям выплачивают ежемесячное пособие по уходу за ребёнком до достижения им трёх лет.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие на ребёнка до 3 лет",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:3 }),
  how_to_apply:HOW, documents:DOCS, tips:["Выплачивается до достижения ребёнком 3 лет."], source_url:P_DETI, source_name:SN },

{ ...base, slug:"lnr-008", title:"Пособие малоимущим семьям на детей 17–18 лет (Луганская Народная Республика)",
  short_description:"Малоимущим семьям выплачивают ежемесячное пособие на детей 17–18 лет, а при очном обучении — до его окончания, но не более чем до 23 лет.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие (при доходе ниже прожиточного минимума)",
  segments:["schoolchild","single-parent","expecting-third-plus"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:DOCS, tips:["Продлевается до 23 лет при очном обучении."], source_url:P_DETI, source_name:SN },

{ ...base, slug:"lnr-009", title:"Субсидия на газовое оборудование при догазификации (Луганская Народная Республика)",
  short_description:"Льготным категориям граждан предоставляют субсидию на покупку и установку газоиспользующего оборудования и работы при социальной газификации.",
  category:"Жильё и ипотека", amount:"Субсидия на газовое оборудование и подключение",
  segments:["expecting-third-plus","single-parent","disability"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о льготной категории","Документы на домовладение","Договор на догазификацию"],
  tips:["Помогает подключить дом к газу."], source_url:P_GAZ, source_name:SN },

{ ...base, slug:"lnr-010", title:"Социальный контракт (Луганская Народная Республика)",
  short_description:"Малообеспеченным семьям оказывают государственную социальную помощь на основании социального контракта.",
  category:"Работа и занятость", amount:"Выплаты по социальному контракту (по направлению)",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Сведения о доходах семьи","Документы по программе"],
  tips:["Направления: работа, обучение, ИП/самозанятость, ЛПХ."], source_url:P_SK, source_name:SN },

{ ...base, slug:"lnr-011", title:"Выплата на содержание детей под опекой и в приёмных семьях (Луганская Народная Республика)",
  short_description:"На содержание детей-сирот и детей без попечения родителей, воспитывающихся в семьях опекунов и приёмных родителей, выплачивают денежные средства.",
  category:"Выплаты и пособия", amount:"Выплата на содержание подопечного ребёнка",
  segments:["foster-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Обратиться в орган опеки и попечительства"], documents:["Паспорт опекуна","Документы об опеке / приёмной семье","Свидетельство о рождении ребёнка"],
  tips:["Для опекунов, попечителей и приёмных родителей."], source_url:"https://sovminlnr.ru/docs/2026/02/25/36_26.pdf", source_name:SN },

{ ...base, slug:"lnr-012", title:"Бесплатное питание обучающихся (Луганская Народная Республика)",
  short_description:"Обучающимся в детских садах, школах и колледжах республики предоставляют бесплатное питание.",
  category:"Образование", amount:"Бесплатное питание",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_EDU, documents:["Паспорт","Справка об обучении"],
  tips:["Охватывает детские сады, школы и колледжи."], source_url:"http://publication.pravo.gov.ru/document/8100202411250004", source_name:SN },

{ ...base, slug:"lnr-013", title:"Продуктовые наборы школьникам при дистанционном обучении (Луганская Народная Республика)",
  short_description:"Ученикам начальной школы и льготным категориям при переводе на дистанционное обучение предоставляют продуктовые наборы.",
  category:"Образование", amount:"Продуктовый набор",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_EDU, documents:["Паспорт","Справка об обучении"],
  tips:["Замена питания при дистанционном формате."], source_url:"http://publication.pravo.gov.ru/document/8101202504150002", source_name:SN },

{ ...base, slug:"lnr-014", title:"Двухразовое питание детям с ОВЗ на надомном обучении (Луганская Народная Республика)",
  short_description:"Обучающимся с ограниченными возможностями здоровья, обучающимся на дому, предоставляют бесплатное двухразовое питание или его денежную компенсацию.",
  category:"Образование", amount:"Бесплатное двухразовое питание или компенсация",
  segments:["disability"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_EDU, documents:["Паспорт законного представителя","Заключение об обучении на дому","Свидетельство о рождении ребёнка"],
  tips:["Можно заменить питание денежной компенсацией."], source_url:"http://publication.pravo.gov.ru/document/8100202403120001", source_name:SN },

{ ...base, slug:"lnr-015", title:"Бесплатные путёвки в лагеря детям льготных категорий (Луганская Народная Республика)",
  short_description:"Детей из семей льготных категорий бесплатно направляют в организации отдыха и оздоровления.",
  category:"Культура и отдых", amount:"Бесплатная путёвка",
  segments:["schoolchild","expecting-third-plus","svo-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_EDU, documents:["Паспорт родителя","Свидетельство о рождении ребёнка","Документы о льготной категории"],
  tips:["Оздоровление детей в каникулы."], source_url:"https://edu.lpr-reg.ru/14449-camp.html", source_name:SN },

{ ...base, slug:"lnr-016", title:"Преимущественное зачисление в казачий (кадетский) корпус (Луганская Народная Республика)",
  short_description:"Детям из отдельных категорий семей предоставляют преимущественное право при зачислении в казачий (кадетский) корпус.",
  category:"Образование", amount:"Преимущественное зачисление",
  segments:["schoolchild","svo-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_EDU, documents:["Паспорт","Документы о льготной категории","Справка об обучении"],
  tips:["Приоритет при поступлении в кадетский корпус."], source_url:"http://publication.pravo.gov.ru/Document/View/0001202009110040", source_name:SN },

{ ...base, slug:"lnr-017", title:"Первоочередное зачисление в продлёнку (Луганская Народная Республика)",
  short_description:"Детей из отдельных категорий семей в первоочередном порядке зачисляют в группы продлённого дня.",
  category:"Образование", amount:"Первоочередное зачисление в продлёнку",
  segments:["schoolchild","expecting-third-plus","svo-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_EDU, documents:["Паспорт","Документы о льготной категории","Справка об обучении"],
  tips:["Приоритет при зачислении в группу продлённого дня."], source_url:EDU, source_name:SN },

{ ...base, slug:"lnr-018", title:"Бесплатный детский сад (Луганская Народная Республика)",
  short_description:"Присмотр и уход за детьми в детских садах республики предоставляют бесплатно (мера действует до 2028 года).",
  category:"Образование", amount:"Бесплатный детский сад (до 2028 года)",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:7 }),
  how_to_apply:HOW_EDU, documents:["Паспорт","Свидетельство о рождении ребёнка"],
  tips:["Родительская плата не взимается — временная мера до 2028 года."], source_url:"http://publication.pravo.gov.ru/document/8100202512120001", source_name:SN },

{ ...base, slug:"lnr-019", title:"Первоочередное зачисление в колледж (Луганская Народная Республика)",
  short_description:"Отдельным категориям поступающих предоставляют первоочередное и преимущественное право зачисления на обучение по программам среднего профессионального образования.",
  category:"Образование", amount:"Первоочередное / преимущественное зачисление в колледж",
  segments:["schoolchild","svo-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_EDU, documents:["Паспорт","Документы об образовании","Документы о льготной категории"],
  tips:["Приоритет при поступлении в колледжи (СПО)."], source_url:EDU, source_name:SN },

{ ...base, slug:"lnr-020", title:"Первоочередное проживание в общежитии (Луганская Народная Республика)",
  short_description:"Отдельным категориям обучающихся предоставляют первоочередное право проживания в общежитиях, в том числе в комнатах семейного типа.",
  category:"Образование", amount:"Первоочередное проживание в общежитии",
  segments:["student-family","svo-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_EDU, documents:["Паспорт","Справка об обучении","Документы о льготной категории"],
  tips:["Комнаты семейного типа — для студенческих семей (при наличии)."], source_url:EDU, source_name:SN },

{ ...base, slug:"lnr-021", title:"Комнаты матери и ребёнка в колледжах (Луганская Народная Республика)",
  short_description:"В колледжах республики создают комнаты матери и ребёнка для студентов с детьми.",
  category:"Помощь и сопровождение", amount:"Комнаты матери и ребёнка",
  segments:["student-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_EDU, documents:["Паспорт","Справка об обучении","Свидетельство о рождении ребёнка"],
  tips:["Помогает студентам-родителям совмещать учёбу и уход за ребёнком."], source_url:EDU, source_name:SN },

{ ...base, slug:"lnr-022", title:"Льготный проезд (Луганская Народная Республика)",
  short_description:"Отдельным категориям семей с детьми предоставляют льготный проезд.",
  category:"Транспорт", amount:"Льготный проезд",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о льготной категории"],
  tips:["На транспорте общего пользования."], source_url:"http://publication.pravo.gov.ru/document/8100202512120001", source_name:SN },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,56)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("ЛНР В БАЗЕ ТЕПЕРЬ:", count);
