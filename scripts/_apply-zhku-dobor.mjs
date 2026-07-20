// Добор «компенсация ЖКУ многодетным» по регионам, где карточки не было.
// Собирает 5 файлов партий, ВАЛИДИРУЕТ и пишет в базу.
//
// Часть карточек придерживаем неопубликованными: там, где источник — не НПА и
// не страница ведомства, а пресса, либо источники прямо противоречат друг другу.
// Лучше карточка в черновике, чем неверный процент или неверный круг получателей
// на витрине — сегодня ровно такую ошибку и чинили в федеральной мере.
//
// Запуск: node scripts/_apply-zhku-dobor.mjs          (сухой прогон)
//         node scripts/_apply-zhku-dobor.mjs --apply   (запись)
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
const APPLY = process.argv.includes("--apply");

// Источник слабее, чем нужно для витрины → заводим, но не публикуем.
const HOLD = {
  "Костромская область":
    "источники противоречат по условию о доходе (действующая страница ЦСВ — без дохода, прежняя редакция и репортаж — до 1/1,5 ПМ)",
  "Запорожская область":
    "размер 50% взят из заявления и. о. министра; текст Закона № 123 — сканы, не читается",
  "Кабардино-Балкарская Республика":
    "размер 30% подтверждён прессой; сайт минтруда отдаёт контент скриптом, прямого подтверждения нет",
};

const VALID_CRITERIA = new Set([
  "anyOf", "requiresFamily", "requiresPregnancy", "requiresChildren", "minChildren",
  "minSimultaneousBirth", "minSchoolChildren", "maxYoungestChildAgeYears",
  "hasChildAgedFrom", "hasChildAgedTo", "requiresLossOfBreadwinner", "excludeFromMatching",
  "requiresLowIncome", "maxIncomePm", "requiresDisabledChild", "requiresSpecialNeedsChild",
  "requiresMortgageIntent", "requiresSvoFamily", "requiresSingleParent", "requiresStudent",
  "requiresParentUnder35", "requiresSelfEmployed", "requiresEntrepreneur",
  "requiresDisabledParent", "requiresFosterParent", "regions",
]);

const src = readFileSync("src/lib/measures.ts", "utf8");
const REGIONS = new Set(
  [...src.match(/export const REGIONS = \[([\s\S]*?)\] as const;/)[1].matchAll(/"([^"]+)"/g)].map(
    (m) => m[1],
  ),
);
const CATEGORIES = new Set(
  [...src.match(/export const CATEGORIES: Category\[\] = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map(
    (m) => m[1],
  ),
);

// --- собираем партии ------------------------------------------------------
const rows = [];
const notFound = [];
for (const b of ["a", "b", "c", "d", "e"]) {
  const f = JSON.parse(readFileSync(`verification/zhku-add-${b}.json`, "utf8"));
  for (const r of f.found ?? []) rows.push({ ...r, _batch: b });
  for (const n of f.notFound ?? []) notFound.push({ ...n, _batch: b });
}
console.log(`собрано: ${rows.length} карточек, ${notFound.length} не подтверждено\n`);

// --- валидация ------------------------------------------------------------
const errors = [];
const seen = new Set();

function checkCriteria(c, slug, path = "criteria") {
  for (const k of Object.keys(c)) {
    if (!VALID_CRITERIA.has(k)) errors.push(`${slug}: недопустимое поле ${path}.${k}`);
  }
  if (c.requiresDisabledChild && c.requiresSpecialNeedsChild) {
    errors.push(`${slug}: одновременно requiresDisabledChild и requiresSpecialNeedsChild`);
  }
  if (Array.isArray(c.anyOf)) c.anyOf.forEach((x, i) => checkCriteria(x, slug, `${path}.anyOf[${i}]`));
}

for (const r of rows) {
  const s = r.slug;
  if (!s) { errors.push("карточка без slug"); continue; }
  if (seen.has(s)) errors.push(`${s}: дубль slug внутри добора`);
  seen.add(s);

  for (const f of ["title", "short_description", "region", "category", "amount", "source_url", "source_name"]) {
    if (!r[f]) errors.push(`${s}: пустое поле ${f}`);
  }
  if (r.level !== "regional") errors.push(`${s}: level=${r.level}, ожидался regional`);
  if (!REGIONS.has(r.region)) errors.push(`${s}: регион «${r.region}» не из справочника REGIONS`);
  if (!CATEGORIES.has(r.category)) errors.push(`${s}: категория «${r.category}» не из справочника`);
  if (!r.criteria?.regions?.includes(r.region)) {
    errors.push(`${s}: criteria.regions не содержит «${r.region}»`);
  }
  checkCriteria(r.criteria ?? {}, s);
  if (!/^https?:\/\//.test(r.source_url ?? "")) errors.push(`${s}: source_url не похож на URL`);
  for (const f of ["how_to_apply", "documents", "tips", "segments"]) {
    if (!Array.isArray(r[f]) || !r[f].length) errors.push(`${s}: ${f} пуст или не массив`);
  }
}

// --- сверка с базой: нет ли уже такой меры или slug --------------------------
const { data: existing, error: eSel } = await sb.from("measures").select("slug,region,title");
if (eSel) throw eSel;
const existingSlugs = new Set(existing.map((m) => m.slug));
for (const r of rows) {
  if (existingSlugs.has(r.slug)) errors.push(`${r.slug}: slug уже занят в базе`);
}

if (errors.length) {
  console.log("=== ОШИБКИ ВАЛИДАЦИИ ===");
  errors.forEach((e) => console.log("  ✗", e));
  console.log("\nЗапись отменена. Ничего не тронуто.");
  process.exitCode = 1;
} else {
  console.log("валидация пройдена: ошибок нет\n");

  const publish = rows.filter((r) => !HOLD[r.region]);
  const hold = rows.filter((r) => HOLD[r.region]);

  console.log(`=== ПУБЛИКУЕМ (${publish.length}) ===`);
  for (const r of publish) {
    const inc = r.criteria.requiresLowIncome ? "  [есть условие о доходе]" : "";
    console.log(`  ${r.region} — ${r.amount}${inc}`);
  }

  console.log(`\n=== ЗАВОДИМ, НО НЕ ПУБЛИКУЕМ (${hold.length}) ===`);
  for (const r of hold) {
    console.log(`  ${r.region} — ${r.amount}`);
    console.log(`      причина: ${HOLD[r.region]}`);
  }

  console.log(`\n=== НЕ ПОДТВЕРЖДЕНО, карточки нет (${notFound.length}) ===`);
  for (const n of notFound) console.log(`  ${n.region}`);

  const payload = rows.map(({ _batch, ...r }) => ({
    ...r,
    is_published: !HOLD[r.region],
    verified_by: HOLD[r.region]
      ? `добор ЖКУ многодетным — ЧЕРНОВИК: ${HOLD[r.region]}`
      : "добор ЖКУ многодетным",
  }));

  writeFileSync("verification/zhku-dobor-payload.json", JSON.stringify(payload, null, 2));
  console.log("\nитоговый payload → verification/zhku-dobor-payload.json");

  if (!APPLY) {
    console.log("\nСУХОЙ ПРОГОН. Записи не было. Для применения: --apply");
  } else {
    const { error } = await sb.from("measures").insert(payload);
    if (error) throw error;
    console.log(`\n✓ записано карточек: ${payload.length}`);
    console.log(`  опубликовано: ${publish.length}, в черновике: ${hold.length}`);
  }
}
