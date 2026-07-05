// Липецкая область — меры поддержки семей с детьми (региональный бюджет).
// Источник: официальная форма субъекта (.docx, запрос Т.В. Буцкой), 25 мер
// с точными суммами. Порталы: usp.admlr.lipetsk.ru (Управление социальной
// политики), cszn.admlr.lipetsk.ru. Запуск: node scripts/_seed-lipetsk.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Липецкая область";
const SN = "Управление социальной политики Липецкой области (usp.admlr.lipetsk.ru)";
const DEN = "https://usp.admlr.lipetsk.ru/iblock/socpodderjka/denezhnie_viplati/";
const PREM = DEN+"e/denezhnie_premii/";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в орган социальной защиты населения по месту жительства, через МФЦ или на Госуслугах"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];

const rows = [
{ ...base, slug:"lpc-001", title:"Выплата при рождении первого ребёнка маме 18–24 лет (Липецкая область)",
  short_description:"Женщинам, родившим первого ребёнка в возрасте от 18 до 24 лет включительно, выплачивают единовременную социальную выплату.",
  category:"Выплаты и пособия", amount:"85 000 ₽",
  segments:["expecting-first"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт матери","Свидетельство о рождении первого ребёнка"],
  tips:["Право — если на дату рождения матери от 18 до 24 лет включительно."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-002", title:"Выплата сиротам при рождении ребёнка (Липецкая область)",
  short_description:"Лицам из числа детей-сирот и детей, оставшихся без попечения родителей, при рождении ребёнка выплачивают единовременную социальную выплату.",
  category:"Выплаты и пособия", amount:"30 000 ₽",
  segments:["foster-family","expecting-first"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о статусе лица из числа детей-сирот","Свидетельство о рождении ребёнка"],
  tips:["Для молодых родителей из числа детей-сирот."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-003", title:"Областной материнский капитал (Липецкая область)",
  short_description:"При рождении или усыновлении третьего и последующих детей либо близнецов семья получает областной материнский капитал.",
  category:"Выплаты и пособия", amount:"113 572 ₽ (ежегодно индексируется)",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в области"],
  tips:["Выплачивается также при рождении близнецов."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-004", title:"Выплата при рождении третьего ребёнка в молодой семье (Липецкая область)",
  short_description:"Молодым семьям при рождении третьего или последующего ребёнка выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"300 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорта родителей","Свидетельства о рождении детей"],
  tips:["Крупная выплата молодым семьям."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-005", title:"Выплата при рождении тройни и более (Липецкая область)",
  short_description:"Семьям при одновременном рождении троих или более детей выплачивают единовременную социальную выплату.",
  category:"Выплаты и пособия", amount:"1 200 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей (одновременное рождение)"],
  tips:["Право — при одновременном рождении троих и более детей."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-006", title:"Выплата на транспорт семьям с 8 и более детьми (Липецкая область)",
  short_description:"Многодетным семьям, имеющим восемь и более детей, выплачивают единовременную выплату на приобретение транспортного средства.",
  category:"Транспорт", amount:"1 500 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:8 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"],
  tips:["Для больших семей — на автомобиль или микроавтобус."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-007", title:"Пособие на ребёнка (Липецкая область)",
  short_description:"Малообеспеченным семьям выплачивают ежемесячное пособие на ребёнка; размер зависит от возраста ребёнка и категории семьи.",
  category:"Выплаты и пособия", amount:"366–1 399 ₽ (базовое 831 ₽ до 3 лет; 1 399 ₽ на детей-инвалидов)",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent","disability"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:DOCS,
  tips:["Повышенные размеры — одиноким матерям, многодетным, на детей-инвалидов."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-008", title:"Выплата на проезд (Липецкая область)",
  short_description:"Семьям ежемесячно выплачивают денежную выплату на проезд детей автомобильным и городским электрическим транспортом.",
  category:"Транспорт", amount:"300 ₽ в месяц",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["На муниципальных и межмуниципальных маршрутах."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-009", title:"Выплата на школьную и спортивную одежду (Липецкая область)",
  short_description:"Обучающимся выплачивают ежегодную социальную выплату на одежду для учебных занятий и спортивную форму.",
  category:"Выплаты и пособия", amount:"5 000 ₽ в год",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Выплачивается ежегодно к учебному году."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-010", title:"Компенсация родительской платы за детский сад (Липецкая область)",
  short_description:"Семьям со среднедушевым доходом ниже полуторакратного прожиточного минимума компенсируют часть платы за детский сад; многодетным и семьям участников СВО — полностью.",
  category:"Образование", amount:"20 % / 50 % / 70 %; многодетным и семьям СВО — 100 %",
  segments:["expecting-first","expecting-second","expecting-third-plus","svo-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Подать заявление в детский сад"], documents:["Паспорт","Свидетельства о рождении детей","Договор с детским садом"],
  tips:["Многодетным и семьям участников СВО — 100 % компенсации."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-011", title:"Компенсация спортподготовки детям погибших участников СВО (Липецкая область)",
  short_description:"Детям погибших участников СВО и детям из нуждающихся семей возмещают затраты на платные услуги по физической и спортивной подготовке.",
  category:"Культура и отдых", amount:"5 000 ₽ на каждого ребёнка",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о статусе / нуждаемости","Документы об оплате занятий"],
  tips:["Возмещение расходов на спортивные секции."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-012", title:"Компенсация 50 % обучения по СПО (Липецкая область)",
  short_description:"Семьям компенсируют половину внесённой платы за обучение по аккредитованным программам среднего профессионального образования.",
  category:"Образование", amount:"50 % внесённой платы за обучение",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Договор об обучении","Документы об оплате"],
  tips:["Для платного обучения в колледжах."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-013", title:"Компенсация ЖКУ многодетным семьям (Липецкая область)",
  short_description:"Многодетным семьям компенсируют расходы на жильё и коммунальные услуги; размер зависит от числа детей.",
  category:"Жильё и ипотека", amount:"30 % (3 детей), 50 % (4–6 детей), 100 % (7 и более детей)",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Квитанции ЖКУ"],
  tips:["Чем больше детей — тем выше компенсация, вплоть до 100 %."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-014", title:"Компенсация газификации многодетным семьям (Липецкая область)",
  short_description:"Многодетным семьям однократно компенсируют часть расходов на газификацию принадлежащего им жилья.",
  category:"Жильё и ипотека", amount:"Не более 130 000 ₽ (однократно)",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы на жильё","Документы о расходах на газификацию"],
  tips:["Однократная компенсация расходов на газификацию дома."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-015", title:"Санаторно-курортная путёвка беременным (Липецкая область)",
  short_description:"Беременным женщинам, нуждающимся в социальной поддержке, и беременным супругам участников СВО однократно предоставляют бесплатную путёвку на санаторно-курортное лечение.",
  category:"Здоровье", amount:"Бесплатная путёвка (однократно)",
  segments:["expecting-first","expecting-second","expecting-third-plus","svo-family"], criteria:reg({ requiresPregnancy:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка о беременности","Медицинские показания"],
  tips:["Отдельно — для беременных супруг участников СВО."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-016", title:"Бесплатная протезно-ортопедическая помощь (Липецкая область)",
  short_description:"Детям предоставляют бесплатную протезно-ортопедическую помощь.",
  category:"Здоровье", amount:"Бесплатно",
  segments:["disability"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Обратиться в учреждение по протезно-ортопедической помощи по направлению врача"],
  documents:["Паспорт законного представителя","Медицинское заключение","Свидетельство о рождении ребёнка"],
  tips:["По медицинским показаниям."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-017", title:"Бесплатный проезд детям из многодетных семей (Липецкая область)",
  short_description:"Детям из многодетных семей, обучающимся в школах, колледжах и вузах области (до 24 лет), предоставляют бесплатный проезд по транспортной карте.",
  category:"Транспорт", amount:"Бесплатно (транспортная карта, круглогодично)",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Для обучающихся очно до 24 лет."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-018", title:"Бесплатный проезд детям инвалидов и погибших участников СВО (Липецкая область)",
  short_description:"Бесплатный проезд по транспортной карте предоставляют обучающимся детям (до 24 лет), которые воспитываются в семьях, где оба родителя — неработающие инвалиды, либо родители погибли в ходе СВО.",
  category:"Транспорт", amount:"Бесплатно (транспортная карта)",
  segments:["disability","svo-family","schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о статусе семьи (инвалидность родителей / гибель в СВО)","Справка об обучении"],
  tips:["Для детей неработающих родителей-инвалидов и детей погибших участников СВО."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-019", title:"Компенсация найма жилья молодым семьям (Липецкая область)",
  short_description:"Молодым семьям компенсируют стоимость найма (аренды) жилого помещения.",
  category:"Жильё и ипотека", amount:"Компенсация стоимости найма жилья",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорта родителей","Свидетельство о рождении ребёнка","Договор найма жилья"],
  tips:["Помогает молодым семьям, снимающим жильё."], source_url:DEN, source_name:SN },

{ ...base, slug:"lpc-020", title:"Бесплатные путёвки в загородные лагеря (Липецкая область)",
  short_description:"Детям предоставляют бесплатные путёвки в загородные лагеря Липецкой области.",
  category:"Культура и отдых", amount:"Бесплатная путёвка",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт родителя","Свидетельство о рождении ребёнка","Документы о льготной категории"],
  tips:["Оздоровление детей в каникулы."], source_url:"https://usp.admlr.lipetsk.ru/iblock/socpodderjka/sanatornokurortnie_putjovki/", source_name:SN },

{ ...base, slug:"lpc-021", title:"Прокат вещей для новорождённых (Липецкая область)",
  short_description:"Семьям предоставляют в прокат предметы первой необходимости для новорождённых.",
  category:"Помощь и сопровождение", amount:"Бесплатный прокат вещей для новорождённого",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:1 }),
  how_to_apply:["Обратиться в центр социальной защиты населения"], documents:["Паспорт","Свидетельство о рождении ребёнка"],
  tips:["Коляски, кроватки и другие вещи для малыша во временное пользование."], source_url:"https://cszn.admlr.lipetsk.ru/obyavleniya-i-informacziya/semya-i-deti/prokat-predmetov-pervoj-neobhodimosti-dlya-novorozhdennyh/", source_name:SN },

{ ...base, slug:"lpc-022", title:"«Моя няня» — присмотр за детьми до 3 лет (Липецкая область)",
  short_description:"Семьям организуют кратковременный присмотр и уход за детьми до 3 лет — услуга «Моя няня».",
  category:"Помощь и сопровождение", amount:"Бесплатный присмотр за ребёнком",
  segments:["expecting-first","expecting-second","expecting-third-plus","student-family"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:3 }),
  how_to_apply:["Обратиться в центр социальной защиты населения"], documents:["Паспорт","Свидетельство о рождении ребёнка"],
  tips:["Помогает родителям малышей выкроить время на дела или учёбу."], source_url:"https://cszn.admlr.lipetsk.ru/obyavleniya-i-informacziya/semya-i-deti/moya-nyanya/", source_name:SN },

{ ...base, slug:"lpc-023", title:"Премия родителям многодетных семей (Липецкая область)",
  short_description:"Родителям многодетных семей выплачивают областную единовременную премию.",
  category:"Выплаты и пособия", amount:"150 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"],
  tips:["Поощрение многодетных родителей."], source_url:PREM, source_name:SN },

{ ...base, slug:"lpc-024", title:"Премия «Слава Матери» (Липецкая область)",
  short_description:"Женщинам, награждённым почётным знаком Липецкой области «Слава Матери», выплачивают областную единовременную премию.",
  category:"Выплаты и пособия", amount:"75 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение к знаку «Слава Матери»","Свидетельства о рождении детей"],
  tips:["Награда многодетным матерям."], source_url:PREM, source_name:SN },

{ ...base, slug:"lpc-025", title:"Премия «За верность отцовскому долгу» (Липецкая область)",
  short_description:"Мужчинам, награждённым почётным знаком Липецкой области «За верность отцовскому долгу», выплачивают областную единовременную премию.",
  category:"Выплаты и пособия", amount:"75 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение к знаку «За верность отцовскому долгу»","Свидетельства о рождении детей"],
  tips:["Награда многодетным отцам."], source_url:PREM, source_name:SN },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,56)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("ЛИПЕЦКАЯ ОБЛАСТЬ В БАЗЕ ТЕПЕРЬ:", count);
