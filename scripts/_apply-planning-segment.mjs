// Меры для тех, у кого детей ещё нет и беременности пока нет.
//
// Две задачи разом.
//
// 1. Снять ложные требования. У «ЭКО по полису ОМС» стояло requiresFamily —
//    то есть мера показывалась только семьям с детьми или беременным. Но её
//    собственное описание говорит обратное: «бесплатно для пар и одиноких
//    женщин при медицинских показаниях». Ровно те, кому она нужна, её и не
//    видели. То же у налогового вычета за лечение: вернуть НДФЛ за ЭКО может
//    и бездетная пара.
//
// 2. Пометить меры витринным сегментом `planning` — под новую плитку
//    «Планируем ребёнка» на главной.
//
// Запуск: node scripts/_apply-planning-segment.mjs [--apply]

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

/** Что чиним в критериях. */
const CRITERIA_FIX = {
  // Лечение бесплодия. Детей быть не должно — в этом весь смысл меры.
  "eko-po-oms": (c) => {
    const next = { ...c };
    delete next.requiresFamily;
    next.requiresChildren = false; // помечаем явно, чтобы не «починили» обратно
    return next;
  },
  // Вычет за лечение: право даёт уплаченный НДФЛ, а не наличие детей.
  "nalogovyy-vychet-lechenie": (c) => {
    const next = { ...c };
    delete next.requiresFamily;
    return next;
  },
};

/** Кого показываем в плитке «Планируем ребёнка». */
const PLANNING_SLUGS = [
  "eko-po-oms",
  "nalogovyy-vychet-lechenie",
  "molodaya-semya",
  "kchr-012",
];

const apply = process.argv.includes("--apply");

// Региональные меры про лечение бесплодия ищем по тексту: их немного, и они
// разбросаны по регионам.
const { data: fertility } = await sb
  .from("measures")
  .select("slug,title,criteria,segments")
  .eq("is_published", true)
  .or("title.ilike.%бесплоди%,title.ilike.%ЭКО%");

const planning = new Set([...PLANNING_SLUGS, ...(fertility ?? []).map((m) => m.slug)]);

const { data: rows, error } = await sb
  .from("measures")
  .select("slug,title,criteria,segments")
  .in("slug", [...planning]);
if (error) throw error;

const backupDir = join(ROOT, "verification");
mkdirSync(backupDir, { recursive: true });
const backupPath = join(backupDir, "backup-planning-segment.json");
writeFileSync(backupPath, JSON.stringify(rows, null, 2), "utf8");
console.log(`Резервная копия: ${backupPath}\n`);

for (const row of rows) {
  const fix = CRITERIA_FIX[row.slug];
  const criteria = fix ? fix(row.criteria ?? {}) : (row.criteria ?? {});
  const segments = row.segments?.includes("planning")
    ? row.segments
    : [...(row.segments ?? []), "planning"];

  const criteriaChanged = JSON.stringify(criteria) !== JSON.stringify(row.criteria ?? {});
  const segmentsChanged = segments.length !== (row.segments ?? []).length;
  if (!criteriaChanged && !segmentsChanged) {
    console.log(`${row.title.slice(0, 60)} — уже в порядке`);
    continue;
  }

  console.log(row.title.slice(0, 70));
  if (criteriaChanged) {
    console.log(`   критерии было:  ${JSON.stringify(row.criteria)}`);
    console.log(`   критерии стало: ${JSON.stringify(criteria)}`);
  }
  if (segmentsChanged) console.log("   добавлен сегмент: planning");

  if (apply) {
    const { error: upErr } = await sb
      .from("measures")
      .update({ criteria, segments })
      .eq("slug", row.slug);
    if (upErr) throw upErr;
    console.log("   ✓ записано");
  }
  console.log();
}

console.log(apply ? "Готово." : "Показ без записи. Повторите с --apply.");
