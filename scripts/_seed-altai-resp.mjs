// Республика Алтай — меры поддержки семей с детьми (республиканский бюджет).
// Источник: официальная форма субъекта (.docx, запрос Т.В. Буцкой), 6 мер для
// многодетных (Закон РА 70-РЗ) + маткапитал (44-РЗ). Сумм в источнике нет.
// Запуск: node scripts/_seed-altai-resp.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Республика Алтай";
const SN = "Министерство труда, социального развития и занятости населения Республики Алтай (mintrud-altay.ru)";
const U = "https://mintrud-altay.ru/";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в орган социальной поддержки населения по месту жительства, через МФЦ или на Госуслугах"];
const D_MN = ["Паспорт","Удостоверение многодетной семьи","Свидетельства о рождении детей"];
const m = (slug,title,short,category,amount,segments,criteria,how,documents,tips)=>({...base,slug,title,short_description:short,category,amount,segments,criteria:reg(criteria),how_to_apply:how,documents,tips:[tips],source_url:U,source_name:SN});

const rows = [
m("ralt-001","Компенсация ЖКУ многодетным семьям (Республика Алтай)","Многодетным семьям компенсируют оплату коммунальных услуг в пределах нормативов, а живущим в домах без центрального отопления — расходы на топливо.","Жильё и ипотека","Компенсация ЖКУ (в пределах нормативов)",["expecting-third-plus"],{requiresChildren:true,minChildren:3},HOW,["Паспорт","Удостоверение многодетной семьи","Квитанции ЖКУ"],"Для домов без центрального отопления — компенсация топлива."),
m("ralt-002","Бесплатный проезд детям из многодетных семей (Республика Алтай)","Детям из многодетных семей, обучающимся в образовательных организациях, предоставляют бесплатный проезд на общественном транспорте.","Транспорт","Бесплатный проезд (кроме такси)",["schoolchild","expecting-third-plus"],{requiresChildren:true,minChildren:3},HOW,D_MN,"На муниципальных и межмуниципальных маршрутах."),
m("ralt-003","Бесплатное питание школьников и студентов из многодетных семей (Республика Алтай)","Детям из многодетных семей, обучающимся в школах и колледжах республики, предоставляют бесплатное питание.","Образование","Бесплатное питание",["schoolchild","expecting-third-plus"],{requiresChildren:true,minChildren:3},["Подать заявление в образовательную организацию"],["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],"В школах и колледжах республики."),
m("ralt-004","Компенсация на школьные нужды многодетным (Республика Алтай)","Многодетным семьям с доходом ниже прожиточного минимума ежегодно компенсируют расходы на школьные нужды (форму, спортивную форму, канцтовары) на каждого ребёнка-школьника.","Выплаты и пособия","Ежегодная компенсация на школьные нужды",["schoolchild","expecting-third-plus"],{requiresChildren:true,minChildren:3,requiresLowIncome:true},HOW,D_MN,"При доходе семьи ниже прожиточного минимума."),
m("ralt-005","Региональный материнский капитал (Республика Алтай)","При рождении третьего или четвёртого ребёнка семья получает региональный материнский капитал.","Выплаты и пособия","Региональный материнский капитал (3-й или 4-й ребёнок)",["expecting-third-plus"],{requiresChildren:true,minChildren:3},HOW,["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в республике"],"Дополняет федеральный материнский капитал."),
m("ralt-006","Бесплатные лекарства детям до 6 лет из многодетных семей (Республика Алтай)","Детей до 6 лет из многодетных семей бесплатно обеспечивают лекарствами по рецептам.","Здоровье","Бесплатные лекарства (дети до 6 лет)",["expecting-first","expecting-second","expecting-third-plus"],{requiresChildren:true,minChildren:3,maxYoungestChildAgeYears:6},["Получить рецепт у врача и обратиться в аптеку, отпускающую льготные лекарства"],["Полис ОМС","Льготный рецепт","Удостоверение многодетной семьи"],"Для детей до 6 лет из многодетных семей."),
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; } else ok++;
}
console.log(`DONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("РЕСПУБЛИКА АЛТАЙ В БАЗЕ ТЕПЕРЬ:", count);
