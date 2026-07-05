// Карачаево-Черкесская Республика — меры поддержки семей с детьми (регион. бюджет).
// Источник: официальная форма субъекта (.docx, запрос Т.В. Буцкой). Общие меры +
// крупный блок для семей СВО. Близкие меры объединены; пропущено единое пособие
// (Закон КЧР № 79, передано СФР — федеральное) → 22 меры. Порталы: mintrudkchr.ru,
// kchr.ru/svo. Запуск: node scripts/_seed-kchr.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Карачаево-Черкесская Республика";
const SN = "Министерство труда и социального развития Карачаево-Черкесской Республики (mintrudkchr.ru)";
const M = "https://www.mintrudkchr.ru/";
const SVO_URL = "https://www.mintrudkchr.ru/page/dlya-chlenov-semey-uchastnikov-svo";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в управление труда и социального развития по месту жительства, через МФЦ или на Госуслугах"];
const HOW_SVO = ["Оформить через координатора помощи участникам СВО, фонд «Защитники Отечества» или орган соцзащиты"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];
const DOCS_SVO = ["Паспорт","Документы, подтверждающие статус участника СВО / члена его семьи","Свидетельство о рождении ребёнка"];

const rows = [
// --- Общие меры ---
{ ...base, slug:"kchr-001", title:"Выплата при рождении второго ребёнка (Карачаево-Черкесская Республика)",
  short_description:"При рождении второго ребёнка семье выплачивают единовременную денежную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата при рождении второго ребёнка",
  segments:["expecting-second"], criteria:reg({ requiresChildren:true, minChildren:2 }),
  how_to_apply:HOW, documents:DOCS, tips:["Отдельная выплата при рождении второго ребёнка."], source_url:M, source_name:SN },

{ ...base, slug:"kchr-002", title:"Выплата при рождении третьего ребёнка (Карачаево-Черкесская Республика)",
  short_description:"При рождении третьего ребёнка семье выплачивают единовременную денежную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата при рождении третьего ребёнка",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:DOCS, tips:["Отдельная выплата при рождении третьего ребёнка."], source_url:M, source_name:SN },

{ ...base, slug:"kchr-003", title:"Республиканский материнский капитал при рождении четвёртого ребёнка (Карачаево-Черкесская Республика)",
  short_description:"При рождении четвёртого или последующего ребёнка семья получает республиканский материнский капитал.",
  category:"Выплаты и пособия", amount:"Республиканский материнский капитал (4-й и последующий ребёнок)",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:4 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в республике"],
  tips:["Выплачивается при рождении четвёртого и последующих детей."], source_url:M, source_name:SN },

{ ...base, slug:"kchr-004", title:"Выплаты многодетным семьям и семьям с родителями-инвалидами (Карачаево-Черкесская Республика)",
  short_description:"Многодетным семьям и семьям, в которых один или оба родителя — инвалиды, предоставляют единовременные денежные выплаты.",
  category:"Выплаты и пособия", amount:"Единовременные денежные выплаты",
  segments:["expecting-third-plus","disability"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи / справка об инвалидности родителя","Свидетельства о рождении детей"],
  tips:["Для многодетных семей и семей, где родитель является инвалидом."], source_url:M, source_name:SN },

{ ...base, slug:"kchr-005", title:"Компенсация 30 % ЖКУ многодетным и семьям с родителями-инвалидами (Карачаево-Черкесская Республика)",
  short_description:"Многодетным семьям и семьям с родителями-инвалидами ежемесячно компенсируют часть расходов на жилищно-коммунальные услуги.",
  category:"Жильё и ипотека", amount:"30 % платы за ЖКУ",
  segments:["expecting-third-plus","disability"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи / справка об инвалидности","Квитанции ЖКУ"],
  tips:["Скидка 30 % на оплату ЖКУ."], source_url:M, source_name:SN },

{ ...base, slug:"kchr-006", title:"Компенсация 50 % обучения детей из многодетных семей (Карачаево-Черкесская Республика)",
  short_description:"Многодетным семьям компенсируют половину стоимости очного платного обучения ребёнка по программам среднего профессионального и высшего образования.",
  category:"Образование", amount:"50 % стоимости обучения (СПО и ВО, очно)",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Договор об обучении","Документы об оплате"],
  tips:["На одного ребёнка из многодетной семьи."], source_url:M, source_name:SN },

{ ...base, slug:"kchr-007", title:"Выплата на улучшение жилищных условий (Карачаево-Черкесская Республика)",
  short_description:"Семьям предоставляют единовременную денежную выплату на улучшение жилищных условий.",
  category:"Жильё и ипотека", amount:"1 000 000 ₽",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы о жилищных условиях"],
  tips:["Крупная выплата на покупку или строительство жилья."], source_url:M, source_name:SN },

{ ...base, slug:"kchr-008", title:"Выплата на школьную одежду семьям с шестью и более детьми (Карачаево-Черкесская Республика)",
  short_description:"Семьям, в которых шесть и более детей, к 1 сентября выплачивают единовременную выплату на приобретение школьной и спортивной одежды.",
  category:"Выплаты и пособия", amount:"Единовременная выплата к 1 сентября",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:6 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Для семей с шестью и более детьми."], source_url:M, source_name:SN },

{ ...base, slug:"kchr-009", title:"Выплата при рождении третьего ребёнка в молодой семье (Карачаево-Черкесская Республика)",
  short_description:"Молодым семьям, где обоим родителям не более 35 лет, при рождении третьего и последующего ребёнка выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата молодой семье",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорта родителей","Свидетельства о рождении детей"],
  tips:["Условие — обоим родителям до 35 лет."], source_url:M, source_name:SN },

{ ...base, slug:"kchr-010", title:"Выплата беременным студенткам (Карачаево-Черкесская Республика)",
  short_description:"Обучающимся очно женщинам при постановке на учёт по беременности выплачивают единовременную выплату.",
  category:"Выплаты и пособия", amount:"Единовременная выплата",
  segments:["expecting-first","student-family"], criteria:reg({ requiresPregnancy:true, requiresStudent:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка о постановке на учёт по беременности","Справка об очном обучении"],
  tips:["Поддержка беременных студенток."], source_url:M, source_name:SN },

{ ...base, slug:"kchr-011", title:"Пункты проката вещей для новорождённых (Карачаево-Черкесская Республика)",
  short_description:"Студенческим, молодым семьям, одиноким матерям и другим нуждающимся выдают в прокат предметы первой необходимости для новорождённых (коляски, кроватки, пеленальные столики и др.).",
  category:"Помощь и сопровождение", amount:"Бесплатный прокат вещей для новорождённого",
  segments:["expecting-first","expecting-second","student-family","single-parent"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:1 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельство о рождении ребёнка"],
  tips:["Коляски, кроватки и другие вещи для малыша во временное пользование."], source_url:M, source_name:SN },

{ ...base, slug:"kchr-012", title:"Бесплатная подготовка к ЭКО (Карачаево-Черкесская Республика)",
  short_description:"Бесплатно обеспечивают прохождение подготовительного этапа программы ЭКО, включая генетические и гормональные исследования и обследования сверх программы ОМС.",
  category:"Здоровье", amount:"Бесплатные обследования сверх ОМС",
  segments:["expecting-first"], criteria:reg({}),
  how_to_apply:["Обратиться в медицинскую организацию, участвующую в программе"], documents:["Паспорт","Полис ОМС","Направление врача"],
  tips:["Помощь парам, планирующим ЭКО."], source_url:M, source_name:SN },

// --- Семьи участников СВО ---
{ ...base, slug:"kchr-013", title:"Республиканский материнский капитал на детей участников СВО (Карачаево-Черкесская Республика)",
  short_description:"Семьям участников СВО предоставляют республиканский материнский капитал на детей.",
  category:"Выплаты и пособия", amount:"Республиканский материнский капитал",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Отдельный капитал для детей участников спецоперации."], source_url:SVO_URL, source_name:SN },

{ ...base, slug:"kchr-014", title:"Внеочередное зачисление и перевод детей участников СВО в детсад и школу (Карачаево-Черкесская Республика)",
  short_description:"Детей участников СВО во внеочередном порядке направляют в детские сады и переводят в другие детсады или школы.",
  category:"Образование", amount:"Внеочередное зачисление и перевод",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Приоритет при зачислении и переводе."], source_url:"https://kchr.ru/svo/", source_name:SN },

{ ...base, slug:"kchr-015", title:"Освобождение от платы за детский сад детям участников СВО (Карачаево-Черкесская Республика)",
  short_description:"Детей участников СВО освобождают от родительской платы за присмотр и уход в детском саду.",
  category:"Образование", amount:"Бесплатный детский сад",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Полное освобождение от платы за детсад."], source_url:SVO_URL, source_name:SN },

{ ...base, slug:"kchr-016", title:"Первоочередная продлёнка для детей участников СВО (Карачаево-Черкесская Республика)",
  short_description:"Детей участников СВО, обучающихся в 1–6 классах, в первоочередном порядке зачисляют в группы продлённого дня.",
  category:"Образование", amount:"Первоочередное зачисление в продлёнку",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Для учеников 1–6 классов."], source_url:SVO_URL, source_name:SN },

{ ...base, slug:"kchr-017", title:"Бесплатные кружки и спортивные секции детям участников СВО (Карачаево-Черкесская Республика)",
  short_description:"Детям участников СВО предоставляют бесплатное посещение кружков и первоочередное зачисление в спортивные секции с бесплатной выдачей экипировки и инвентаря.",
  category:"Культура и отдых", amount:"Бесплатные кружки и секции + экипировка",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Экипировка и инвентарь бесплатно, в том числе в случае гибели участника СВО."], source_url:SVO_URL, source_name:SN },

{ ...base, slug:"kchr-018", title:"Первоочередное зачисление и питание студентов СПО из семей СВО (Карачаево-Черкесская Республика)",
  short_description:"Студентов из семей участников СВО в первоочередном порядке зачисляют на очное обучение в колледжи и компенсируют им бесплатное горячее питание.",
  category:"Образование", amount:"Первоочередное зачисление + компенсация питания",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Для студентов государственных колледжей (СПО, очно)."], source_url:SVO_URL, source_name:SN },

{ ...base, slug:"kchr-019", title:"Профобучение супруги и детей участника СВО (Карачаево-Черкесская Республика)",
  short_description:"Супруге и детям трудоспособного возраста участника СВО организуют профессиональное обучение и дополнительное профессиональное образование.",
  category:"Работа и занятость", amount:"Бесплатное обучение",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true }),
  how_to_apply:["Обратиться в центр занятости населения республики"], documents:DOCS_SVO, tips:["Для трудоспособных членов семьи участника СВО."], source_url:SVO_URL, source_name:SN },

{ ...base, slug:"kchr-020", title:"Социально-психологическая помощь семьям участников СВО (Карачаево-Черкесская Республика)",
  short_description:"Семьям участников СВО оказывают социально-психологическую помощь.",
  category:"Помощь и сопровождение", amount:"Бесплатная психологическая помощь",
  segments:["svo-family"], criteria:reg({ requiresSvoFamily:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Поддержка психолога для всей семьи."], source_url:SVO_URL, source_name:SN },

{ ...base, slug:"kchr-021", title:"Первоочередные путёвки в лагеря детям участников СВО (Карачаево-Черкесская Республика)",
  short_description:"Детей участников СВО в первоочередном порядке бесплатно направляют в детские оздоровительные лагеря на отдых и оздоровление.",
  category:"Культура и отдых", amount:"Бесплатная путёвка (первоочередно)",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Приоритет при распределении путёвок."], source_url:SVO_URL, source_name:SN },

{ ...base, slug:"kchr-022", title:"Льготное питание детям участников СВО 5–11 классов (Карачаево-Черкесская Республика)",
  short_description:"Детям участников СВО (в том числе детям супруги, проживающим в семье), обучающимся в 5–11 классах, предоставляют льготное горячее питание в виде компенсации.",
  category:"Образование", amount:"Компенсация горячего питания",
  segments:["svo-family","schoolchild"], criteria:reg({ requiresSvoFamily:true, requiresChildren:true }),
  how_to_apply:HOW_SVO, documents:DOCS_SVO, tips:["Включая детей супруги, проживающих в семье участника СВО."], source_url:SVO_URL, source_name:SN },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,56)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("КЧР В БАЗЕ ТЕПЕРЬ:", count);
