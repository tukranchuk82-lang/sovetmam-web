// Астраханская область — меры поддержки семей с детьми (региональный бюджет).
// Источник: официальная форма субъекта (xlsx, запрос Т.В. Буцкой) — 20 строк
// (стр.3 пустая). НПА и прямые URL взяты из таблицы. Пропущена №15 «Субсидия
// на оплату ЖКУ» (ПП РФ № 761 — федеральная). Итого 18 региональных мер.
// Основной закон: ОЗ от 22.12.2016 № 85/2016-ОЗ. Запуск: node scripts/_seed-astrakhan.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Астраханская область";
const SN = "Министерство социального развития и труда Астраханской области (minsoctrud.astrobl.ru)";
const SN_CULT = "Министерство культуры Астраханской области (minkult.astrobl.ru)";
const SN_SPORT = "Министерство физической культуры и спорта Астраханской области";
const SN_EDU = "Министерство образования и науки Астраханской области (minobr.astrobl.ru)";
const SN_HEALTH = "Министерство здравоохранения Астраханской области";
const B = "https://minsoctrud.astrobl.ru";
const DIR = B + "/deyatelnost/napravleniya-deyatelnosti/socialnaya-podderzhka-i-socialnaya-pomosch.htm";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в Министерство соцразвития и труда (центр соцподдержки) по месту жительства, через МФЦ или на Госуслугах"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];

const rows = [
{ ...base, slug:"astra-001",
  title:"Пособие на ребёнка (Астраханская область)",
  short_description:"Малообеспеченным семьям выплачивают ежемесячное региональное пособие на ребёнка.",
  category:"Выплаты и пособия",
  amount:"Ежемесячное пособие на ребёнка (при доходе ниже прожиточного минимума)",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent"],
  criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:DOCS,
  tips:["Назначается при среднедушевом доходе семьи ниже прожиточного минимума."],
  source_url:B+"/napravleniya-deyatelnosti/posobie-na-rebenka", source_name:SN },

{ ...base, slug:"astra-002",
  title:"Компенсация родительской платы за детский сад (Астраханская область)",
  short_description:"Родителям компенсируют часть платы за присмотр и уход за детьми в детских садах области.",
  category:"Образование",
  amount:"20 % / 50 % / 70 % платы (на 1-го / 2-го / 3-го ребёнка)",
  segments:["expecting-first","expecting-second","expecting-third-plus"],
  criteria:reg({ requiresChildren:true }),
  how_to_apply:["Подать заявление в детский сад или Министерство соцразвития и труда"],
  documents:["Паспорт","Свидетельства о рождении детей","Договор с детским садом"],
  tips:["Размер компенсации растёт с числом детей в семье."],
  source_url:B+"/deyatelnost/napravleniya-deyatelnosti/poluchenie-kompensacii-chasti-roditelskoy-platy-za-prismotr-i-uhod-za-detmi-poseschayuschimi-obrazovatelnye-organizacii-realizuyuschie-obrazovatelnuyu-programmu-doshkolnogo-obrazovaniya-nahodyaschiesya-na-territorii-astrahanskoy-oblasti-i-e.htm", source_name:SN },

{ ...base, slug:"astra-003",
  title:"Бесплатное посещение учреждений культуры многодетными (Астраханская область)",
  short_description:"Многодетным семьям предоставляют право на бесплатное посещение определённых организаций культуры и государственных образовательных организаций области один день в месяц.",
  category:"Культура и отдых",
  amount:"Бесплатно (один день в месяц)",
  segments:["expecting-third-plus","schoolchild"],
  criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Предъявить удостоверение многодетной семьи в кассе учреждения"],
  documents:["Удостоверение многодетной семьи","Документы, удостоверяющие личность"],
  tips:["Перечень учреждений определяет Правительство Астраханской области."],
  source_url:"https://minkult.astrobl.ru/activity/directions/mery-socialnoy-podderzhki.htm", source_name:SN_CULT },

{ ...base, slug:"astra-004",
  title:"Пособие на оплату ЖКУ на каждого члена многодетной семьи (Астраханская область)",
  short_description:"Многодетным семьям выплачивают ежемесячное пособие на оплату жилого помещения и коммунальных услуг на каждого члена семьи.",
  category:"Жильё и ипотека",
  amount:"Ежемесячное пособие на ЖКУ (на каждого члена семьи)",
  segments:["expecting-third-plus"],
  criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы на жильё","Квитанции ЖКУ"],
  tips:["Считается на каждого члена многодетной семьи."],
  source_url:B+"/napravleniya-deyatelnosti/ezhemesyachnoe-posobie-na-oplatu-kommunalnyh-uslug-mnogodetnoy-seme", source_name:SN },

{ ...base, slug:"astra-005",
  title:"Компенсация доставки топлива в дома без центрального отопления (Астраханская область)",
  short_description:"Семьям, живущим в домах без центрального отопления, компенсируют расходы на оплату транспортных услуг по доставке топлива.",
  category:"Жильё и ипотека",
  amount:"Денежная компенсация транспортных услуг по доставке топлива",
  segments:["expecting-third-plus"],
  criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы на жильё без центрального отопления"],
  tips:["Размер компенсации устанавливает Правительство Астраханской области."],
  source_url:DIR, source_name:SN },

{ ...base, slug:"astra-006",
  title:"Ежегодное пособие на школьную одежду и принадлежности многодетным (Астраханская область)",
  short_description:"Многодетным семьям ежегодно выплачивают пособие на каждого ребёнка-школьника (до 18 лет) на одежду для занятий, спортивную форму и школьные письменные принадлежности.",
  category:"Выплаты и пособия",
  amount:"Ежегодное пособие на одежду и школьные принадлежности",
  segments:["schoolchild","expecting-third-plus"],
  criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["На каждого ребёнка-школьника не старше 18 лет."],
  source_url:DIR, source_name:SN },

{ ...base, slug:"astra-007",
  title:"Пособие на проезд школьников из многодетных семей (Астраханская область)",
  short_description:"Многодетным семьям выплачивают ежемесячное пособие на оплату проезда детей, обучающихся в школах.",
  category:"Транспорт",
  amount:"Ежемесячное пособие на проезд школьника",
  segments:["schoolchild","expecting-third-plus"],
  criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Для учеников начальной, основной и средней школы."],
  source_url:DIR, source_name:SN },

{ ...base, slug:"astra-008",
  title:"Бесплатные спортивные секции для многодетных (Астраханская область)",
  short_description:"Членам многодетных семей доступно бесплатное посещение секций в государственных спортивных организациях области.",
  category:"Культура и отдых",
  amount:"Бесплатно",
  segments:["expecting-third-plus","schoolchild"],
  criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:["Обратиться в государственную спортивную организацию с удостоверением многодетной семьи"],
  documents:["Удостоверение многодетной семьи","Документы, удостоверяющие личность"],
  tips:["Занятия в государственных организациях в сфере физкультуры и спорта."],
  source_url:B+"/deyatelnost/napravleniya-deyatelnosti/socialnaya-podderzhka-mnogodetnyh-semey.htm", source_name:SN_SPORT },

{ ...base, slug:"astra-009",
  title:"Пособие на питание школьников из многодетных семей (Астраханская область)",
  short_description:"Многодетным семьям выплачивают ежемесячное пособие на питание на каждого ребёнка, обучающегося в школе.",
  category:"Образование",
  amount:"Ежемесячное пособие на питание школьника",
  segments:["schoolchild","expecting-third-plus"],
  criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Дополняет бесплатное горячее питание в школах."],
  source_url:DIR, source_name:SN },

{ ...base, slug:"astra-010",
  title:"Бесплатные лекарства детям до 6 лет (Астраханская область)",
  short_description:"Детям в возрасте до шести лет бесплатно предоставляют лекарства по рецептам врачей при амбулаторном лечении.",
  category:"Здоровье",
  amount:"Бесплатные лекарства по рецепту (дети до 6 лет)",
  segments:["expecting-first","expecting-second","expecting-third-plus"],
  criteria:reg({ requiresChildren:true, maxYoungestChildAgeYears:6 }),
  how_to_apply:["Получить рецепт у врача и обратиться в аптеку, отпускающую льготные лекарства"],
  documents:["Полис ОМС","Льготный рецепт","Свидетельство о рождении ребёнка"],
  tips:["За счёт средств бюджета Астраханской области, при амбулаторной помощи."],
  source_url:"https://www.одкб30.рф/ru/prosecutor/mery-socialnoy-podderzhki-mnogodetnym-semyam", source_name:SN_HEALTH },

{ ...base, slug:"astra-011",
  title:"Путёвки в лагеря и санатории для детей (Астраханская область)",
  short_description:"Детям предоставляют путёвки в организации отдыха и оздоровления (не чаще раза в год), а также в санаторно-курортные организации при наличии медицинских показаний.",
  category:"Культура и отдых",
  amount:"Бесплатная путёвка (не чаще одного раза в год)",
  segments:["schoolchild","expecting-third-plus"],
  criteria:reg({ requiresChildren:true }),
  how_to_apply:["Обратиться в Министерство образования и науки области / орган соцзащиты"],
  documents:["Паспорт родителя","Свидетельство о рождении ребёнка","Медицинские документы (для санатория)"],
  tips:["Санаторные путёвки — при наличии медицинских показаний и отсутствии противопоказаний."],
  source_url:"https://minobr.astrobl.ru/deyatelnost/otdyx-detei-i-ix-ozdorovlenie", source_name:SN_EDU },

{ ...base, slug:"astra-012",
  title:"Компенсация обучения детей из многодетных семей по СПО (Астраханская область)",
  short_description:"Многодетным семьям компенсируют часть стоимости очного обучения детей по программам среднего профессионального образования в организациях области.",
  category:"Образование",
  amount:"Фактические затраты, но не более 18 294,73 ₽ за учебный год на ребёнка",
  segments:["expecting-third-plus","schoolchild"],
  criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Договор об обучении (СПО, очно)","Документы об оплате обучения"],
  tips:["Только для организаций СПО на территории Астраханской области."],
  source_url:DIR, source_name:SN },

{ ...base, slug:"astra-013",
  title:"Матпомощь при рождении тройни и более (Астраханская область)",
  short_description:"Семьям при рождении или усыновлении одновременно трёх и более детей выплачивают единовременную материальную помощь.",
  category:"Выплаты и пособия",
  amount:"Единовременная материальная помощь (тройня и более)",
  segments:["expecting-third-plus"],
  criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей (одновременное рождение)"],
  tips:["Право — при одновременном рождении (усыновлении) трёх и более детей."],
  source_url:DIR, source_name:SN },

{ ...base, slug:"astra-014",
  title:"Пособие на оплату проезда ребёнка-инвалида (Астраханская область)",
  short_description:"Семьям с ребёнком-инвалидом выплачивают ежемесячное пособие на оплату его проезда.",
  category:"Транспорт",
  amount:"Ежемесячное пособие на проезд ребёнка-инвалида",
  segments:["disability"],
  criteria:reg({ requiresChildren:true, requiresDisabledChild:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка об инвалидности ребёнка","Свидетельство о рождении ребёнка"],
  tips:["Назначается на ребёнка-инвалида."],
  source_url:B+"/napravleniya-deyatelnosti/ezhemesyachnoe-posobie-na-oplatu-proezda-rebenka-invalida", source_name:SN },

{ ...base, slug:"astra-015",
  title:"Выплата на лечение ребёнка-инвалида (Астраханская область)",
  short_description:"Семьям с ребёнком-инвалидом предоставляют денежную выплату в связи с его лечением.",
  category:"Здоровье",
  amount:"До 15 000 ₽",
  segments:["disability"],
  criteria:reg({ requiresChildren:true, requiresDisabledChild:true }),
  how_to_apply:HOW, documents:["Паспорт","Справка об инвалидности ребёнка","Документы, подтверждающие расходы на лечение"],
  tips:["Выплачивается в связи с лечением ребёнка-инвалида."],
  source_url:B+"/deyatelnost/napravleniya-deyatelnosti/socialnaya-i-materialnaya-pomosch.htm", source_name:SN },

{ ...base, slug:"astra-016",
  title:"Субсидия на газовое оборудование при догазификации (Астраханская область)",
  short_description:"Отдельным категориям семей предоставляют субсидию на покупку и установку газоиспользующего оборудования и работы по подключению к газовым сетям при догазификации.",
  category:"Жильё и ипотека",
  amount:"До 100 000 ₽",
  segments:["expecting-third-plus","single-parent","disability"],
  criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о льготной категории","Документы на домовладение","Договор на догазификацию"],
  tips:["Покрывает оборудование и работы внутри границ земельного участка."],
  source_url:B+"/search?search=газификац", source_name:SN },

{ ...base, slug:"astra-017",
  title:"Материальная помощь на газификацию домовладения (Астраханская область)",
  short_description:"Отдельным категориям семей выплачивают единовременную материальную помощь на газификацию домовладения.",
  category:"Жильё и ипотека",
  amount:"До 100 000 ₽",
  segments:["expecting-third-plus","single-parent","disability"],
  criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:["Паспорт","Документы о льготной категории","Документы на домовладение","Документы о расходах на газификацию"],
  tips:["Отдельная выплата на работы по газификации дома."],
  source_url:B+"/search?search=газификац", source_name:SN },

{ ...base, slug:"astra-018",
  title:"Социальный контракт (Астраханская область)",
  short_description:"Малообеспеченным семьям оказывают государственную социальную помощь на основании социального контракта — на поиск работы, обучение, своё дело или преодоление трудной ситуации.",
  category:"Работа и занятость",
  amount:"Выплаты по социальному контракту (по направлению)",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent"],
  criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Сведения о доходах семьи","Документы по программе социального контракта"],
  tips:["Направления: поиск работы, профобучение, ИП/самозанятость, личное подсобное хозяйство."],
  source_url:B+"/deyatelnost/napravleniya-deyatelnosti/socialnyy-kontrakt.htm", source_name:SN },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,60)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("АСТРАХАНСКАЯ ОБЛАСТЬ В БАЗЕ ТЕПЕРЬ:", count);
