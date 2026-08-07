// Убирает региональную меру Оренбургской области про бесплатный земельный
// участок — по просьбе заказчика (07.08.2026): федеральная мера про то же
// самое остаётся, региональная её дублировала.
//
// Снимаем с публикации, а не удаляем строку: мера пропадает отовсюду — из
// каталога, подбора, витрин и избранного (везде выбираются только
// опубликованные), — но её содержимое остаётся в базе. Если решение
// передумают, достаточно вернуть флаг. Полное удаление обсуждается отдельно.
//
// Запуск: node scripts/_hide-oren-006.mjs [--apply]

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(ROOT, ".env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const SLUG = "oren-006";
const apply = process.argv.includes("--apply");

const { data, error } = await sb.from("measures").select("*").eq("slug", SLUG);
if (error) throw error;
if (data.length === 0) {
  console.log(`Меры ${SLUG} в базе нет.`);
  process.exit(0);
}

const row = data[0];
const backupDir = join(ROOT, "verification");
mkdirSync(backupDir, { recursive: true });
const backupPath = join(backupDir, `backup-hidden-${SLUG}.json`);
writeFileSync(backupPath, JSON.stringify(row, null, 2), "utf8");

console.log(`Мера: ${row.title}`);
console.log(`Регион: ${row.region}`);
console.log(`Сейчас опубликована: ${row.is_published}`);
console.log(`Полная копия сохранена: ${backupPath}`);

if (!apply) {
  console.log("\nЭто был показ без записи. Повторите с --apply.");
  process.exit(0);
}

const { error: upErr } = await sb
  .from("measures")
  .update({ is_published: false })
  .eq("slug", SLUG);
if (upErr) throw upErr;

const { data: after } = await sb
  .from("measures")
  .select("is_published")
  .eq("slug", SLUG);
console.log(`\nГотово. Опубликована: ${after[0].is_published}`);
