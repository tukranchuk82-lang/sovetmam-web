// Импорт мер поддержки из CSV в Supabase (таблица public.measures).
//
// Идемпотентно: запись по первичному ключу slug (upsert). Можно перезаливать
// один и тот же файл сколько угодно раз — существующие меры обновятся,
// дубли не появятся.
//
// Запуск:
//   node scripts/import-measures.mjs scripts/measures.csv
//   (или: npm run import-measures -- scripts/measures.csv)
//
// Ключи берутся из .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// --- Загрузка .env.local (Node не делает это сам в обычном скрипте) ---------
function loadEnvLocal() {
  const envPath = join(projectRoot, ".env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

// --- Допустимые значения (держать в синхроне с src/lib/measures.ts) ---------
const CATEGORIES = [
  "Выплаты и пособия",
  "Жильё и ипотека",
  "Налоги и льготы",
  "Здоровье",
  "Образование",
  "Транспорт",
];

// id сегмента -> человекочитаемое название (принимаем в CSV и то, и другое).
const SEGMENT_TITLES = {
  "expecting-first": "В ожидании первого ребёнка",
  "expecting-second": "В ожидании второго ребёнка",
  "expecting-third-plus": "В ожидании третьего и последующих детей",
  "student-family": "Студенческая семья",
  "single-parent": "Неполная семья",
  "svo-family": "Семьи участников СВО",
  disability: "В семье есть инвалид или человек с ОВЗ",
};
// Карта для матчинга: и по id, и по названию (в нижнем регистре) -> id.
const SEGMENT_LOOKUP = new Map();
for (const [id, title] of Object.entries(SEGMENT_TITLES)) {
  SEGMENT_LOOKUP.set(id.toLowerCase(), id);
  SEGMENT_LOOKUP.set(title.toLowerCase(), id);
}

const LIST_SEP = "||"; // разделитель элементов в колонках-списках

// --- Утилиты ----------------------------------------------------------------
const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function slugify(input) {
  return input
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseBool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return ["да", "yes", "true", "1", "+", "x", "да."].includes(s);
}

function splitList(v) {
  return String(v ?? "")
    .split(LIST_SEP)
    .map((s) => s.trim())
    .filter(Boolean);
}

function emptyToNull(v) {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function numOrUndef(v) {
  const s = String(v ?? "").trim();
  if (s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN; // NaN сигналит об ошибке в валидации
}

// --- Сборка criteria из отдельных колонок -----------------------------------
function buildCriteria(row, region, errors, rowLabel) {
  const c = {};
  if (parseBool(row.crit_pregnancy)) c.requiresPregnancy = true;
  if (parseBool(row.crit_children)) c.requiresChildren = true;
  if (parseBool(row.crit_low_income)) c.requiresLowIncome = true;
  if (parseBool(row.crit_disabled_child)) c.requiresDisabledChild = true;
  if (parseBool(row.crit_mortgage)) c.requiresMortgageIntent = true;
  if (parseBool(row.crit_svo)) c.requiresSvoFamily = true;
  if (parseBool(row.crit_single_parent)) c.requiresSingleParent = true;
  if (parseBool(row.crit_student)) c.requiresStudent = true;

  const minCh = numOrUndef(row.crit_min_children);
  if (Number.isNaN(minCh)) errors.push(`${rowLabel}: crit_min_children не число`);
  else if (minCh !== undefined && minCh > 0) c.minChildren = minCh;

  const maxAge = numOrUndef(row.crit_max_youngest_age);
  if (Number.isNaN(maxAge)) errors.push(`${rowLabel}: crit_max_youngest_age не число`);
  else if (maxAge !== undefined) c.maxYoungestChildAgeYears = maxAge;

  // Для региональных мер ограничение по региону подставляем из колонки region.
  if (region) c.regions = [region];

  return c;
}

// --- Преобразование строки CSV в строку таблицы measures --------------------
function rowToMeasure(row, index, errors) {
  const rowLabel = `Строка ${index + 2}`; // +1 заголовок, +1 человеко-нумерация

  const title = String(row.title ?? "").trim();
  if (!title) errors.push(`${rowLabel}: пустой title`);

  const level = String(row.level ?? "").trim().toLowerCase();
  if (level !== "federal" && level !== "regional") {
    errors.push(`${rowLabel}: level должен быть federal или regional (сейчас «${row.level}»)`);
  }

  const category = String(row.category ?? "").trim();
  if (!CATEGORIES.includes(category)) {
    errors.push(`${rowLabel}: неизвестная категория «${category}». Допустимо: ${CATEGORIES.join(", ")}`);
  }

  const region = emptyToNull(row.region);
  if (level === "regional" && !region) {
    errors.push(`${rowLabel}: для региональной меры обязателен region`);
  }

  // segments: принимаем id или название, через ||
  const rawSegments = splitList(row.segments);
  if (rawSegments.length === 0) errors.push(`${rowLabel}: не указан ни один segment`);
  const segments = [];
  for (const s of rawSegments) {
    const id = SEGMENT_LOOKUP.get(s.toLowerCase());
    if (!id) errors.push(`${rowLabel}: неизвестная ситуация «${s}»`);
    else if (!segments.includes(id)) segments.push(id);
  }

  const shortDescription = String(row.short_description ?? "").trim();
  if (!shortDescription) errors.push(`${rowLabel}: пустой short_description`);

  const sourceUrl = String(row.source_url ?? "").trim();
  if (!sourceUrl) errors.push(`${rowLabel}: пустой source_url`);
  const sourceName = String(row.source_name ?? "").trim();
  if (!sourceName) errors.push(`${rowLabel}: пустой source_name`);

  const slug = emptyToNull(row.slug) ?? slugify(title);
  const criteria = buildCriteria(row, level === "regional" ? region : null, errors, rowLabel);

  const sortRaw = numOrUndef(row.sort_order);
  const sortOrder = sortRaw === undefined || Number.isNaN(sortRaw) ? (index + 1) * 10 : sortRaw;

  const isPublished =
    String(row.is_published ?? "").trim() === "" ? true : parseBool(row.is_published);

  return {
    slug,
    title,
    short_description: shortDescription,
    level,
    region,
    category,
    amount: emptyToNull(row.amount),
    segments,
    criteria,
    how_to_apply: splitList(row.how_to_apply),
    documents: splitList(row.documents),
    source_url: sourceUrl,
    source_name: sourceName,
    updated_at_label: emptyToNull(row.updated_at_label),
    is_published: isPublished,
    sort_order: sortOrder,
  };
}

// --- Основной поток ----------------------------------------------------------
async function main() {
  const csvArg = process.argv[2] ?? "scripts/measures.csv";
  const csvPath = resolve(projectRoot, csvArg);
  if (!existsSync(csvPath)) {
    console.error(`Файл не найден: ${csvPath}`);
    console.error(`Использование: node scripts/import-measures.mjs <путь к CSV>`);
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Нет NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY (.env.local).");
    process.exit(1);
  }

  const csvText = readFileSync(csvPath, "utf8");
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  if (rows.length === 0) {
    console.error("В CSV нет строк с данными.");
    process.exit(1);
  }

  const errors = [];
  const measures = rows.map((r, i) => rowToMeasure(r, i, errors));

  // Дубликаты slug внутри файла
  const seen = new Map();
  measures.forEach((m, i) => {
    if (seen.has(m.slug)) {
      errors.push(`Строка ${i + 2}: дубликат slug «${m.slug}» (уже в строке ${seen.get(m.slug) + 2})`);
    } else {
      seen.set(m.slug, i);
    }
  });

  if (errors.length > 0) {
    console.error(`\n❌ Найдено ошибок: ${errors.length}. Импорт отменён, база не тронута.\n`);
    for (const e of errors) console.error("  • " + e);
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Считаем, сколько новых и сколько обновится (для отчёта).
  const slugs = measures.map((m) => m.slug);
  const { data: existing, error: selErr } = await supabase
    .from("measures")
    .select("slug")
    .in("slug", slugs);
  if (selErr) {
    console.error("Ошибка чтения существующих мер: " + selErr.message);
    process.exit(1);
  }
  const existingSet = new Set((existing ?? []).map((r) => r.slug));
  const newCount = slugs.filter((s) => !existingSet.has(s)).length;
  const updCount = slugs.length - newCount;

  const { error: upErr } = await supabase
    .from("measures")
    .upsert(measures, { onConflict: "slug" });
  if (upErr) {
    console.error("Ошибка записи: " + upErr.message);
    process.exit(1);
  }

  console.log(`\n✅ Готово. Обработано мер: ${measures.length}`);
  console.log(`   новых: ${newCount}, обновлено: ${updCount}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
