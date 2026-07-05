// Донецкая Народная Республика — меры поддержки семей с детьми (регион. бюджет).
// Источник: официальная форма субъекта (.odt, запрос Т.В. Буцкой). Опирается
// на Закон ДНР 230-РЗ (опека/приёмные семьи) и 200-РЗ (многодетные семьи).
// Первая строка — сводка блока опеки, детсад продублирован → 13 мер.
// Новый регион: большинство выплат — федеральные; здесь региональный блок.
// Запуск: node scripts/_seed-dnr.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Донецкая Народная Республика";
const SN = "Правительство Донецкой Народной Республики / Закон ДНР (glavadnr.ru)";
const L230 = "https://glavadnr.ru/doc/zakony/230rz.pdf";
const L200 = "https://glavadnr.ru/doc/zakony/200rz.pdf";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в управление труда и социальной защиты населения по месту жительства или через МФЦ"];
const HOW_OPEKA = ["Обратиться в орган опеки и попечительства по месту жительства"];

const rows = [
{ ...base, slug:"dnr-001",
  title:"Пособие на содержание детей-сирот под опекой (Донецкая Народная Республика)",
  short_description:"На содержание детей-сирот и детей, оставшихся без попечения родителей, над которыми установлена опека или попечительство, выплачивают ежемесячное пособие.",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие на содержание подопечного ребёнка",
  segments:["foster-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_OPEKA, documents:["Паспорт опекуна (попечителя)","Документы об установлении опеки","Свидетельство о рождении ребёнка"],
  tips:["Назначается опекуну или попечителю ребёнка."],
  source_url:L230, source_name:SN },

{ ...base, slug:"dnr-002",
  title:"Вознаграждение приёмным родителям (Донецкая Народная Республика)",
  short_description:"Приёмным родителям выплачивают вознаграждение за воспитание детей, принятых в семью.",
  category:"Выплаты и пособия", amount:"Ежемесячное вознаграждение приёмному родителю",
  segments:["foster-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_OPEKA, documents:["Паспорт приёмного родителя","Договор о приёмной семье","Свидетельства о рождении детей"],
  tips:["Выплачивается по договору о приёмной семье."],
  source_url:L230, source_name:SN },

{ ...base, slug:"dnr-003",
  title:"Доплата к вознаграждению приёмным родителям (Донецкая Народная Республика)",
  short_description:"Приёмным родителям устанавливают доплату к вознаграждению (например, за детей с особенностями здоровья).",
  category:"Выплаты и пособия", amount:"Доплата к вознаграждению",
  segments:["foster-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_OPEKA, documents:["Паспорт приёмного родителя","Договор о приёмной семье","Документы, дающие право на доплату"],
  tips:["Повышенный размер за отдельные категории приёмных детей."],
  source_url:L230, source_name:SN },

{ ...base, slug:"dnr-004",
  title:"Единоразовая помощь при создании приёмной семьи (Донецкая Народная Республика)",
  short_description:"При заключении впервые договора о приёмной семье выплачивают единоразовую денежную помощь.",
  category:"Выплаты и пособия", amount:"Единоразовая помощь при заключении договора",
  segments:["foster-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW_OPEKA, documents:["Паспорт приёмного родителя","Договор о приёмной семье (первый)"],
  tips:["Выплачивается один раз — при первом заключении договора о приёмной семье."],
  source_url:L230, source_name:SN },

{ ...base, slug:"dnr-005",
  title:"Выплата на школьную и спортивную одежду многодетным (Донецкая Народная Республика)",
  short_description:"Многодетным семьям ежегодно выплачивают денежную выплату на каждого ребёнка на одежду для учебных занятий и спортивную форму на весь период обучения.",
  category:"Выплаты и пособия", amount:"Ежегодная выплата на одежду и спортивную форму",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Выплачивается ежегодно на каждого ребёнка-школьника."],
  source_url:L200, source_name:SN },

{ ...base, slug:"dnr-006",
  title:"Бесплатное посещение музеев и парков многодетными (Донецкая Народная Республика)",
  short_description:"Многодетным семьям бесплатно посещают музеи, выставки, парки культуры и отдыха республиканского ведения.",
  category:"Культура и отдых", amount:"Бесплатно",
  segments:["expecting-third-plus","schoolchild"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Предъявить удостоверение многодетной семьи в кассе учреждения"],
  documents:["Удостоверение многодетной семьи","Документы, удостоверяющие личность"],
  tips:["Возможность семейного досуга без затрат."],
  source_url:L200, source_name:SN },

{ ...base, slug:"dnr-007",
  title:"Первоочередной приём в детский сад (Донецкая Народная Республика)",
  short_description:"Детям из отдельных категорий семей предоставляют первоочередное право приёма в дошкольные образовательные организации.",
  category:"Образование", amount:"Первоочередное зачисление в детский сад",
  segments:["expecting-third-plus","disability","svo-family"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Указать льготу при подаче заявления в детский сад"],
  documents:["Паспорт","Свидетельство о рождении ребёнка","Документ, подтверждающий льготную категорию"],
  tips:["Право на первоочередное зачисление в детский сад."],
  source_url:L200, source_name:SN },

{ ...base, slug:"dnr-008",
  title:"Бесплатное питание школьников (Донецкая Народная Республика)",
  short_description:"Обучающимся в общеобразовательных организациях предоставляют бесплатное питание.",
  category:"Образование", amount:"Бесплатное питание",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:["Подать заявление в школу"], documents:["Паспорт","Справка об обучении","Документы о льготной категории"],
  tips:["Дополняет федеральное бесплатное питание для учеников 1–4 классов."],
  source_url:L200, source_name:SN },

{ ...base, slug:"dnr-009",
  title:"Бесплатные лекарства детям до 6 лет (Донецкая Народная Республика)",
  short_description:"Детей в возрасте до 6 лет бесплатно обеспечивают лекарственными препаратами по рецептам.",
  category:"Здоровье", amount:"Бесплатные лекарства по рецепту (дети до 6 лет)",
  segments:["expecting-first","expecting-second","expecting-third-plus"], criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:6 }),
  how_to_apply:["Получить рецепт у врача и обратиться в аптеку, отпускающую льготные лекарства"],
  documents:["Полис ОМС","Льготный рецепт","Свидетельство о рождении ребёнка"],
  tips:["Для всех детей до 6 лет по рецептам врачей."],
  source_url:L200, source_name:SN },

{ ...base, slug:"dnr-010",
  title:"Земельный участок с инфраструктурой многодетным (Донецкая Народная Республика)",
  short_description:"Многодетным семьям содействуют в предоставлении земельных участков, обеспеченных необходимыми объектами инфраструктуры.",
  category:"Жильё и ипотека", amount:"Земельный участок с инфраструктурой",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"],
  tips:["Участки предоставляются с инженерной инфраструктурой."],
  source_url:L200, source_name:SN },

{ ...base, slug:"dnr-011",
  title:"Содействие многодетным в улучшении жилищных условий (Донецкая Народная Республика)",
  short_description:"Многодетным семьям содействуют в улучшении жилищных условий.",
  category:"Жильё и ипотека", amount:"Содействие в улучшении жилищных условий",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы о жилищных условиях"],
  tips:["Для многодетных семей, нуждающихся в улучшении жилья."],
  source_url:L200, source_name:SN },

{ ...base, slug:"dnr-012",
  title:"Льгота 30 % на оплату ЖКУ многодетным (Донецкая Народная Республика)",
  short_description:"Многодетным семьям предоставляют льготу по оплате жилья и коммунальных услуг.",
  category:"Жильё и ипотека", amount:"30 % от установленного размера оплаты ЖКУ",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы на жильё","Квитанции ЖКУ"],
  tips:["Скидка 30 % на плату за жильё и коммунальные услуги."],
  source_url:L200, source_name:SN },

{ ...base, slug:"dnr-013",
  title:"Бесплатный проезд школьников (Донецкая Народная Республика)",
  short_description:"Обучающимся в общеобразовательных организациях предоставляют бесплатный проезд в городском и пригородном автомобильном и городском наземном электрическом транспорте.",
  category:"Транспорт", amount:"Бесплатный проезд для школьников",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт родителя","Справка об обучении","Свидетельство о рождении ребёнка"],
  tips:["Кроме такси; в пределах территории республики."],
  source_url:L200, source_name:SN },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,58)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("ДНР В БАЗЕ ТЕПЕРЬ:", count);
