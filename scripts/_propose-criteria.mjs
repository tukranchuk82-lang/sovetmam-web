// Предложения условий для оставшихся регионов.
//
// Робот читает название и описание меры и предлагает добавить условие, если
// оно там названо прямым текстом, а в отборе его нет. Ничего не удаляет и не
// выдумывает. Список читаю я и решаю, что применять.
//
// Главное правило: КАТЕГОРИИ семьи (многодетная, малоимущая, СВО, опека,
// инвалидность, одинокий родитель) складываются через ИЛИ, если их в тексте
// несколько: «многодетным, малоимущим и семьям с детьми-инвалидами» — это три
// разные группы, а не требование быть всеми сразу. Если категория одна, она
// становится обязательным условием.
//
// Признаки РЕБЁНКА и семьи (возраст, школа, село, ипотека, учёт по жилью)
// складываются через И: они сужают, а не перечисляют.
//
// Запуск: node scripts/_propose-criteria.mjs [регион]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const DONE = new Set(["Чувашская Республика", "Москва", "Саратовская область", "Рязанская область", "Московская область", "Санкт-Петербург", "Смоленская область", "Краснодарский край", "Челябинская область", "Ростовская область", "Нижегородская область", "Иркутская область"]);

const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,region,criteria,short_description,eligibility")
    .eq("is_published", true).not("region", "is", null).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const only = process.argv[2];
const list = rows.filter((m) => (only ? m.region === only : !DONE.has(m.region)));

const knows = (c, keys) =>
  keys.some((k) => (c ?? {})[k] != null) ||
  ((c ?? {}).anyOf ?? []).some((s) => keys.some((k) => s[k] != null));

/** Категории семьи: несколько в тексте — значит ИЛИ. */
const CATEGORIES = [
  ["многодетн", /многодетн/i, ["minChildren"], { minChildren: 3 }],
  ["малоимущ", /малоимущ|малообеспеченн|ниже прожиточного минимума|низк(им|ий) доход/i,
   ["requiresLowIncome", "maxIncomePm"], { requiresLowIncome: true }],
  ["СВО", /\bСВО\b|мобилизованн|специальной военной операции/,
   ["requiresSvoFamily", "requiresSvoRole"], { requiresSvoFamily: true }],
  ["опека", /усыновител|усыновивш|опекун|попечител|приёмн(ой|ым|ая) сем|патронатн|сирот/i,
   ["requiresFosterParent"], { requiresFosterParent: true }],
  ["инвалидность", /ребёнк(а|у|ом)-инвалид|детей-инвалидов|дет(и|ям|ей) с инвалидностью|ребёнка с инвалидностью|с ОВЗ/i,
   ["requiresDisabledChild", "requiresSpecialNeedsChild"], { requiresDisabledChild: true }],
  ["одинокий родитель", /одинок(ой|им|ая|ому) мат|единственн(ый|ому) родител|неполн(ая|ой|ым) семь/i,
   ["requiresSingleParent"], { requiresSingleParent: true }],
  ["студент", /студент|обучающ(ихся|имся) очно|очной формы обучения/i,
   ["requiresStudent", "requiresChildStudying"], { requiresStudent: true }],
];

/** Признаки, которые всегда сужают: их складываем через И. */
const NARROW = [
  [/школьник|обучающ(ихся|имся) в школ|учащ(ихся|имся) школ|1[–-]4 класс|5[–-]11 класс|школьн(ой|ую) форм/i,
   ["minSchoolChildren"], { minSchoolChildren: 1 }],
  [/детск(ий|ом|ого) сад|дошкольн|присмотр и уход/i,
   ["childAgeToMonths", "hasChildAgedTo", "maxYoungestChildAgeYears"], { hasChildAgedTo: 7 }],
  [/до тр[её]х лет|до 3 лет/i,
   ["childAgeToMonths", "maxYoungestChildAgeYears", "hasChildAgedTo"], { maxYoungestChildAgeYears: 3 }],
  [/до полутора лет|до 1,5 лет/i,
   ["childAgeToMonths", "maxYoungestChildAgeYears", "hasChildAgedTo"], { maxYoungestChildAgeYears: 1.5 }],
  [/до шести лет|до 6 лет/i,
   ["childAgeToMonths", "maxYoungestChildAgeYears", "hasChildAgedTo"], { hasChildAgedTo: 6 }],
  [/сельск(ой|их) местност|на селе|сельских территори/i, ["requiresSettlement"],
   { requiresSettlement: ["village"] }],
  [/неработающ(ему|ей|им)/i, ["requiresNotEmployed"], { requiresNotEmployed: true }],
  [/нуждающ(имися|ейся|ихся) в жиль|улучшени(е|и) жилищных услови|состоящ(им|ей|ие) на учёте/i,
   ["requiresHousingNeed"], { requiresHousingNeed: true }],
  [/ипотек/i, ["requiresMortgage", "requiresMortgageIntent"], { requiresMortgageIntent: true }],
];

/**
 * Срок обращения ставим только разовым выплатам и подаркам при рождении.
 * У капиталов, сертификатов и участков срока нет: их оформляют и через годы.
 */
const ONCE_AT_BIRTH = /единовременн|пособие при рождении|выплата при рождении|подарок|подарочн|набор новорождённому|на товары для новорождённ/i;
const NO_DEADLINE = /капитал|земельн|участок|сертификат на улучшение/i;

const out = [];
for (const m of list) {
  const text = [m.title, m.short_description ?? "", m.eligibility ?? ""].join(" ");
  const add = {};
  const notes = [];

  const cats = CATEGORIES.filter(([, re, keys]) => re.test(text) && !knows(m.criteria, keys));
  if (cats.length === 1) {
    Object.assign(add, cats[0][3]);
    notes.push("категория: " + cats[0][0]);
  } else if (cats.length > 1 && !(m.criteria ?? {}).anyOf) {
    add.anyOf = cats.map(([, , , patch]) => patch);
    notes.push("несколько категорий → ИЛИ: " + cats.map((c) => c[0]).join(", "));
  } else if (cats.length > 1) {
    notes.push("категорий несколько, но anyOf уже есть — смотрю руками");
  }

  for (const [re, keys, patch] of NARROW) {
    if (re.test(text) && !knows(m.criteria, keys)) Object.assign(add, patch);
  }

  if (/при рождении|на рождение|новорождённ/i.test(text) &&
      ONCE_AT_BIRTH.test(m.title) && !NO_DEADLINE.test(m.title) &&
      !knows(m.criteria, ["childAgeToMonths", "maxYoungestChildAgeYears", "hasChildAgedTo"])) {
    add.childAgeToMonths = 12;
    add.appliesToExpecting = true;
    notes.push("разовая выплата при рождении — срок год");
  }

  if (Object.keys(add).length) out.push({ ...m, add, notes });
}
out.sort((a, b) => (a.region ?? "").localeCompare(b.region ?? "") || a.slug.localeCompare(b.slug));
let region = null;
for (const m of out) {
  if (m.region !== region) { region = m.region; console.log(`\n═══ ${region}`); }
  console.log(`${m.slug} · ${m.title.replace(/ \([^)]+\)$/, "").slice(0, 66)}`);
  console.log(`     было ${JSON.stringify(m.criteria)}`);
  console.log(`   + ${JSON.stringify(m.add)}${m.notes.length ? "   // " + m.notes.join("; ") : ""}`);
}
writeFileSync("scripts/_proposals.json", JSON.stringify(out.map(({ slug, region, title, criteria, add }) => ({ slug, region, title, criteria, add })), null, 1), "utf8");
console.log(`\nпредложений: ${out.length} на ${new Set(out.map((m) => m.region)).size} регионов`);
