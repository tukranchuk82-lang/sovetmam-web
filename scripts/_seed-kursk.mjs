// Курская область — меры поддержки семей с детьми (региональный бюджет).
// Источник: официальная форма субъекта (.docx, запрос Т.В. Буцкой). Строка с
// перечнем выплат разложена на отдельные меры → 20 мер. Порталы: mso.kursk.ru,
// kursk.ru, kurskzdrav.ru, dorupr.rkursk.ru, deinekagallery.ru.
// Запуск: node scripts/_seed-kursk.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Курская область";
const SN = "Министерство социального обеспечения, материнства и детства Курской области (mso.kursk.ru)";
const MSO = "https://mso.kursk.ru/deyatelnost/sotsialnaya-zashchita-naseleniya/sotsialnye-vyplaty/sotsialnaya-podderzhka-semey-s-detmi/";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в орган социального обеспечения по месту жительства, через МФЦ или на Госуслугах"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];

const rows = [
{ ...base, slug:"krsk-001", title:"Бесплатное посещение Галереи Дейнеки (Курская область)",
  short_description:"Дети до 16 лет бесплатно посещают Курскую картинную галерею имени А. Дейнеки; многодетным семьям — бесплатное экскурсионное обслуживание в последний четверг месяца.",
  category:"Культура и отдых", amount:"Бесплатно",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Предъявить документы в кассе галереи"], documents:["Документы, удостоверяющие личность / удостоверение многодетной семьи"],
  tips:["Экскурсии для многодетных — в последний четверг каждого месяца."], source_url:"https://www.deinekagallery.ru/posetitelyam/stoimost-biletov/", source_name:SN },

{ ...base, slug:"krsk-002", title:"Бесплатное питание обучающихся (Курская область)",
  short_description:"Обучающимся в общеобразовательных и профессиональных образовательных организациях предоставляют бесплатное питание.",
  category:"Образование", amount:"Бесплатное питание",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Подать заявление в образовательную организацию"], documents:["Паспорт","Справка об обучении","Документы о льготной категории"],
  tips:["Дополняет федеральное питание для 1–4 классов."], source_url:"https://www.gosuslugi.ru/677335/1/form", source_name:SN },

{ ...base, slug:"krsk-003", title:"Первоочередной приём в детсад детям студентов (Курская область)",
  short_description:"Детей, чьи родители обучаются очно, принимают в детские сады в первоочередном порядке.",
  category:"Образование", amount:"Первоочередное зачисление в детский сад",
  segments:["student-family"], criteria:reg({ requiresStudent:true, requiresChildren:true }),
  how_to_apply:["Указать льготу при подаче заявления в детский сад"], documents:["Паспорта родителей","Справки об очном обучении","Свидетельство о рождении ребёнка"],
  tips:["Приоритет при зачислении в детсад для студенческих семей."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-004", title:"Льготный проезд многодетным по Карте жителя (Курская область)",
  short_description:"Родителям, имеющим на иждивении трёх и более детей, а также студентам очной формы до 23 лет предоставляют льготный проезд по Карте жителя Курской области.",
  category:"Транспорт", amount:"Льготный проезд",
  segments:["expecting-third-plus","student-family"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Карта жителя Курской области"],
  tips:["В городском и пригородном сообщении."], source_url:"http://dorupr.rkursk.ru/documents", source_name:SN },

{ ...base, slug:"krsk-005", title:"Бесплатный проезд школьников из многодетных семей и детей СВО (Курская область)",
  short_description:"Бесплатный проезд по транспортной карте учащегося предоставляют детям из многодетных семей, детям-сиротам, а также детям до 18 лет участников СВО, обучающимся в школах Курска.",
  category:"Транспорт", amount:"Бесплатный проезд",
  segments:["schoolchild","expecting-third-plus","foster-family","svo-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Транспортная карта учащегося","Документы о льготной категории"],
  tips:["По транспортной карте учащегося в Курске."], source_url:"http://dorupr.rkursk.ru/documents", source_name:SN },

{ ...base, slug:"krsk-006", title:"Областной материнский капитал (Курская область)",
  short_description:"При рождении третьего и каждого последующего ребёнка семья получает областной материнский капитал.",
  category:"Выплаты и пособия", amount:"Областной материнский капитал (3-й и последующий ребёнок)",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в области"],
  tips:["Дополняет федеральный материнский капитал."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-007", title:"Выплата при рождении тройни и более (Курская область)",
  short_description:"Семьям при одновременном рождении трёх и более детей выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"100 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей (одновременное рождение)"],
  tips:["Право — при одновременном рождении трёх и более детей."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-008", title:"Выплата на школьную форму (Курская область)",
  short_description:"Многодетным семьям ежегодно выплачивают денежную выплату на школьную форму (или заменяющий комплект одежды) и спортивную форму для детей-школьников.",
  category:"Выплаты и пособия", amount:"Ежегодная выплата на школьную и спортивную форму",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Выплачивается ежегодно к учебному году."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-009", title:"Пособие студенческим семьям и одиноким родителям-студентам (Курская область)",
  short_description:"Малообеспеченным семьям, где оба родителя — студенты, и одиноким родителям-студентам выплачивают ежемесячное пособие до окончания обучения.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие",
  segments:["student-family","single-parent"], criteria:reg({ requiresChildren:true, requiresStudent:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорта родителей","Справки об обучении","Сведения о доходах семьи"],
  tips:["Выплачивается до окончания обучения одного из родителей."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-010", title:"Пособие при рождении второго ребёнка до 3 лет (Курская область)",
  short_description:"Семьям при рождении второго ребёнка выплачивают ежемесячное пособие до достижения им трёх лет.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие на ребёнка до 3 лет",
  segments:["expecting-second"], criteria:reg({ requiresChildren:true, minChildren:2, maxYoungestChildAgeYears:3 }),
  how_to_apply:HOW, documents:DOCS, tips:["Отдельное пособие при рождении второго ребёнка."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-011", title:"Компенсация расходов на коммунальные услуги (Курская область)",
  short_description:"Многодетным семьям компенсируют часть расходов на коммунальные услуги.",
  category:"Жильё и ипотека", amount:"Компенсация расходов на ЖКУ",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Квитанции ЖКУ"],
  tips:["Компенсирует часть коммунальных платежей."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-012", title:"Компенсация обучения детей из многодетных семей (Курская область)",
  short_description:"Многодетным семьям компенсируют часть стоимости обучения детей.",
  category:"Образование", amount:"Компенсация части стоимости обучения",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Договор об обучении","Документы об оплате"],
  tips:["Для платного обучения детей из многодетных семей."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-013", title:"Пособие многодетным с восемью и более детьми (Курская область)",
  short_description:"Многодетным семьям, в составе которых восемь и более детей, выплачивают ежемесячное пособие.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:8 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"],
  tips:["Для семей с восемью и более детьми."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-014", title:"Пособие при усыновлении второго и последующих детей (Курская область)",
  short_description:"Семьям при усыновлении (удочерении) второго, третьего и каждого последующего ребёнка выплачивают ежемесячное пособие.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие",
  segments:["foster-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Обратиться в орган опеки и попечительства"], documents:["Паспорт","Документы об усыновлении","Свидетельство о рождении ребёнка"],
  tips:["При усыновлении второго и последующих детей."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-015", title:"Выплата при усыновлении ребёнка (Курская область)",
  short_description:"Семьям при усыновлении (удочерении) ребёнка выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата при усыновлении",
  segments:["foster-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Обратиться в орган опеки и попечительства"], documents:["Паспорт","Документы об усыновлении","Свидетельство о рождении ребёнка"],
  tips:["Разовая поддержка при усыновлении."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-016", title:"Выплата на продукты питания беременным, кормящим и детям до 3 лет (Курская область)",
  short_description:"Беременным женщинам, кормящим матерям и детям до трёх лет ежемесячно выплачивают денежную выплату на приобретение продуктов питания.",
  category:"Здоровье", amount:"Ежемесячная выплата на продукты питания",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:3 }),
  how_to_apply:HOW, documents:["Паспорт","Заключение врача","Свидетельство о рождении ребёнка / справка о беременности"],
  tips:["Охватывает и будущих мам."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-017", title:"Выплата при рождении третьего ребёнка в молодой семье (Курская область)",
  short_description:"Молодым семьям при рождении третьего или последующего ребёнка выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата молодой семье",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорта родителей","Свидетельства о рождении детей"],
  tips:["Для молодых семей при рождении 3-го и последующих детей."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-018", title:"Выплата при рождении ребёнка в студенческой семье (Курская область)",
  short_description:"Студенческим семьям при рождении ребёнка выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата студенческой семье",
  segments:["student-family","expecting-first","expecting-second"], criteria:reg({ requiresChildren:true, requiresStudent:true }),
  how_to_apply:HOW, documents:["Паспорта родителей","Справки об обучении","Свидетельство о рождении ребёнка"],
  tips:["Поддержка родителей, совмещающих учёбу и ребёнка."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-019", title:"Компенсация взамен земельного участка многодетным (Курская область)",
  short_description:"Многодетным семьям вместо бесплатного земельного участка выплачивают единовременную компенсационную выплату.",
  category:"Жильё и ипотека", amount:"Единовременная компенсация взамен участка",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы о постановке на учёт на участок"],
  tips:["Альтернатива бесплатному земельному участку."], source_url:MSO, source_name:SN },

{ ...base, slug:"krsk-020", title:"Бесплатные лекарства детям до 6 лет (Курская область)",
  short_description:"Детей в возрасте до 6 лет бесплатно обеспечивают лекарствами по рецептам.",
  category:"Здоровье", amount:"Бесплатные лекарства по рецепту (дети до 6 лет)",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:6 }),
  how_to_apply:["Получить рецепт у врача и обратиться в аптеку, отпускающую льготные лекарства"], documents:["Полис ОМС","Льготный рецепт","Свидетельство о рождении ребёнка"],
  tips:["Для всех детей до 6 лет по рецептам врачей."], source_url:"https://kurskzdrav.ru/ru/population/pharmaceutical-support-for-preferential-citizens/", source_name:SN },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,56)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("КУРСКАЯ ОБЛАСТЬ В БАЗЕ ТЕПЕРЬ:", count);
