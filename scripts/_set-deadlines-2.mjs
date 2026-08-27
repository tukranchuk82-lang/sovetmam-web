// Будильник, вторая часть: беременность и годовые окна.
//
// after-birth здесь не годится: у беременных отсчёт идёт от срока
// беременности, а у части мер срок привязан к календарю — «до 1 октября».
//
// Что не трогаю: сроки рассмотрения заявления («решение за 30 дней»),
// закрытые программы и даты окончания программ вроде «ипотека действует до
// 2030 года» — это не то, к чему человеку надо успеть.
//
// Запуск: node scripts/_set-deadlines-2.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

const DEADLINES = {
  // Встать на учёт нужно до 12 недель — позже право не появится.
  "vedenie-beremennosti-oms": { kind: "pregnancy-weeks", weeks: 12 },
  "kirov-019": { kind: "pregnancy-weeks", weeks: 12 },
  "chao-007": { kind: "pregnancy-weeks", weeks: 12 },
  "tamb-002": { kind: "pregnancy-weeks", weeks: 12 },
  "spb-009": { kind: "pregnancy-weeks", weeks: 12 },
  "ryaz-001": { kind: "pregnancy-weeks", weeks: 12 },
  "smol-013": { kind: "pregnancy-weeks", weeks: 12 },
  "rst-014": { kind: "pregnancy-weeks", weeks: 12 },
  "chuv-018": { kind: "pregnancy-weeks", weeks: 12 },
  "nnov-004": { kind: "pregnancy-weeks", weeks: 12 },

  // Отказ от набора социальных услуг в пользу денег подают до 1 октября,
  // и он начинает действовать только со следующего года.
  "nabor-socialnyh-uslug": {
    kind: "year-window",
    fromMonth: 1,
    fromDay: 1,
    toMonth: 10,
    toDay: 1,
    note: "Чтобы получать НСУ деньгами со следующего года, отказ нужно подать до 1 октября",
  },
  "edv-invalidam": {
    kind: "year-window",
    fromMonth: 1,
    fromDay: 1,
    toMonth: 10,
    toDay: 1,
    note: "Отказ от набора социальных услуг в пользу денег подают до 1 октября",
  },

  // Списки участников «Молодой семьи» формируют раз в год.
  "molodaya-semya": {
    kind: "year-window",
    fromMonth: 1,
    fromDay: 1,
    toMonth: 9,
    toDay: 1,
    note: "Списки участников формируют раз в год, обычно до 1 сентября — документы лучше подать заранее",
  },

  // Добровольные взносы ИП и самозанятых — до конца года, иначе право на
  // декретные появится только через год.
  "dekretnye-dlya-ip-samozanyatyh": {
    kind: "year-end",
    note: "Взнос за текущий год нужно уплатить до 31 декабря — право на выплату появится со следующего года",
  },

  // Срок есть, но по анкете его не посчитать: показываем текстом.
  "subsidiya-zhku-maloimushchim-svo": {
    kind: "note",
    note: "Заявление выгоднее подать до 15 числа: тогда субсидию назначат с текущего месяца, а не со следующего",
  },
  "sanatorno-kurortnoe-lechenie-rebenka-invalida": {
    kind: "note",
    note: "Заявление на путёвку подают не позднее чем за 21 день до желаемой даты заезда",
  },
  "posobie-po-bezrabotice": {
    kind: "note",
    note: "После увольнения на учёт лучше встать в первые 10 дней: от этого зависит размер и начало выплат",
  },
  "nalogovyy-vychet-lechenie": {
    kind: "note",
    note: "Вычет возвращают за три последних года: за расходы 2023 года подать декларацию можно до конца 2026-го",
  },
  "nalogovyy-vychet-obuchenie": {
    kind: "note",
    note: "Вычет возвращают за три последних года: расходы более ранних лет уже не вернуть",
  },
};

const slugs = Object.keys(DEADLINES);
const { data: before, error } = await sb
  .from("measures")
  .select("slug,title,deadline")
  .in("slug", slugs);
if (error) throw error;
const found = before.map((m) => m.slug);
const missing = slugs.filter((s) => !found.includes(s));
if (missing.length) console.log("нет таких мер (пропускаю):", missing.join(", "));

for (const m of before) {
  const d = DEADLINES[m.slug];
  console.log(`${m.slug.padEnd(46)} ${d.kind}${d.weeks ? " " + d.weeks + " нед." : ""}`);
}
if (!APPLY) {
  console.log(`\nвсего: ${before.length}. Сухой прогон, для записи: --apply`);
  process.exit(0);
}
writeFileSync("scripts/_backup-deadlines-2.json", JSON.stringify(before, null, 1), "utf8");
for (const m of before) {
  const { error: e } = await sb.from("measures").update({ deadline: DEADLINES[m.slug] }).eq("slug", m.slug);
  if (e) throw new Error(`${m.slug}: ${e.message}`);
}
console.log(`\nпроставлено сроков: ${before.length}`);
