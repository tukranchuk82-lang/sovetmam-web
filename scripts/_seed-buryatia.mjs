// Республика Бурятия — меры поддержки семей с детьми (республиканский бюджет).
// Источник: официальная форма субъекта (.docx, запрос Т.В. Буцкой), 11 мер,
// прямые URL из таблицы. Портал: Министерство социальной защиты населения
// Республики Бурятия (egov-buryatia.ru/minsoc). Запуск: node scripts/_seed-buryatia.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Республика Бурятия";
const SN = "Министерство социальной защиты населения Республики Бурятия (egov-buryatia.ru)";
const B = "https://egov-buryatia.ru/minsoc/include/RUS/";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в орган социальной защиты населения по месту жительства, через МФЦ или на Госуслугах"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];
const D_MN = ["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"];
const m = (slug,title,short,category,amount,segments,criteria,how,documents,tips,url)=>({...base,slug,title,short_description:short,category,amount,segments,criteria:reg(criteria),how_to_apply:how,documents,tips:[tips],source_url:url,source_name:SN});

const rows = [
m("bur-001","Социальный контракт (Республика Бурятия)","Малообеспеченным семьям оказывают государственную социальную помощь по социальному контракту.","Работа и занятость","Выплаты по социальному контракту (по направлению)",["expecting-first","expecting-second","expecting-third-plus","single-parent"],{requiresChildren:true,requiresLowIncome:true},HOW,["Паспорт","Сведения о доходах семьи","Документы по программе"],"Направления: работа, обучение, ИП/самозанятость, ЛПХ.",B+"sotsialnyy-kontrakt/"),
m("bur-002","Материальная помощь в трудной ситуации (Республика Бурятия)","Гражданам, оказавшимся в трудной жизненной ситуации, выплачивают единовременную материальную помощь.","Помощь и сопровождение","Единовременная материальная помощь",["expecting-first","expecting-second","expecting-third-plus","single-parent"],{requiresChildren:true,requiresLowIncome:true},HOW,DOCS,"Адресная разовая помощь при сложных обстоятельствах.",B+"materialnaya-pomoshch/edinovrem-help/index.php"),
m("bur-003","Выплаты на детей из многодетных семей (Республика Бурятия)","Многодетным семьям выплачивают ежемесячные денежные выплаты на детей.","Выплаты и пособия","Ежемесячные выплаты на детей",["expecting-third-plus"],{requiresChildren:true,minChildren:3},HOW,D_MN,"Базовая выплата для многодетных семей.",B+"MSP_mnogodet/"),
m("bur-004","Компенсация родительской платы за детский сад (Республика Бурятия)","Родителям компенсируют часть платы за присмотр и уход за детьми в детских садах.","Образование","20 % / 50 % / 70 % платы (на 1-го / 2-го / 3-го ребёнка)",["expecting-first","expecting-second","expecting-third-plus"],{requiresChildren:true},["Подать заявление в детский сад"],["Паспорт","Свидетельства о рождении детей","Договор с детским садом"],"Размер компенсации растёт с числом детей.",B+"posobiya-i-vyplaty/kompensatsiya-za-detsad/"),
m("bur-005","Компенсация родителям детей-инвалидов на дому (Республика Бурятия)","Родителям детей-инвалидов, не посещающих детский сад, ежегодно выплачивают денежную компенсацию на воспитание и обучение ребёнка.","Здоровье","Ежегодная денежная компенсация",["disability"],{requiresChildren:true,requiresDisabledChild:true},HOW,["Паспорт","Справка об инвалидности ребёнка","Свидетельство о рождении ребёнка"],"Для детей-инвалидов, воспитываемых дома.",B+"posobiya-i-vyplaty/kompensatsiya-na-vospitanie-i-obuchenie-rebenka-invalida/"),
m("bur-006","Выплата при рождении первого ребёнка (Республика Бурятия)","При рождении или усыновлении первого ребёнка семье выплачивают единовременную выплату.","Выплаты и пособия","Единовременная выплата при рождении первого ребёнка",["expecting-first"],{requiresChildren:true},HOW,DOCS,"Оформляется при рождении первенца.",B+"posobiya-i-vyplaty/vyplata-na-pervogo-rebenka/index.php"),
m("bur-007","Региональный материнский капитал при рождении второго ребёнка (Республика Бурятия)","При рождении второго ребёнка семья получает региональный материнский капитал.","Выплаты и пособия","Региональный материнский капитал (2-й ребёнок)",["expecting-second"],{requiresChildren:true,minChildren:2},HOW,["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в республике"],"Отдельный капитал на второго ребёнка.",B+"posobiya-i-vyplaty/vyplata-na-vtorogo-rebenka/index.php"),
m("bur-008","Республиканский материнский капитал на третьего ребёнка (Республика Бурятия)","При рождении третьего или последующего ребёнка семья получает республиканский материнский капитал.","Выплаты и пособия","Республиканский материнский капитал (3-й и последующий ребёнок)",["expecting-third-plus"],{requiresChildren:true,minChildren:3},HOW,["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в республике"],"Отдельный капитал на третьего и последующих детей.",B+"posobiya-i-vyplaty/respublikanskiy-matkapital-pri-rozhi-tretego-ili-posled-detey/"),
m("bur-009","Бесплатный проезд детям из многодетных семей (Республика Бурятия)","Детям из многодетных семей, обучающимся в школах, предоставляют бесплатный проезд.","Транспорт","Бесплатный проезд",["schoolchild","expecting-third-plus"],{requiresChildren:true,minChildren:3},HOW,D_MN,"Для школьников из многодетных семей.","https://egov-buryatia.ru/minsoc/press_center/news/detail.php?ID=184802"),
m("bur-010","Компенсация обучения детей из многодетных семей по СПО (Республика Бурятия)","Многодетным семьям компенсируют часть стоимости платного обучения детей по программам среднего профессионального образования.","Образование","Компенсация части стоимости обучения (СПО)",["expecting-third-plus","schoolchild"],{requiresChildren:true,minChildren:3},HOW,["Паспорт","Удостоверение многодетной семьи","Договор об обучении","Документы об оплате"],"Для платного обучения в колледжах.",B+"posobiya-i-vyplaty/kompensatsiya-chasti-stoimosti-obucheniya-detey-iz-mnogodetnykh-semey-po-obrazovatelnym-programmam-s/index.php"),
m("bur-011","Компенсация найма жилья отдельным категориям (Республика Бурятия)","Отдельным категориям граждан компенсируют расходы на оплату жилья по договору найма.","Жильё и ипотека","Компенсация расходов за наём жилья",["single-parent","expecting-third-plus","foster-family"],{requiresChildren:true},HOW,["Паспорт","Договор найма жилья","Документы о льготной категории"],"Для льготных категорий, снимающих жильё.",B+"posobiya-i-vyplaty/kompensatsiya-raskhodov-otdelnym-kategoriyam-grazhdan/"),
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; } else ok++;
}
console.log(`DONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("РЕСПУБЛИКА БУРЯТИЯ В БАЗЕ ТЕПЕРЬ:", count);
