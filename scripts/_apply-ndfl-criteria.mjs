// Помечает меры, которые возвращают уже уплаченный НДФЛ, условием requiresNdfl.
// Их нельзя предлагать тем, кто этот налог не платит: возвращать нечего.
//
// Заодно исправляет порог дохода у семейной налоговой выплаты: по закону она
// положена при среднедушевом доходе до 1,5 прожиточного минимума, а стояло
// «ниже одного ПМ» — семьи между одним и полутора ПМ выплату не видели.
//
// Запуск: node scripts/_apply-ndfl-criteria.mjs [--apply]
// Без --apply только показывает, что изменится.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
dotenv.config({ path: join(root, ".env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Возврат уплаченного НДФЛ. Льготы по транспортному и имущественному налогам
// сюда НЕ входят: там другой налог и НДФЛ ни при чём.
const NDFL_SLUGS = [
  "standartnyy-vychet-na-detey",
  "dvoynoy-nalogovyy-vychet",
  "nalogovyy-vychet-zhilye",
  "nalogovyy-vychet-lechenie",
  "nalogovyy-vychet-obuchenie",
  "nalogovyy-vychet-strahovanie-zhizni",
  "semeynaya-nalogovaya-vyplata-2025",
];

const apply = process.argv.includes("--apply");

const { data: rows, error } = await sb
  .from("measures")
  .select("slug, title, criteria")
  .in("slug", NDFL_SLUGS);
if (error) throw error;

if (rows.length !== NDFL_SLUGS.length) {
  const found = new Set(rows.map((r) => r.slug));
  console.log("НЕ НАЙДЕНЫ:", NDFL_SLUGS.filter((s) => !found.has(s)).join(", "));
}

// Резервная копия прежних условий — чтобы можно было вернуть как было.
const backupDir = join(root, "verification");
mkdirSync(backupDir, { recursive: true });
const backupPath = join(backupDir, "backup-ndfl-criteria.json");
writeFileSync(backupPath, JSON.stringify(rows, null, 2), "utf8");
console.log(`Резервная копия: ${backupPath}\n`);

for (const row of rows) {
  const next = { ...row.criteria, requiresNdfl: true };

  if (row.slug === "semeynaya-nalogovaya-vyplata-2025") {
    delete next.requiresLowIncome;
    next.maxIncomePm = 1.5;
  }

  console.log(row.title);
  console.log("  было:", JSON.stringify(row.criteria));
  console.log("  стало:", JSON.stringify(next));

  if (apply) {
    const { error: upErr } = await sb
      .from("measures")
      .update({ criteria: next })
      .eq("slug", row.slug);
    if (upErr) throw upErr;
    console.log("  ✓ записано");
  }
  console.log();
}

console.log(
  apply ? "Готово." : "Это был показ без записи. Повторите с --apply.",
);
