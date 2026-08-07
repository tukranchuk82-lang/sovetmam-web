// Проставляет условия мерам, у которых их не было вовсе — кроме региона.
//
// Такая мера подходит кому угодно, в том числе человеку без детей: подбор
// выдавал бездетным компенсацию за детский сад и стипендию школьникам. Условия
// проставлены по содержанию каждой меры, вручную.
//
// Правило проекта: гейтим только НЕОБХОДИМОЕ. Если мера названа «льготным
// категориям семей с детьми», ставим requiresChildren и не пытаемся угадать
// конкретную льготную категорию — иначе подбор зря потребует лишнего.
//
// Запуск: node scripts/_apply-missing-criteria.mjs [--apply]

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

// Что добавляем к существующим criteria (регион в них уже записан и не трогается).
const PLAN = {
  // Сопровождение женщины, решающей судьбу беременности.
  "amur-028": { requiresPregnancy: true },

  // Подготовка к ЭКО — как раз для тех, у кого детей ещё нет. Условий не
  // добавляем, помечаем явно, чтобы следующий проход не «починил» лишнего.
  "kchr-012": { requiresChildren: false },

  // Выплаты за непредоставленное место в детсаду — по возрасту ребёнка.
  "kirov-003": { requiresChildren: true, hasChildAgedFrom: 3, hasChildAgedTo: 4 },
  "krasn-005": { requiresChildren: true, hasChildAgedFrom: 1, hasChildAgedTo: 3 },

  // «Льготным категориям семей с детьми» — гейтим только наличие детей.
  "lenobl-050": { requiresChildren: true },
  "spb-022": { requiresChildren: true },

  // Усыновителям.
  "reg-altayskiy-kray-010": { requiresFosterParent: true },

  // Детям погибших: потеря кормильца; для СВО — ещё и семья участника.
  "reg-kaliningradskaya-oblast-015": {
    requiresChildren: true,
    requiresLossOfBreadwinner: true,
  },
  "reg-kaliningradskaya-oblast-016": {
    requiresChildren: true,
    requiresSvoFamily: true,
  },

  // Стипендия обучающимся — значит, в семье есть дети.
  "rstadd-010": { requiresChildren: true },

  // Списание долга при рождении ребёнка — подходит и тем, кто ждёт.
  "rtadd-004": { requiresFamily: true },

  // Компенсация родительской платы за детский сад.
  "rtadd-008": { requiresChildren: true },
  "samara-010": { requiresChildren: true },
  "stavropol-006": { requiresChildren: true },

  // Региональный капитал на первого ребёнка — и ждущим, и родившим.
  "tyumen-001": { requiresFamily: true },
};

const apply = process.argv.includes("--apply");
const slugs = Object.keys(PLAN);

const { data: rows, error } = await sb
  .from("measures")
  .select("slug, title, region, criteria")
  .in("slug", slugs);
if (error) throw error;

const found = new Set(rows.map((r) => r.slug));
const missing = slugs.filter((s) => !found.has(s));
if (missing.length > 0) console.log("НЕ НАЙДЕНЫ:", missing.join(", "), "\n");

const backupDir = join(ROOT, "verification");
mkdirSync(backupDir, { recursive: true });
const backupPath = join(backupDir, "backup-missing-criteria.json");
writeFileSync(backupPath, JSON.stringify(rows, null, 2), "utf8");
console.log(`Резервная копия: ${backupPath}\n`);

for (const row of rows) {
  const next = { ...(row.criteria ?? {}), ...PLAN[row.slug] };
  console.log(`${row.title.slice(0, 70)}`);
  console.log(`   было:  ${JSON.stringify(row.criteria)}`);
  console.log(`   стало: ${JSON.stringify(next)}`);

  if (apply) {
    const { error: upErr } = await sb
      .from("measures")
      .update({ criteria: next })
      .eq("slug", row.slug);
    if (upErr) throw upErr;
    console.log("   ✓ записано");
  }
  console.log();
}

console.log(apply ? "Готово." : "Показ без записи. Повторите с --apply.");
