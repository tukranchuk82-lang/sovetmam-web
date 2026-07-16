// Обновление федеральной меры «Мать-героиня» суммами на 2026 год.
// Источники: СФР, РИА/tvspb (февраль 2026). Ежемесячная выплата 76 458,40 ₽;
// доплата к пенсии пенсионеркам ~39 100 ₽ (в карточке клиента была устаревшая
// 36 500 ₽). Мера уже есть — не добавляем, а актуализируем.
//
// Запуск: node scripts/_update-mat-geroinya.mjs [--apply]

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const SLUG = "zvanie-mat-geroinya";
const patch = {
  amount:
    "1 000 000 ₽ единовременно (без налога) + ежемесячная денежная выплата 76 458,40 ₽ (с 1 февраля 2026, назначает Социальный фонд, ежегодно индексируется). Матери-героине на пенсии положена и ежемесячная доплата к пенсии — в 2026 около 39 100 ₽",
  tips: [
    "Звание присваивают только при десяти и более детях. При меньшем числе детей смотрите медаль ордена «Родительская слава» (от 4 детей) и сам орден (от 7 детей).",
    "Дети, погибшие при защите Отечества, при исполнении служебного долга или в результате теракта, учитываются в общем числе детей.",
    "Заявление от самой семьи не принимается — нужно ходатайство организации, но инициировать его семья вправе сама.",
    "Путь документов длинный: от сбора до указа обычно проходит от полугода до двух лет.",
    "Ежемесячную денежную выплату Социальный фонд назначает проактивно — отдельное заявление на неё подавать не нужно; перечисляют не позднее 15 рабочих дней с даты указа Президента.",
    "С 2026 года по мерам поддержки матери-героини приравнены к Героям Труда и Героям России.",
    "При присуждении звания учитывают не только число детей, но и то, как они воспитаны: их здоровье, образование, участие в спорте, творчестве и общественной жизни.",
  ],
  verified_at: "2026-07-16T12:00:00+03:00",
  verified_by: "sverka",
};

const APPLY = process.argv.includes("--apply");
const { data: cur, error } = await sb.from("measures").select("*").eq("slug", SLUG).single();
if (error) { console.error("Не найдена мера:", error.message); process.exit(1); }

console.log("### " + SLUG);
for (const k of ["amount", "tips"]) {
  console.log(`\n${k}:`);
  console.log("  − " + JSON.stringify(cur[k]));
  console.log("  + " + JSON.stringify(patch[k]));
}

if (!APPLY) {
  console.log("\nСухой прогон. Для записи: node scripts/_update-mat-geroinya.mjs --apply");
  process.exit(0);
}

writeFileSync("verification/backup-mat-geroinya.json", JSON.stringify(cur, null, 2));
const { error: upErr } = await sb.from("measures").update(patch).eq("slug", SLUG);
if (upErr) { console.error("FAIL:", upErr.message); process.exit(1); }
console.log("\nOK — мера обновлена, бэкап: verification/backup-mat-geroinya.json");
