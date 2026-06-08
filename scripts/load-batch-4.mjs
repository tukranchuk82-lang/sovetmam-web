// Партия 4: региональные меры Московской области (официальное письмо МСР МО)
// + консолидированная мера по выплатам студенческим семьям от вуза.
// Все — черновики (is_published=false). Запуск: node scripts/load-batch-4.mjs

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
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

const ALL_BIRTH = ["expecting-first", "expecting-second", "expecting-third-plus"];
const MO = "Московская область";
const MO_SRC = "Госуслуги Московской области (uslugi.mosreg.ru)";

// Хелпер для региональной меры МО
function mo(slug, title, short, category, segments, criteria, url, amount = null) {
  return {
    slug,
    title,
    short_description: short,
    level: "regional",
    region: MO,
    category,
    amount,
    segments,
    criteria: { ...criteria, regions: [MO] },
    how_to_apply: ["Подать заявление через портал Госуслуг Московской области или в МФЦ / органах соцзащиты МО"],
    documents: [],
    tips: [],
    source_url: url,
    source_name: MO_SRC,
    updated_at_label: "2026",
    is_published: false,
  };
}

const measures = [
  mo(
    "mo-pitanie-beremennyh-i-detey-do-3",
    "Выплата на полноценное питание беременным, кормящим и детям до 3 лет (Московская область)",
    "Ежемесячная денежная выплата на питание беременным женщинам, кормящим матерям и детям до трёх лет.",
    "Здоровье",
    ALL_BIRTH,
    { requiresChildren: true, maxYoungestChildAgeYears: 3 },
    "https://uslugi.mosreg.ru/services/21141",
  ),
  mo(
    "mo-edinovremennoe-pri-rozhdenii",
    "Единовременное пособие при рождении ребёнка (Московская область)",
    "Региональная разовая выплата при рождении ребёнка жителям Московской области.",
    "Выплаты и пособия",
    ALL_BIRTH,
    { requiresChildren: true },
    "https://uslugi.mosreg.ru/services/12992",
  ),
  mo(
    "mo-vyplata-uhod-za-novorozhdennym",
    "Выплата на предметы для ухода за новорождёнными (Московская область)",
    "Денежная выплата (или подарочный набор) на приобретение предметов и средств для ухода за новорождённым.",
    "Выплаты и пособия",
    ALL_BIRTH,
    { requiresChildren: true },
    "https://uslugi.mosreg.ru/services/21133",
  ),
  mo(
    "mo-regionalnyy-matkapital",
    "Региональный материнский (семейный) капитал (Московская область)",
    "Региональный маткапитал — сертификат и распоряжение средствами для семей Московской области.",
    "Выплаты и пособия",
    ["expecting-second", "expecting-third-plus"],
    { requiresChildren: true, minChildren: 2 },
    "https://uslugi.mosreg.ru/services/6760",
  ),
  mo(
    "mo-edinovremennaya-tretiy-rebenok",
    "Единовременная выплата при рождении третьего или последующего ребёнка (Московская область)",
    "Региональная разовая выплата при рождении третьего или последующего ребёнка.",
    "Выплаты и пособия",
    ["expecting-third-plus"],
    { requiresChildren: true, minChildren: 3 },
    "https://uslugi.mosreg.ru/services/23087",
  ),
  mo(
    "mo-ezhegodnaya-mnogodetnym",
    "Ежегодная денежная выплата многодетной семье (Московская область)",
    "Ежегодная региональная выплата многодетным семьям Московской области.",
    "Выплаты и пособия",
    ["expecting-third-plus"],
    { requiresChildren: true, minChildren: 3 },
    "https://uslugi.mosreg.ru/services/22735",
  ),
  mo(
    "mo-vyplata-vzamen-uchastka",
    "Единовременная выплата многодетным взамен земельного участка (Московская область)",
    "Денежная выплата многодетной семье вместо предоставления земельного участка.",
    "Жильё и ипотека",
    ["expecting-third-plus"],
    { requiresChildren: true, minChildren: 3 },
    "https://uslugi.mosreg.ru/services/22891",
  ),
  mo(
    "mo-status-mnogodetnoy-semyi",
    "Присвоение статуса многодетной семьи (Московская область)",
    "Оформление льготного статуса многодетной семьи — даёт право на региональные льготы и выплаты.",
    "Налоги и льготы",
    ["expecting-third-plus"],
    { requiresChildren: true, minChildren: 3 },
    "https://uslugi.mosreg.ru/services/14842",
  ),
  mo(
    "mo-vyplata-odezhda-mnogodetnym",
    "Выплата многодетным на одежду школьнику (Московская область)",
    "Выплата многодетной семье на приобретение одежды ребёнку для посещения занятий.",
    "Образование",
    ["expecting-third-plus"],
    { requiresChildren: true, minChildren: 3 },
    "https://uslugi.mosreg.ru/services/19022",
  ),
  mo(
    "mo-kompensaciya-platy-detsad",
    "Компенсация родительской платы за детский сад (Московская область)",
    "Частичная компенсация родительской платы за присмотр и уход за детьми в детских садах Московской области.",
    "Образование",
    ALL_BIRTH,
    { requiresChildren: true, maxYoungestChildAgeYears: 7 },
    "https://uslugi.mosreg.ru/services/20675",
  ),
  // --- Студенческие семьи (от вуза) — консолидированная мера ---
  {
    slug: "vyplaty-studencheskim-semyam-ot-vuza",
    title: "Выплаты студенческим семьям и студентам от вуза",
    short_description:
      "Вузы устанавливают собственные меры поддержки студентов и студенческих семей. Конкретные суммы определяет каждый вуз.",
    level: "federal",
    region: null,
    category: "Образование",
    amount: "Зависит от вуза",
    segments: ["student-family"],
    criteria: { requiresStudent: true },
    how_to_apply: [
      "Обратитесь в профком, деканат или отдел соцподдержки вашего вуза",
      "Уточните перечень и суммы — их вуз устанавливает самостоятельно",
    ],
    documents: [],
    tips: [
      "Единовременное пособие при рождении ребёнка студенческой семье — например, до 200 000 ₽ (УлГПУ), 20 000 ₽ (ВВГУ, ДВФУ), 10 000 ₽ (вузы Приморского края). Зависит от вуза.",
      "Единовременная выплата при заключении брака — устанавливается вузом.",
      "Материальная помощь студентам в трудной жизненной ситуации (рождение ребёнка, потеря кормильца и т.п.) — устанавливается вузом.",
      "Компенсация оплаты за проживание в общежитии — снижение платы или полное освобождение.",
      "Понятие «студенческая семья» закреплено Федеральным законом № 258-ФЗ от 23.07.2025.",
    ],
    source_url: "https://www.gosuslugi.ru/",
    source_name: "Закон № 273-ФЗ «Об образовании» / ваш вуз",
    updated_at_label: "2026",
    is_published: false,
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const slugs = measures.map((m) => m.slug);
  const { data: existing } = await supabase.from("measures").select("slug").in("slug", slugs);
  const had = new Set((existing ?? []).map((r) => r.slug));

  const { error } = await supabase.from("measures").upsert(measures, { onConflict: "slug" });
  if (error) { console.error("Ошибка записи: " + error.message); process.exit(1); }

  const created = slugs.filter((s) => !had.has(s)).length;
  console.log(`\n✅ Обработано: ${measures.length} (новых: ${created}, обновлено: ${measures.length - created})`);
  console.log("   Все — черновики. Региональные привязаны к Московской области.");
}

main().catch((e) => { console.error(e); process.exit(1); });
