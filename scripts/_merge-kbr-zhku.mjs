// Слияние дубля по ЖКУ Кабардино-Балкарии.
//
// С прежних заходов в базе лежала скрытая мера zhku-mnogodetnym-kbr, а
// сегодняшняя загрузка добавила ту же льготу как kbr-007. Оставляем kbr-007
// (у неё полнее список документов и порядок подачи), но забираем из старой
// карточки главное, чего в новой не было: доход семьи не проверяют.
//
// Запуск: node scripts/_merge-kbr-zhku.mjs [--apply]

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
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

const OLD = "zhku-mnogodetnym-kbr";

const merged = {
  short_description:
    "Многодетным семьям возвращают 30 % платы за отопление, воду, канализацию, газ и электричество. Доход семьи не проверяют — мера привязана к статусу многодетной.",
  tips: [
    "Условия о доходе нет: мера привязана к статусу многодетной семьи, а не к нуждаемости.",
    "Компенсацию не назначат, если есть подтверждённый судом непогашенный долг за ЖКУ за последние три года, — счета нужно оплачивать вовремя.",
    "Право сохраняется, если старшему ребёнку исполнилось 18 и он учится очно — до 23 лет.",
    "Компенсацию считают по фактической площади жилья и нормативам потребления, и не более чем на одно жилое помещение.",
    "В домах без центрального отопления компенсируют 30 % стоимости топлива в пределах норм.",
  ],
};

const APPLY = process.argv.includes("--apply");

if (!APPLY) {
  console.log("Сухой прогон:\n");
  console.log("  ПРАВКА kbr-007 — забираем «доход не проверяют»");
  console.log(`  УДАЛИТЬ ${OLD} — дубль kbr-007 (скрытая мера прежних заходов)`);
  console.log("\nДля записи: node scripts/_merge-kbr-zhku.mjs --apply");
  process.exit(0);
}

mkdirSync("verification", { recursive: true });
const { data: before } = await sb.from("measures").select("*").in("slug", ["kbr-007", OLD]);
writeFileSync("verification/backup-kbr-zhku-merge.json", JSON.stringify(before, null, 2), "utf8");
console.log(`бэкап: verification/backup-kbr-zhku-merge.json (${(before || []).length} мер)\n`);

const { error: upErr } = await sb
  .from("measures")
  .update({ ...merged, updated_at_label: "2026" })
  .eq("slug", "kbr-007");
if (upErr) {
  console.log("FAIL правка kbr-007 -", upErr.message);
  process.exit(1);
}
console.log("OK   правка kbr-007");

const { error: delErr } = await sb.from("measures").delete().eq("slug", OLD);
if (delErr) {
  console.log("FAIL удаление", OLD, "-", delErr.message);
  process.exit(1);
}
console.log(`OK   удалён дубль ${OLD}`);
