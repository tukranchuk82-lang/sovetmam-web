// Забайкальский край — меры поддержки семей с детьми (региональный бюджет).
// Источник: официальная форма субъекта (.docx, запрос Т.В. Буцкой), 7 мер.
// Портал: Министерство труда и социальной защиты населения Забайкальского
// края (soczashita-chita.ru). Запуск: node scripts/_seed-zabaikalie.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});

const REGION = "Забайкальский край";
const SN = "Министерство труда и социальной защиты населения Забайкальского края (soczashita-chita.ru)";
const B = "https://soczashita-chita.ru";
const U_FAM = B + "/семьям-имеющим-детей-2/";
const base = { level:"regional", region:REGION, updated_at_label:"2026", is_published:true, sort_order:0 };
const reg = (extra={}) => ({ regions:[REGION], ...extra });
const HOW = ["Подать заявление в отдел социальной защиты населения по месту жительства, через МФЦ или на Госуслугах"];
const DOCS = ["Паспорт заявителя","Свидетельство о рождении ребёнка","Сведения о доходах семьи (при оценке нуждаемости)"];

const rows = [
{ ...base, slug:"zab-001",
  title:"Выплата при рождении первого ребёнка (Забайкальский край)",
  short_description:"При рождении первого ребёнка семье выплачивают единовременную выплату в размере двукратного прожиточного минимума на детей.",
  category:"Выплаты и пособия", amount:"2 × прожиточного минимума на ребёнка",
  segments:["expecting-first"], criteria:reg({ requiresChildren:true }),
  how_to_apply:HOW, documents:DOCS,
  tips:["Размер считается от прожиточного минимума на детей в крае."],
  source_url:B, source_name:SN },

{ ...base, slug:"zab-002",
  title:"Региональный материнский капитал при рождении второго ребёнка (Забайкальский край)",
  short_description:"При рождении второго ребёнка семья получает региональный материнский (семейный) капитал.",
  category:"Выплаты и пособия", amount:"Региональный материнский капитал (2-й ребёнок)",
  segments:["expecting-second"], criteria:reg({ requiresChildren:true, minChildren:2 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Сведения о месте жительства в крае"],
  tips:["Дополняет федеральный материнский капитал."],
  source_url:B, source_name:SN },

{ ...base, slug:"zab-003",
  title:"Компенсация ЖКУ многодетным и семьям участников СВО (Забайкальский край)",
  short_description:"Многодетным семьям ежемесячно компенсируют расходы на отопление и электроснабжение; для семей участников СВО размер компенсации повышен.",
  category:"Жильё и ипотека", amount:"30 % (семьям участников СВО — 70 %)",
  segments:["expecting-third-plus","svo-family"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Документы на жильё","Квитанции ЖКУ"],
  tips:["Для семей участников СВО компенсация — 70 % вместо 30 %."],
  source_url:U_FAM, source_name:SN },

{ ...base, slug:"zab-004",
  title:"Ежемесячная выплата на третьего ребёнка (Забайкальский край)",
  short_description:"На третьего ребёнка семье выплачивают ежемесячную денежную выплату до достижения им 18 лет (при очном обучении — до окончания учёбы, но не более 23 лет).",
  category:"Выплаты и пособия", amount:"Ежемесячная выплата на третьего ребёнка",
  segments:["expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Свидетельства о рождении детей","Справка об обучении (для детей старше 18 лет)"],
  tips:["Продлевается до 23 лет, если ребёнок учится очно."],
  source_url:U_FAM, source_name:SN },

{ ...base, slug:"zab-005",
  title:"Ежегодная выплата на школьную одежду многодетным (Забайкальский край)",
  short_description:"Многодетным семьям ежегодно выплачивают денежную выплату на обеспечение детей-школьников одеждой для учебных занятий и спортивной формой.",
  category:"Выплаты и пособия", amount:"Ежегодная выплата на одежду и спортивную форму",
  segments:["schoolchild","expecting-third-plus"], criteria:reg({ requiresChildren:true, minChildren:3 }),
  how_to_apply:HOW, documents:["Паспорт","Удостоверение многодетной семьи","Справка об обучении"],
  tips:["Выплачивается ежегодно к учебному году."],
  source_url:U_FAM, source_name:SN },

{ ...base, slug:"zab-006",
  title:"Пособие на ребёнка (Забайкальский край)",
  short_description:"Малообеспеченным семьям выплачивают ежемесячное пособие на ребёнка до 16 лет (для обучающихся — до окончания школы, но не более 18 лет).",
  category:"Выплаты и пособия", amount:"Ежемесячное пособие на ребёнка (при доходе ниже прожиточного минимума)",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:DOCS,
  tips:["Назначается при среднедушевом доходе семьи ниже прожиточного минимума."],
  source_url:U_FAM, source_name:SN },

{ ...base, slug:"zab-007",
  title:"Социальный контракт (Забайкальский край)",
  short_description:"Малообеспеченным семьям оказывают государственную социальную помощь по социальному контракту — на поиск работы, обучение, своё дело или преодоление трудной ситуации.",
  category:"Работа и занятость", amount:"Выплаты по социальному контракту (по направлению)",
  segments:["expecting-first","expecting-second","expecting-third-plus","single-parent"], criteria:reg({ requiresChildren:true, requiresLowIncome:true }),
  how_to_apply:HOW, documents:["Паспорт","Сведения о доходах семьи","Документы по программе социального контракта"],
  tips:["Направления: поиск работы, профобучение, ИП/самозанятость, личное подсобное хозяйство."],
  source_url:B+"/гсп/", source_name:SN },
];

let ok=0, fail=0;
for (const r of rows){
  const { error } = await sb.from("measures").upsert(r, { onConflict:"slug" });
  if(error){ console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug, "—", r.title.slice(0,58)); ok++; }
}
console.log(`\nDONE: ${ok} upserted, ${fail} failed`);
const { count } = await sb.from("measures").select("*",{count:"exact",head:true}).eq("region",REGION);
console.log("ЗАБАЙКАЛЬСКИЙ КРАЙ В БАЗЕ ТЕПЕРЬ:", count);
