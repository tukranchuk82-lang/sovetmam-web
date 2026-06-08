// Разовая загрузка партии мер из инфографики «Госуслуги для родителей»:
// единовременные выплаты на детей в 2026 году (8 федеральных выплат).
// Структурировано Claude по картинке-источнику; загружено как ЧЕРНОВИКИ
// (is_published=false) — публикуются вручную после проверки человеком.
//
// Запуск: node scripts/load-batch-gosuslugi-2026.mjs
// Идемпотентно (upsert по slug) — можно перезапускать.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// --- .env.local ---
const envPath = join(projectRoot, ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

const SRC_URL = "https://www.gosuslugi.ru/";
const SRC_NAME = "Госуслуги для родителей";
const ALL_BIRTH = ["expecting-first", "expecting-second", "expecting-third-plus"];

const measures = [
  {
    slug: "posobie-po-beremennosti-i-rodam",
    title: "Пособие по беременности и родам",
    short_description:
      "Декретные выплаты — 100% среднего заработка за каждый день отпуска по беременности и родам.",
    level: "federal",
    region: null,
    category: "Выплаты и пособия",
    amount: "Минимум 124 702,20 ₽ за 140 дней, максимум 1 324 515,60 ₽ за 194 дня",
    segments: ALL_BIRTH,
    criteria: { requiresPregnancy: true },
    how_to_apply: [
      "Получите листок нетрудоспособности по беременности и родам в женской консультации",
      "Передайте его работодателю — он оформит и выплатит пособие (неработающим — через СФР)",
    ],
    documents: [
      "Листок нетрудоспособности по беременности и родам",
      "Заявление",
    ],
    sort_order: 10,
  },
  {
    slug: "posobie-beremennoy-zhene-prizyvnika",
    title: "Единовременное пособие беременной жене военнослужащего по призыву",
    short_description:
      "Разовая выплата беременной жене солдата-срочника при сроке беременности от 180 дней.",
    level: "federal",
    region: null,
    category: "Выплаты и пособия",
    amount: "45 054,24 ₽",
    segments: ALL_BIRTH,
    criteria: { requiresPregnancy: true },
    how_to_apply: [
      "Подайте заявление в СФР или через Госуслуги",
      "Приложите справку о беременности и документы о службе мужа",
    ],
    documents: [
      "Справка о беременности (срок от 180 дней)",
      "Справка из воинской части о прохождении службы по призыву",
      "Свидетельство о браке",
    ],
    sort_order: 20,
  },
  {
    slug: "edinovremennoe-pri-rozhdenii-rebenka",
    title: "Единовременное пособие при рождении ребёнка",
    short_description: "Разовая выплата при рождении или усыновлении ребёнка.",
    level: "federal",
    region: null,
    category: "Выплаты и пособия",
    amount: "28 450,45 ₽",
    segments: ALL_BIRTH,
    criteria: { requiresChildren: true },
    how_to_apply: [
      "Оформляется работодателем одного из родителей",
      "Неработающим родителям — через СФР или Госуслуги",
    ],
    documents: [
      "Свидетельство о рождении ребёнка",
      "Заявление",
      "Справка с места работы второго родителя о неполучении пособия",
    ],
    sort_order: 30,
  },
  {
    slug: "materinskiy-kapital",
    title: "Материнский (семейный) капитал",
    short_description:
      "Господдержка семьям с детьми. Размер зависит от года рождения и количества детей.",
    level: "federal",
    region: null,
    category: "Выплаты и пособия",
    amount:
      "234 321,27 ₽ / 728 921,90 ₽ / 963 243,17 ₽ — в зависимости от года рождения и количества детей",
    segments: ALL_BIRTH,
    criteria: { requiresChildren: true },
    how_to_apply: [
      "Сертификат оформляется автоматически после регистрации рождения ребёнка",
      "Проверить и распорядиться средствами можно на Госуслугах или в СФР",
    ],
    documents: [
      "Свидетельства о рождении детей",
      "Документ, удостоверяющий личность",
    ],
    sort_order: 40,
  },
  {
    slug: "pogashenie-ipoteki-mnogodetnym",
    title: "Выплата на погашение ипотеки многодетным семьям",
    short_description:
      "450 000 ₽ на погашение ипотечного кредита семьям, где родился третий или последующий ребёнок.",
    level: "federal",
    region: null,
    category: "Жильё и ипотека",
    amount: "450 000 ₽",
    segments: ["expecting-third-plus"],
    criteria: { requiresChildren: true, minChildren: 3, requiresMortgageIntent: true },
    how_to_apply: [
      "Подайте заявление в банк, выдавший ипотеку",
      "Банк направит документы в Дом.РФ для выплаты",
    ],
    documents: [
      "Кредитный (ипотечный) договор",
      "Свидетельства о рождении детей",
      "Заявление",
    ],
    sort_order: 50,
  },
  {
    slug: "ostatok-materinskogo-kapitala",
    title: "Единовременная выплата остатка материнского капитала",
    short_description:
      "Если на счёте материнского капитала осталось не более 10 000 ₽, остаток можно получить деньгами.",
    level: "federal",
    region: null,
    category: "Выплаты и пособия",
    amount: "до 10 000 ₽",
    segments: ALL_BIRTH,
    criteria: { requiresChildren: true },
    how_to_apply: ["Подайте заявление через Госуслуги или в СФР"],
    documents: ["Заявление", "Сертификат на материнский капитал"],
    sort_order: 60,
  },
  {
    slug: "posobie-usynovlenie-osobyh-detey",
    title:
      "Единовременное пособие при усыновлении ребёнка-инвалида, старше 7 лет или братьев и сестёр",
    short_description:
      "Повышенная выплата за каждого усыновлённого ребёнка с инвалидностью, ребёнка старше 7 лет либо братьев и сестёр.",
    level: "federal",
    region: null,
    category: "Выплаты и пособия",
    amount: "217 384,58 ₽ за каждого ребёнка",
    segments: ["disability"],
    criteria: { requiresChildren: true, requiresDisabledChild: true },
    how_to_apply: [
      "Подайте заявление в СФР или через Госуслуги после вступления в силу решения суда об усыновлении",
    ],
    documents: [
      "Вступившее в силу решение суда об усыновлении",
      "Свидетельство о рождении ребёнка",
      "Документы об инвалидности (при наличии)",
    ],
    sort_order: 70,
  },
  {
    slug: "semeynaya-nalogovaya-vyplata-2025",
    title: "Семейная налоговая выплата за 2025 год",
    short_description:
      "Родителям двух и более детей возвращают часть НДФЛ — разницу между налогом по обычной ставке и по ставке 6%.",
    level: "federal",
    region: null,
    category: "Налоги и льготы",
    amount: "Разница между исчисленным НДФЛ и НДФЛ по ставке 6%",
    segments: ["expecting-second", "expecting-third-plus"],
    criteria: { requiresChildren: true, minChildren: 2, requiresLowIncome: true },
    how_to_apply: [
      "Подайте заявление в налоговую или через Госуслуги",
      "Учитывается среднедушевой доход семьи",
    ],
    documents: [
      "Заявление",
      "Свидетельства о рождении детей",
      "Сведения о доходах семьи",
    ],
    sort_order: 80,
  },
].map((m) => ({
  ...m,
  source_url: SRC_URL,
  source_name: SRC_NAME,
  updated_at_label: "2026",
  is_published: false, // черновик — публикуется после проверки человеком
}));

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Нет ключей Supabase в .env.local");
    process.exit(1);
  }
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const slugs = measures.map((m) => m.slug);
  const { data: existing, error: selErr } = await supabase
    .from("measures")
    .select("slug")
    .in("slug", slugs);
  if (selErr) {
    console.error("Ошибка чтения: " + selErr.message);
    process.exit(1);
  }
  const had = new Set((existing ?? []).map((r) => r.slug));

  const { error } = await supabase
    .from("measures")
    .upsert(measures, { onConflict: "slug" });
  if (error) {
    console.error("Ошибка записи: " + error.message);
    process.exit(1);
  }

  const created = slugs.filter((s) => !had.has(s)).length;
  console.log(`\n✅ Загружено мер: ${measures.length} (новых: ${created}, обновлено: ${measures.length - created})`);
  console.log("   Статус: черновики (is_published=false). Проверьте в /admin и опубликуйте.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
