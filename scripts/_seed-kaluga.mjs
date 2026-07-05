// Калужская область — меры поддержки семей с детьми (региональный бюджет).
// Источник: официальная форма субъекта (xlsx, запрос Т.В. Буцкой), 17 мер,
// прямые URL из таблицы. Портал: Министерство труда и социальной защиты
// Калужской области (mintrud.admoblkaluga.ru); меры для семей СВО —
// zaschitnik40.ru. Запуск: node scripts/_seed-kaluga.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Калужская область";
const SN = "Министерство труда и социальной защиты Калужской области (mintrud.admoblkaluga.ru)";
const M = "https://mintrud.admoblkaluga.ru/page/";
const POS = M+"posobiya/";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в отдел социальной защиты населения по месту жительства, через МФЦ или на Госуслугах"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];

const rows = [
{ ...base, slug:"klg-001", title:"Социальная выплата на жильё семьям с тремя и более детьми (Калужская область)",
  short_description:"Семьям, имеющим трёх и более детей и состоящим на учёте на бесплатный земельный участок, предоставляют социальную выплату на обеспечение жильём.",
  category:"Жильё и ипотека", amount:"Социальная выплата на приобретение жилья (взамен участка)",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы о постановке на учёт на земельный участок"],
  tips:["Альтернатива бесплатному земельному участку."], source_url:M+"zemlya_3/", source_name:SN },

{ ...base, slug:"klg-002", title:"Возмещение процентов по ипотеке (Калужская область)",
  short_description:"Семьям ежегодно возмещают затраты на уплату процентов по кредиту, в том числе ипотечному.",
  category:"Жильё и ипотека", amount:"Ежегодное возмещение процентов по кредиту",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, requiresMortgageIntent:true }),
  how_to_apply:HOW, documents:["Паспорт","Кредитный (ипотечный) договор","Справка об уплаченных процентах"],
  tips:["Компенсирует часть процентов по ипотеке."], source_url:M+"ob-zhilem/", source_name:SN },

{ ...base, slug:"klg-003", title:"Социальная выплата на приобретение или строительство жилья (Калужская область)",
  short_description:"Семьям предоставляют социальную выплату на приобретение или строительство жилых помещений на территории области.",
  category:"Жильё и ипотека", amount:"Социальная выплата на жильё",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о нуждаемости в жилье","Свидетельства о рождении детей"],
  tips:["На покупку или строительство жилья."], source_url:M+"ob-zhilem/", source_name:SN },

{ ...base, slug:"klg-004", title:"Компенсация расходов на ЖКУ (Калужская область)",
  short_description:"Отдельным категориям семей компенсируют расходы на оплату жилья и коммунальных услуг в форме ежемесячной денежной выплаты.",
  category:"Жильё и ипотека", amount:"Ежемесячная компенсация расходов на ЖКУ",
  segments:["expecting-third-plus","disability","single-parent"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о льготной категории","Квитанции ЖКУ"],
  tips:["Компенсирует часть расходов на ЖКУ льготным категориям."], source_url:M+"posobiya-lgoty-subsidii/", source_name:SN },

{ ...base, slug:"klg-005", title:"Компенсация проезда детей из многодетных семей к месту учёбы (Калужская область)",
  short_description:"Многодетным семьям компенсируют проезд детей 7–18 лет автомобильным и железнодорожным транспортом к месту учёбы и обратно.",
  category:"Транспорт", amount:"Компенсация проезда к месту учёбы",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении","Проездные документы"],
  tips:["Для каждого ребёнка 7–18 лет, включая пригородные поезда."], source_url:M+"ob-transport/", source_name:SN },

{ ...base, slug:"klg-006", title:"Двухразовое питание школьникам из семей участников СВО (Калужская область)",
  short_description:"Детям — членам семей участников СВО, обучающимся в школах области, предоставляют бесплатное двухразовое горячее питание.",
  category:"Образование", amount:"Бесплатное двухразовое горячее питание",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:["Подать заявление в школу с документами участника СВО"],
  documents:["Паспорт","Документы, подтверждающие статус участника СВО","Справка об обучении"],
  tips:["Двухразовое питание — усиленная мера для детей СВО."], source_url:"https://zaschitnik40.ru/", source_name:SN },

{ ...base, slug:"klg-007", title:"Одноразовое питание школьникам из многодетных семей (Калужская область)",
  short_description:"Детям из многодетных семей, обучающимся в школах области, предоставляют бесплатное одноразовое горячее питание.",
  category:"Образование", amount:"Бесплатное одноразовое горячее питание",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Подать заявление в школу"], documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Дополняет федеральное питание для 1–4 классов."], source_url:"https://minobr.admoblkaluga.ru/", source_name:SN },

{ ...base, slug:"klg-008", title:"Именная стипендия детям погибших и раненых военнослужащих (Калужская область)",
  short_description:"Членам семей погибших или получивших тяжёлое увечье военнослужащих, мобилизованных и добровольцев, обучающимся в колледжах и вузах, выплачивают ежемесячную именную стипендию.",
  category:"Образование", amount:"12 000 ₽ в месяц",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true }),
  how_to_apply:["Обратиться через образовательную организацию / фонд поддержки участников СВО"],
  documents:["Паспорт","Документы о статусе члена семьи военнослужащего","Справка об обучении"],
  tips:["Для обучающихся по программам СПО, бакалавриата, специалитета и магистратуры."], source_url:"https://zaschitnik40.ru/", source_name:SN },

{ ...base, slug:"klg-009", title:"Бесплатные путёвки в детские лагеря (Калужская область)",
  short_description:"Детям предоставляют бесплатные путёвки в детские лагеря с приоритетом для льготных категорий.",
  category:"Культура и отдых", amount:"Бесплатная путёвка в лагерь",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Записать ребёнка через портал записи в детские лагеря области"],
  documents:["Паспорт родителя","Свидетельство о рождении ребёнка","Документы о льготной категории"],
  tips:["Приоритет — детям из льготных категорий."], source_url:"https://razvitie40.ru/index.php/novosti/290-zapis-v-detskie-lagerya-kaluzhskoj-oblasti", source_name:SN },

{ ...base, slug:"klg-010", title:"Ежемесячное пособие малообеспеченным семьям (Калужская область)",
  short_description:"Малообеспеченным семьям выплачивают ежемесячное пособие.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие (при доходе ниже прожиточного минимума)",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:DOCS, tips:["При среднедушевом доходе ниже прожиточного минимума."], source_url:POS, source_name:SN },

{ ...base, slug:"klg-011", title:"Ежемесячное пособие многодетным с 4 и более детьми (Калужская область)",
  short_description:"Многодетным семьям, воспитывающим четырёх и более детей, выплачивают ежемесячное пособие.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:4 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"],
  tips:["Для семей с четырьмя и более детьми."], source_url:POS, source_name:SN },

{ ...base, slug:"klg-012", title:"Выплата на школьную одежду многодетным (Калужская область)",
  short_description:"Многодетным семьям ежегодно выплачивают денежную выплату на одежду для учебных занятий и спортивную форму детям-школьникам.",
  category:"Выплаты и пособия", amount:"Ежегодная выплата на одежду и спортивную форму",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Выплачивается ежегодно к учебному году."], source_url:POS, source_name:SN },

{ ...base, slug:"klg-013", title:"Выплата на содержание усыновлённого ребёнка (Калужская область)",
  short_description:"Усыновителям выплачивают ежемесячную денежную выплату на содержание усыновлённого ребёнка.",
  category:"Выплаты и пособия", amount:"Ежемесячная выплата на содержание ребёнка",
  segments:["foster-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Обратиться в орган опеки и попечительства"], documents:["Паспорт","Документы об усыновлении","Свидетельство о рождении ребёнка"],
  tips:["Поддержка семей, усыновивших ребёнка."], source_url:POS, source_name:SN },

{ ...base, slug:"klg-014", title:"Компенсация проезда на санаторно-курортное лечение (Калужская область)",
  short_description:"Детям из малообеспеченных семей, нуждающимся в санаторно-курортном лечении, и сопровождающим их лицам компенсируют проезд.",
  category:"Транспорт", amount:"Компенсация проезда к месту лечения",
  segments:["disability","expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Направление на санаторно-курортное лечение","Проездные документы"],
  tips:["Для детей из малообеспеченных семей и сопровождающих."], source_url:POS, source_name:SN },

{ ...base, slug:"klg-015", title:"Региональный материнский (семейный) капитал (Калужская область)",
  short_description:"При рождении третьего и последующих детей семья получает региональный материнский капитал.",
  category:"Выплаты и пособия", amount:"Региональный материнский капитал",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в области"],
  tips:["Дополняет федеральный материнский капитал."], source_url:POS, source_name:SN },

{ ...base, slug:"klg-016", title:"Компенсация на питание детям 2–3 года жизни (Калужская область)",
  short_description:"Малообеспеченным семьям ежемесячно компенсируют расходы на полноценное питание детей второго и третьего года жизни.",
  category:"Здоровье", amount:"Ежемесячная компенсация на питание",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, requiresLowIncome:true, maxYoungestChildAgeYears:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка","Сведения о доходах семьи"],
  tips:["Для детей второго и третьего года жизни в малообеспеченных семьях."], source_url:POS, source_name:SN },

{ ...base, slug:"klg-017", title:"Выплата беременным студенткам (Калужская область)",
  short_description:"Обучающимся женщинам, вставшим на учёт по беременности, выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата",
  segments:["expecting-first","student-family"], criteria:reg({ requiresPregnancy:true, requiresStudent:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка о постановке на учёт по беременности","Справка об обучении"],
  tips:["Поддержка беременных студенток."], source_url:POS, source_name:SN },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,56)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("КАЛУЖСКАЯ ОБЛАСТЬ В БАЗЕ ТЕПЕРЬ:", count);
