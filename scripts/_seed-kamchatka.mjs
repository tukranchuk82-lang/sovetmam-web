// Камчатский край — меры поддержки семей с детьми (региональный бюджет).
// Источник: официальная форма субъекта (xlsx, запрос Т.В. Буцкой), 19 мер,
// action-ссылки из таблицы. Портал: Министерство социального благополучия
// и семейной политики Камчатского края (soc.gosuslugi41.ru).
// Особенность: краевой маткапитал на 1-го, 2-го и 3-го ребёнка отдельно.
// Запуск: node scripts/_seed-kamchatka.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Камчатский край";
const SN = "Министерство социального благополучия и семейной политики Камчатского края (soc.gosuslugi41.ru)";
const A = "https://soc.gosuslugi41.ru/actions/";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в отделение социальной защиты населения по месту жительства, через МФЦ или на Госуслугах"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];

const rows = [
{ ...base, slug:"kam-001", title:"Краевой материнский капитал при рождении первого ребёнка (Камчатский край)",
  short_description:"При рождении первого ребёнка семья получает краевой материнский (семейный) капитал.",
  category:"Выплаты и пособия", amount:"Краевой материнский капитал (1-й ребёнок)",
  segments:["expecting-first"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка","Сведения о месте жительства в крае"],
  tips:["Камчатка выплачивает краевой капитал уже на первого ребёнка."], source_url:A+"18", source_name:SN },

{ ...base, slug:"kam-002", title:"Краевой материнский капитал при рождении второго ребёнка (Камчатский край)",
  short_description:"При рождении второго ребёнка семья получает краевой материнский (семейный) капитал.",
  category:"Выплаты и пособия", amount:"Краевой материнский капитал (2-й ребёнок)",
  segments:["expecting-second"], criteria:reg({ requiresChildren:true, minChildren:2 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в крае"],
  tips:["Отдельный капитал при рождении второго ребёнка."], source_url:A+"207", source_name:SN },

{ ...base, slug:"kam-003", title:"Краевой материнский капитал при рождении третьего ребёнка (Камчатский край)",
  short_description:"При рождении третьего и последующих детей семья получает краевой материнский (семейный) капитал.",
  category:"Выплаты и пособия", amount:"Краевой материнский капитал (3-й и последующий ребёнок)",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в крае"],
  tips:["Отдельный капитал при рождении третьего и последующих детей."], source_url:A+"18", source_name:SN },

{ ...base, slug:"kam-004", title:"Выплата на питание беременным женщинам (Камчатский край)",
  short_description:"Беременным женщинам ежемесячно выплачивают денежную выплату на полноценное питание.",
  category:"Здоровье", amount:"Ежемесячная выплата на питание",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresPregnancy:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка о беременности","Заключение врача"],
  tips:["По медицинскому заключению."], source_url:A+"39", source_name:SN },

{ ...base, slug:"kam-005", title:"Выплата на питание кормящим матерям (Камчатский край)",
  short_description:"Кормящим матерям ежемесячно выплачивают денежную выплату на полноценное питание.",
  category:"Здоровье", amount:"Ежемесячная выплата на питание",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:1 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка","Заключение врача"],
  tips:["По медицинскому заключению, в период кормления."], source_url:A+"43", source_name:SN },

{ ...base, slug:"kam-006", title:"Выплата на питание детям до 3 лет (Камчатский край)",
  short_description:"Семьям ежемесячно выплачивают денежную выплату на полноценное питание детей в возрасте до трёх лет.",
  category:"Здоровье", amount:"Ежемесячная выплата на питание",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка","Заключение врача"],
  tips:["Для детей раннего возраста по медицинскому заключению."], source_url:A+"44", source_name:SN },

{ ...base, slug:"kam-007", title:"Выплата при рождении первого ребёнка (Камчатский край)",
  short_description:"При рождении первого ребёнка семье выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата при рождении первого ребёнка",
  segments:["expecting-first"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:DOCS, tips:["Отдельная выплата при рождении первенца."], source_url:A+"15", source_name:SN },

{ ...base, slug:"kam-008", title:"Выплата на лекарства детям до 6 лет в многодетных семьях (Камчатский край)",
  short_description:"Многодетным семьям ежемесячно выплачивают социальную выплату на дополнительное лекарственное обеспечение каждого ребёнка до 6 лет включительно.",
  category:"Здоровье", amount:"Ежемесячная выплата на лекарства (дети до 6 лет)",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3, maxYoungestChildAgeYears:6 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельство о рождении ребёнка"],
  tips:["На каждого ребёнка до 6 лет включительно."], source_url:A+"22", source_name:SN },

{ ...base, slug:"kam-009", title:"Обеспечение школьников одеждой и спортформой многодетным (Камчатский край)",
  short_description:"Детей-школьников из многодетных семей обеспечивают одеждой для учебных занятий и спортивной формой на весь период обучения.",
  category:"Выплаты и пособия", amount:"Обеспечение одеждой и спортивной формой",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["На весь период обучения ребёнка в школе."], source_url:A+"25", source_name:SN },

{ ...base, slug:"kam-010", title:"Льгота по ЖКУ многодетным семьям (Камчатский край)",
  short_description:"Многодетным семьям предоставляют льготу по оплате жилья и коммунальных услуг.",
  category:"Жильё и ипотека", amount:"Не менее 30 % от установленного размера оплаты",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Квитанции ЖКУ"],
  tips:["Скидка не менее 30 % на оплату ЖКУ."], source_url:A+"35", source_name:SN },

{ ...base, slug:"kam-011", title:"Выплата взамен земельного участка семьям с 3+ детьми (Камчатский край)",
  short_description:"Семьям, имеющим трёх и более детей, вместо бесплатного земельного участка выплачивают единовременную денежную выплату.",
  category:"Жильё и ипотека", amount:"Единовременная выплата взамен земельного участка",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы о постановке на учёт на участок"],
  tips:["Альтернатива бесплатному земельному участку."], source_url:A+"242", source_name:SN },

{ ...base, slug:"kam-012", title:"Выплата на лекарства многодетным родителям (Камчатский край)",
  short_description:"Многодетным родителям (законным представителям детей) ежемесячно выплачивают социальную выплату на дополнительное лекарственное обеспечение.",
  category:"Здоровье", amount:"Ежемесячная выплата на лекарства",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи"],
  tips:["Дополнительное лекарственное обеспечение самих родителей."], source_url:A+"19", source_name:SN },

{ ...base, slug:"kam-013", title:"Компенсация зубных протезов многодетным родителям-пенсионерам (Камчатский край)",
  short_description:"Многодетным родителям-пенсионерам компенсируют расходы на изготовление и ремонт зубных протезов в государственных и муниципальных медучреждениях края.",
  category:"Здоровье", amount:"Компенсация расходов на зубные протезы",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Пенсионное удостоверение","Документы о расходах на протезирование"],
  tips:["Для многодетных родителей, вышедших на пенсию."], source_url:A+"47", source_name:SN },

{ ...base, slug:"kam-014", title:"Выплата на новогодние подарки (Камчатский край)",
  short_description:"Отдельным категориям граждан края ежегодно выплачивают денежную выплату на приобретение новогодних подарков детям.",
  category:"Помощь и сопровождение", amount:"Ежегодная выплата на новогодние подарки",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка","Документы о льготной категории"],
  tips:["Помощь к новогодним праздникам."], source_url:"https://soc.gosuslugi41.ru", source_name:SN },

{ ...base, slug:"kam-015", title:"Автомобиль семьям с 7 и более детьми (Камчатский край)",
  short_description:"Семьям, имеющим семь и более детей, выплачивают единовременную выплату на приобретение легкового автомобиля или пассажирского микроавтобуса.",
  category:"Транспорт", amount:"Единовременная выплата на автомобиль или микроавтобус",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:7 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"],
  tips:["Для больших семей — на легковой автомобиль или микроавтобус."], source_url:A+"250", source_name:SN },

{ ...base, slug:"kam-016", title:"Дополнительное пособие при рождении двойни и тройни (Камчатский край)",
  short_description:"Семьям при одновременном рождении двоих детей выплачивают дополнительное единовременное пособие, при рождении троих — дополнительное ежемесячное пособие.",
  category:"Выплаты и пособия", amount:"Дополнительное пособие при рождении двойни / тройни",
  segments:["expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:2 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей (одновременное рождение)"],
  tips:["Двойня — единовременно, тройня — ежемесячно."], source_url:A+"33", source_name:SN },

{ ...base, slug:"kam-017", title:"Пособие семьям с ребёнком-инвалидом (Камчатский край)",
  short_description:"Семьям, воспитывающим ребёнка-инвалида, выплачивают ежемесячное денежное пособие.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие",
  segments:["disability"], criteria:reg({ requiresChildren:true, requiresDisabledChild:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка об инвалидности ребёнка","Свидетельство о рождении ребёнка"],
  tips:["Назначается семье, воспитывающей ребёнка-инвалида."], source_url:A+"38", source_name:SN },

{ ...base, slug:"kam-018", title:"Компенсация ЖКУ и капремонта семьям с ребёнком-инвалидом (Камчатский край)",
  short_description:"Семьям, имеющим ребёнка-инвалида, компенсируют расходы на оплату жилья, взноса на капитальный ремонт, коммунальных и других услуг.",
  category:"Жильё и ипотека", amount:"Компенсация расходов на ЖКУ и капремонт",
  segments:["disability"], criteria:reg({ requiresChildren:true, requiresDisabledChild:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка об инвалидности ребёнка","Квитанции ЖКУ"],
  tips:["Включает взнос на капитальный ремонт."], source_url:A+"40", source_name:SN },

{ ...base, slug:"kam-019", title:"Компенсация проезда детям-инвалидам к месту отдыха (Камчатский край)",
  short_description:"Детям-инвалидам, инвалидам с детства и сопровождающим их лицам компенсируют проезд и провоз багажа к месту отдыха и обратно по России.",
  category:"Транспорт", amount:"Компенсация проезда и провоза багажа",
  segments:["disability"], criteria:reg({ requiresChildren:true, requiresDisabledChild:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка об инвалидности","Проездные документы"],
  tips:["К месту отдыха и обратно в пределах России, включая сопровождающего."], source_url:A+"54", source_name:SN },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,56)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("КАМЧАТСКИЙ КРАЙ В БАЗЕ ТЕПЕРЬ:", count);
