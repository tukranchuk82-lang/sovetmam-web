// Применение правок сверки за 19-е (Шаг 1: безопасные — суммы + условия отбора).
// Бэкап уже в verification/backup-day-19.json. Сухой прогон по умолчанию;
// запись — с флагом --apply. Критерии — только валидные поля EligibilityCriteria.
// Запуск: node scripts/_apply-sverka-day19.mjs        (сухой прогон)
//         node scripts/_apply-sverka-day19.mjs --apply (запись)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split(/\r?\n/).filter(l=>l&&!l.startsWith("#")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1)];}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const APPLY = process.argv.includes("--apply");

const cur = Object.fromEntries(
  JSON.parse(readFileSync("verification/backup-day-19.json","utf8")).map(m=>[m.slug,m])
);
const RT="Республика Татарстан", RH="Республика Хакасия", TU="Республика Тыва", OS="Республика Северная Осетия — Алания";

// Правки: { slug: { поле: новое_значение } }. Меняем только перечисленные поля.
const edits = {
  // --- ТАТАРСТАН ---
  "tat-003": {
    title: "Бесплатные лекарства детям до 6 лет из многодетных семей (Республика Татарстан)",
    short_description: "Детям до шести лет из семей с тремя и более детьми республика безвозмездно предоставляет лекарственные средства по перечню, утверждённому Кабинетом Министров Татарстана.",
    criteria: { regions:[RT], minChildren:3, requiresFamily:true },
    segments: ["expecting-third","expecting-fourth","expecting-fifth-plus","many-children","topic-health","class-free","class-situational"],
    documents: Array.from(new Set([...(cur["tat-003"].documents||[]), "Удостоверение многодетной семьи"])),
    tips: ["Мера действует для многодетных семей (трое и более детей до 18 лет).","Детям до 3 лет лекарства бесплатны по федеральному правилу для всех семей; в многодетных семьях право расширено до 6 лет.","Перечень препаратов устанавливает Кабинет Министров республики."],
  },
  "tat-005": {
    amount: "100 000 ₽ — за первого ребёнка женщине до 25 лет; 200 000 ₽ — за третьего и последующих женщине до 29 лет",
    documents: ["Паспорт (постоянное проживание в сельской местности/ПГТ не менее 3 лет)","Свидетельство о рождении ребёнка"],
    tips: ["Условие — постоянное проживание в сельской местности или посёлке городского типа не менее трёх лет на дату обращения.","Сумма и возраст зависят от очерёдности ребёнка: первый — до 25 лет (100 000 ₽), третий и последующие — до 29 лет (200 000 ₽).","Заявление подать не позднее 6 месяцев со дня рождения ребёнка."],
  },
  "tat-006": { criteria: { regions:[RT], requiresFamily:true, minChildren:5 } },
  "tat-009": { criteria: { regions:[RT], requiresFamily:true, requiresDisabledChild:true } },
  "rtadd-003": { criteria: { regions:[RT], requiresParentUnder35:true, requiresFamily:true } },
  "rtadd-005": { amount: "Ставка 7% годовых, срок до 28,5 лет, взнос 10%; субсидия 200 000 ₽ при рождении ребёнка" },
  "rtadd-008": { amount: "20% родительской платы на первого ребёнка, 50% — на второго, 70% — на третьего и последующих детей" },
  "rtadd-009": { criteria: { regions:[RT], requiresChildren:true, requiresLowIncome:true } },

  // --- ХАКАСИЯ ---
  "hak-008": {
    criteria: { regions:[RH], requiresChildren:true, anyOf:[{maxYoungestChildAgeYears:3},{minChildren:3, maxYoungestChildAgeYears:6}] },
    short_description: "Детей до 3 лет и детей до 6 лет из многодетных семей бесплатно обеспечивают лекарствами по рецепту врача.",
    tips: ["До 3 лет — всем детям; до 6 лет — детям из многодетных семей."],
  },
  "hak-013": {
    criteria: { regions:[RH], requiresChildren:true, minChildren:3, requiresLowIncome:true },
    short_description: "Ребёнку из многодетной малоимущей семьи, поступившему в вуз, выплачивают единовременную материальную помощь.",
    tips: ["Разовая помощь 10 000 ₽ при доходе семьи ниже прожиточного минимума. Приём заявлений 1 июня – 31 октября."],
  },
  "hak-014": {
    criteria: { regions:[RH], requiresStudent:true, requiresChildren:true, minChildren:3, requiresLowIncome:true },
    short_description: "Обучающимся из многодетных малоимущих семей (школы и колледжи) предоставляют бесплатное питание.",
    tips: ["Дополняет федеральное бесплатное питание для 1–4 классов."],
  },
  "hak-015": {
    criteria: { regions:[RH], requiresChildren:true, minChildren:3, requiresLowIncome:true },
    tips: ["Для многодетных семей с доходом ниже прожиточного минимума. Приём заявлений 1 июня – 25 августа."],
  },
  "hak-018": {
    amount: "114 364,80 ₽ (228 729,60 ₽ для проживающих в малых сёлах)",
    short_description: "Семьям при рождении (усыновлении) третьего или последующего ребёнка выдают сертификат на республиканский материнский (семейный) капитал.",
    tips: ["Можно направить на улучшение жилищных условий, образование или лечение детей. Обратиться можно через 2,5 года после рождения ребёнка."],
  },
  "hak-021": { criteria: { regions:[RH], minChildren:7, requiresChildren:true }, amount: "Бесплатный пассажирский микроавтобус" },
  "hak-022": {
    criteria: { regions:[RH], minChildren:7, requiresChildren:true },
    amount: "Единовременная помощь до 600 000 ₽",
    short_description: "Семьям с семью и более детьми предоставляют единовременную финансовую помощь на погашение части затрат на приобретение жилья.",
  },

  // --- ТЫВА ---
  "tuva-001": {
    amount: "Единовременная выплата 10 000 ₽ при одновременном рождении двоих и более детей",
    tips: ["Подать заявление можно в течение года со дня рождения детей.","Выплата не зависит от дохода семьи."],
  },
  "tuva-002": {
    criteria: { regions:[TU], minChildren:5, requiresFamily:true },
    short_description: "Семьям, воспитывающим пятерых и более детей, предоставляют региональный материнский капитал на улучшение жилищных условий, образование или лечение детей.",
    amount: "Региональный материнский капитал (единовременно, для семей с пятью и более детьми)",
    segments: ["expecting-fifth-plus","many-children","topic-money","class-money","class-once-life"],
    tips: ["Положен семьям с пятью и более детьми.","Средства можно направить на жильё, образование или лечение детей."],
  },
  "tuva-005": { tips: ["Для школьников из многодетных семей.","Действует на муниципальных регулярных маршрутах (не такси и не коммерческие)."] },
  "tuva-006": { amount: "Компенсация 50% стоимости горячего питания", how_to_apply: ["Подать заявление в орган социальной защиты населения по месту жительства или через МФЦ"] },
  "tuva-007": { amount: "Компенсация расходов на проезд (около 10 560 ₽ в год на ребёнка)" },
  "tuva-008": {
    criteria: { regions:[TU], requiresChildren:true, anyOf:[{minChildren:4, requiresLowIncome:true},{requiresSvoFamily:true}] },
    short_description: "Многодетным семьям (с четырьмя и более детьми) с печным отоплением и невысоким доходом, а также семьям участников СВО раз в год перед отопительным сезоном предоставляют твёрдое топливо (уголь или дрова).",
    amount: "Твёрдое топливо раз в год: около 2 т угля или ~4,8 куб. м дров",
    tips: ["Для многодетных семей (4+ детей) с печным отоплением и доходом не выше прожиточного минимума.","Отдельно — семьям погибших, пропавших без вести и получивших инвалидность участников СВО."],
  },
  "tuva-009": { tips: ["В первую очередь — детям из семей в трудной жизненной ситуации и льготных категорий."] },
  "tuva-012": { tips: Array.from(new Set([...(cur["tuva-012"].tips||[]), "Для многодетных семей в Туве порог доли расходов на ЖКУ снижен до 15% (обычный — 22%)."])) },

  // --- СЕВЕРНАЯ ОСЕТИЯ ---
  "osetia-001": { short_description: "Детей из отдельных льготных категорий семей во внеочередном или первоочередном порядке направляют в детские сады республики." },
  "osetia-003": {
    short_description: "Студентам очной формы обучения по программам среднего профессионального образования из льготных категорий (сироты, дети с инвалидностью и ОВЗ, из малоимущих и многодетных семей, дети участников СВО) в государственных колледжах республики предоставляют бесплатное горячее питание.",
    how_to_apply: ["Подать заявление в образовательную организацию","Приложить справку о льготной категории (при необходимости — из органа соцзащиты)"],
    documents: ["Паспорт","Справка об обучении","Документы о льготной категории","Справка из органа соцзащиты (для малоимущих)"],
    tips: ["Мера для льготных категорий студентов, а не для всех очников. Уточните перечень в своём колледже."],
    criteria: { regions:[OS], requiresStudent:true, requiresChildren:true, anyOf:[{requiresLowIncome:true},{minChildren:3},{requiresDisabledChild:true},{requiresFosterParent:true},{requiresSvoFamily:true}] },
  },
};

const short = (v)=>{ const s = Array.isArray(v)?JSON.stringify(v):(typeof v==="object"?JSON.stringify(v):String(v)); return s.length>110?s.slice(0,110)+"…":s; };
let changes=0, ok=0, fail=0;
for (const [slug, fields] of Object.entries(edits)) {
  const c = cur[slug];
  if (!c) { console.log("!! НЕТ В БЭКАПЕ:", slug); fail++; continue; }
  console.log(`\n# ${slug}`);
  for (const [f,v] of Object.entries(fields)) {
    const before = short(c[f]);
    const after = short(v);
    if (before===after) { console.log(`  = ${f}: без изменений`); continue; }
    console.log(`  · ${f}:`);
    console.log(`      было:  ${before}`);
    console.log(`      стало: ${after}`);
    changes++;
  }
  if (APPLY) {
    const { error } = await sb.from("measures").update(fields).eq("slug", slug);
    if (error) { console.log("  FAIL:", error.message); fail++; } else { ok++; }
  }
}
console.log(`\n${APPLY?"ЗАПИСАНО":"СУХОЙ ПРОГОН"}: мер ${Object.keys(edits).length}, изменений полей ${changes}` + (APPLY?`, успешно ${ok}, ошибок ${fail}`:""));
if (!APPLY) console.log("Для записи: node scripts/_apply-sverka-day19.mjs --apply");
