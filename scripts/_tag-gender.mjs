// Расставляет criteria.gender у мер, положенных только женщинам или только мужчинам.
// Запуск: node scripts/_tag-gender.mjs          — только показать список
//         node scripts/_tag-gender.mjs --apply  — записать в базу
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const apply = process.argv.includes("--apply");

const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("slug,title,criteria").range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}

// Явно мужские — по ручной проверке названий.
// Смешанный адресат — не размечаем.
const SKIP = new Set(["edinoe-posobie", "tyumen-005", "blg-013"]);
const MALE = new Set(["bel-otcovskaya-slava", "vol-006", "lpc-025", "kostroma-031", "saha-022"]);

// Однозначно женское: адресат — женщина, даже если в названии есть слово «семья».
const FEMALE_STRONG = /женщин|(^|[^а-яё])ЭКО([^а-яё]|$)|бесплоди|мать-геро|мать геро|мамам|мамы|маме|матерям|слава матери|ненан сий|материнск(ая|ой) (слава|доблесть)|медаль материнства|родовой сертификат|родовая сумка|по беременности и родам/i;
// Женское, но только если в названии нет «детям/семье/жене…»: тогда адресат смешанный.
const FEMALE_WEAK = /беременн|кормящ|студентк|школьниц/i;
const MIXED = /дет(ей|ям|и)([^а-яё]|$)|детск|семь|семей|жене|жён|жена|ребёнк|новорожд|снво|СВО|прокат|товар|отц|родител/i;

const toTag = [];
for (const m of rows) {
  const t = m.title;
  let g = null;
  if (SKIP.has(m.slug)) g = null;
  else if (MALE.has(m.slug)) g = "male";
  else if (/отц/i.test(t)) g = null;
  else if (FEMALE_STRONG.test(t) && !/родител/i.test(t)) g = "female";
  else if (FEMALE_WEAK.test(t) && !MIXED.test(t)) g = "female";
  if (g && m.criteria?.gender !== g) toTag.push({ slug: m.slug, title: t, g, criteria: m.criteria ?? {} });
}

console.log(`К пометке: ${toTag.length} (жен ${toTag.filter((x) => x.g === "female").length}, муж ${toTag.filter((x) => x.g === "male").length})`);
for (const x of toTag) console.log(`${x.g === "male" ? "М" : "Ж"} ${x.slug} | ${x.title.slice(0, 95)}`);
writeFileSync("_gender-plan.json", JSON.stringify(toTag.map(({ slug, g }) => ({ slug, g })), null, 1));

if (apply) {
  for (const x of toTag) {
    const { error } = await sb.from("measures").update({ criteria: { ...x.criteria, gender: x.g } }).eq("slug", x.slug);
    if (error) throw new Error(`${x.slug}: ${error.message}`);
  }
  console.log("Записано.");
}
