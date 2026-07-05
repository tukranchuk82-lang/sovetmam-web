// Херсонская область — меры поддержки семей с детьми (региональный бюджет).
// Источник: официальное письмо и.о. министра М.А. Островской (pdf, на имя
// Т.В. Буцкой). Новый регион, 8 мер. Портал: mintrud.khogov.ru.
// Запуск: node scripts/_seed-kherson.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Херсонская область";
const SN = "Министерство труда и социальной защиты Херсонской области (mintrud.khogov.ru)";
const G = "https://gov.khogov.ru/documents/";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в орган социальной защиты населения по месту жительства или через МФЦ"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];
const D_MN = ["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"];
const m = (slug,title,short,category,amount,segments,criteria,how,documents,tips,url)=>({...base,slug,title,short_description:short,category,amount,segments,criteria:reg(criteria),how_to_apply:how,documents,tips:[tips],source_url:url,source_name:SN});

const rows = [
m("khers-001","Выплата на ребёнка под опекой (Херсонская область)","На ребёнка, находящегося под опекой или попечительством, выплачивают ежемесячную выплату.","Выплаты и пособия","Ежемесячная выплата на подопечного ребёнка",["foster-family"],{requiresChildren:true},["Обратиться в орган опеки и попечительства"],["Паспорт опекуна","Документы об установлении опеки","Свидетельство о рождении ребёнка"],"Для опекунов и попечителей.",G+"postanovlenie-pravitelstva-hersonskoj-oblasti-ot-24-12-2024-№-223-pp-o-predostavlenii-soczialnyh-vyplat-otdelnym-kategoriyam-grazhdan/"),
m("khers-002","Выплата одиноким матерям и отцам (Херсонская область)","Одиноким матерям (отцам) выплачивают ежемесячную выплату на ребёнка.","Выплаты и пособия","Ежемесячная выплата",["single-parent"],{requiresChildren:true,requiresSingleParent:true},HOW,DOCS,"Для одиноких родителей.",G+"postanovlenie-pravitelstva-hersonskoj-oblasti-ot-24-12-2024-№-223-pp-o-predostavlenii-soczialnyh-vyplat-otdelnym-kategoriyam-grazhdan/"),
m("khers-003","Компенсация ЖКУ отдельным категориям (Херсонская область)","Отдельным категориям граждан компенсируют расходы на оплату жилья и коммунальных услуг.","Жильё и ипотека","Компенсация расходов на ЖКУ",["expecting-third-plus","disability","single-parent"],{requiresChildren:true},HOW,["Паспорт","Документы о льготной категории","Квитанции ЖКУ"],"Для льготных категорий граждан.","https://khogov.ru/documents/zakon-hersonskoj-oblasti-ot-28-10-2024-№-75-zho-o-kompensaczii-rashodov-na-oplatu-zhilogo-pomeshheniya-i-kommunalnyh-uslug-na-territorii-hersonskoj-oblasti/"),
m("khers-004","Компенсация на твёрдое топливо (Херсонская область)","Отдельным категориям граждан компенсируют расходы на приобретение твёрдого бытового топлива.","Жильё и ипотека","Компенсация расходов на топливо",["expecting-third-plus","disability","single-parent"],{requiresChildren:true},HOW,["Паспорт","Документы о льготной категории","Документы на жильё с печным отоплением"],"Для домов с печным отоплением.",G+"postanovlenie-pravitelstva-hersonskoj-oblasti-ot-19-01-2026-№-01-pp-o-mere-soczialnoj-podderzhki-v-denezhnom-vyrazhenii-na-priobretenie-tverdogo-bytovogo-topliva-grazhdan-otdelnyh-kate/"),
m("khers-005","Компенсация на спортивную форму многодетным (Херсонская область)","Многодетным семьям ежегодно компенсируют расходы на приобретение спортивной формы для детей.","Выплаты и пособия","Ежегодная компенсация на спортивную форму",["schoolchild","expecting-third-plus"],{requiresChildren:true,minChildren:3},HOW,D_MN,"Помощь к учебному году.",G+"postanovlenie-pravitelstva-hersonskoj-oblasti-ot-19-08-2025-№-107-pp-ob-utverzhdenii-poryadka-i-uslovij-predostavleniya-mer-soczialnoj-podderzhki-mnogodetnym-semyam-na-territorii-hersons/"),
m("khers-006","Субсидия на газовое оборудование при догазификации (Херсонская область)","Отдельным категориям граждан предоставляют субсидию на покупку и установку газоиспользующего оборудования при догазификации.","Жильё и ипотека","Субсидия на газовое оборудование",["expecting-third-plus","single-parent","disability"],{requiresChildren:true},HOW,["Паспорт","Документы о льготной категории","Договор на догазификацию"],"Помогает подключить дом к газу.",G+"postanovlenie-pravitelstva-hersonskoj-oblasti-ot-12-08-2024-№-112-pp-ob-utverzhdenii-poryadka-predostavleniya-subsidii-otdelnym-kategoriyam-grazhdan-prozhivayushhih-v-hersonskoj-oblasti-na/"),
m("khers-007","Социальный контракт (Херсонская область)","Малоимущим семьям оказывают государственную социальную помощь на основании социального контракта.","Работа и занятость","Выплаты по социальному контракту (по направлению)",["expecting-first","expecting-second","expecting-third-plus","single-parent"],{requiresChildren:true,requiresLowIncome:true},HOW,["Паспорт","Сведения о доходах семьи","Документы по программе"],"Направления: работа, обучение, ИП/самозанятость, ЛПХ.",G+"postanovlenie-pravitelstva-hersonskoj-oblasti-ot-26-12-2023-№-93-pp-o-predostavlenii-gosudarstvennoj-soczialnoj-pomoshhi-na-osnovanii-soczialnogo-kontrakta/"),
m("khers-008","Удостоверение многодетной семьи (Херсонская область)","Многодетным семьям выдают удостоверение, подтверждающее их статус.","Помощь и сопровождение","Удостоверение многодетной семьи",["expecting-third-plus"],{requiresChildren:true,minChildren:3},HOW,D_MN,"Даёт доступ ко всем льготам для многодетных.",G+"postanovlenie-pravitelstva-hersonskoj-oblasti-ot-12-08-2024-№-113-pp-o-poryadke-vydachi-udostovereniya-podtverzhdayushhego-status-mnogodetnoj-semi-v-rossijskoj-federaczii/"),
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; } else ok++;
}
console.log(`DONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("ХЕРСОНСКАЯ ОБЛАСТЬ В БАЗЕ ТЕПЕРЬ:", count);
