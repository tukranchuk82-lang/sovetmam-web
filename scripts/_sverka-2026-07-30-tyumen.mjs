// Сверка 30.07.2026 — резервный день, Тюменская область.
//
// Источник: официальный буклет «Меры социальной поддержки семей с детьми
// в Тюменской области» (2026 год), выпущен по заказу Департамента социального
// развития области, опубликован на сайте Центра предоставления мер соцподдержки
// centrmsp72.ru. Именно оттуда взяты пороги и размеры.
//
// Прожиточный минимум Тюменской области на 2026: 18 939 ₽ на душу населения,
// 20 644 ₽ для трудоспособных, 18 371 ₽ на ребёнка.
//
// Запуск: node scripts/_sverka-2026-07-30-tyumen.mjs           (сухой прогон)
//         node scripts/_sverka-2026-07-30-tyumen.mjs --apply    (запись, с бэкапом)
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

const VERIFIED = {
  verified_at: "2026-07-30T12:00:00+00:00",
  verified_by: "сверка 30.07.2026 по буклету Департамента соцразвития Тюменской области (2026)",
  updated_at_label: "2026",
};
const SRC = {
  source_name: "Департамент социального развития Тюменской области, буклет «Меры социальной поддержки семей с детьми» (2026)",
  source_url: "https://centrmsp72.ru/",
};

const patches = [
  {
    slug: "tyumen-004",
    reason: "подтверждено: 2 000 ₽ единовременно на каждого ребёнка, порог — ПМ на душу 18 939 ₽",
    fields: {
      ...VERIFIED,
      ...SRC,
      amount: "2 000 ₽ единовременно на каждого ребёнка",
      short_description:
        "Малоимущей семье выплачивают по 2 000 ₽ на каждого ребёнка до 18 лет, а на студентов очной формы — до 23 лет.",
      tips: [
        "Назначают, если среднедушевой доход семьи ниже прожиточного минимума на душу населения — в 2026 году это 18 939 ₽.",
        "Доход должен быть низким по независящим от семьи причинам.",
        "Выплата разовая, считается на каждого ребёнка отдельно.",
      ],
    },
  },
  {
    slug: "tyumen-008",
    reason: "подтверждено: 30 % ЖКУ по нормативам, отдельно вывоз мусора — 100 % на детей и 30 % на родителей",
    fields: {
      ...VERIFIED,
      ...SRC,
      amount: "30 % платы за ЖКУ; вывоз мусора — 100 % на детей и 30 % на родителей",
      tips: [
        "Компенсацию считают по нормативам и тарифам, а не по фактическому счёту.",
        "Право есть у малоимущих семей: среднедушевой доход ниже прожиточного минимума для трудоспособных — в 2026 году 20 644 ₽.",
        "Плата за вывоз мусора компенсируется полностью за детей и на 30 % за родителей.",
      ],
    },
  },
  {
    slug: "tyumen-013",
    reason: "подтверждено: компенсация 50 % расходов на ЖКУ",
    fields: {
      ...VERIFIED,
      ...SRC,
      amount: "50 % расходов на жильё и коммунальные услуги",
      tips: [
        "Компенсацию считают по показаниям счётчиков, но не больше нормативов потребления.",
        "Право есть у семей с детьми-инвалидами и у самих инвалидов.",
        "Доход семьи для этой меры не проверяют.",
      ],
    },
  },
  {
    slug: "tyumen-003",
    reason: "размер привязан к прожиточному минимуму на ребёнка: в 2026 году 18 371 ₽ (в базе была сумма прошлого года)",
    fields: {
      ...VERIFIED,
      ...SRC,
      amount: "18 371 ₽ в месяц (прожиточный минимум на ребёнка в 2026 году)",
      tips: [
        "Размер равен прожиточному минимуму на ребёнка в области и пересматривается каждый год.",
        "Выплата идёт до трёх лет ребёнка.",
        "Назначают семьям с невысоким доходом — порог считают по прожиточному минимуму.",
      ],
    },
  },
  {
    slug: "tyumen-005",
    reason: "подтверждено: 10 000 ₽, порог — ПМ для трудоспособных 20 644 ₽",
    fields: {
      ...VERIFIED,
      ...SRC,
      amount: "10 000 ₽",
      tips: [
        "Помощь дают по медицинским показаниям — нужно заключение врача.",
        "Право есть у беременных, кормящих матерей и семей с детьми до трёх лет.",
        "Порог по доходу — прожиточный минимум для трудоспособного населения, в 2026 году 20 644 ₽.",
      ],
    },
  },
  {
    slug: "tyumen-006",
    reason:
      "условие подтверждено (проживание в области не менее 5 лет), но размер выплаты в буклете не назван — оставляем скрытой до ответа департамента",
    fields: {
      ...VERIFIED,
      verified_by:
        VERIFIED.verified_by + "; размер не подтверждён, нужен письменный запрос",
      tips: [
        "Выплату дают семьям, где одновременно родились трое и более детей.",
        "Обязательное условие — семья живёт в Тюменской области не менее пяти лет.",
        "Деньги целевые: на покупку жилья или улучшение жилищных условий.",
      ],
    },
  },
];

// Меры из буклета, которых нет в базе.
const additions = [
  {
    slug: "tyumen-021",
    title: "Ежегодная выплата на школьную и спортивную форму (Тюменская область)",
    short_description:
      "Раз в год на каждого школьника из семьи с невысоким доходом выплачивают сумму размером с прожиточный минимум на ребёнка.",
    amount: "18 371 ₽ в год на каждого школьника (прожиточный минимум на ребёнка)",
    category: "Образование",
    level: "regional",
    region: "Тюменская область",
    segments: ["schoolchild", "low-income", "many-children", "topic-education", "topic-money", "class-money", "class-once-year"],
    criteria: {
      regions: ["Тюменская область"],
      requiresChildren: true,
      minSchoolChildren: 1,
      requiresLowIncome: true,
    },
    how_to_apply: [
      "Подать заявление через портал услуг Тюменской области, на Госуслугах или в МФЦ",
    ],
    documents: [
      "Паспорт заявителя",
      "Свидетельства о рождении детей",
      "Справка об обучении ребёнка в школе",
      "Сведения о доходах семьи",
      "Банковские реквизиты",
    ],
    tips: [
      "Размер равен прожиточному минимуму на ребёнка в области — в 2026 году 18 371 ₽.",
      "Порог по доходу — прожиточный минимум для трудоспособного населения, 20 644 ₽.",
      "Выплата ежегодная и назначается на каждого ребёнка-школьника.",
    ],
    is_published: true,
    sort_order: 0,
    ...VERIFIED,
    ...SRC,
  },
  {
    slug: "tyumen-022",
    title: "Выплата на молочное питание детям до двух лет (Тюменская область)",
    short_description:
      "Семьям с невысоким доходом ежемесячно платят на специальные молочные продукты для детей первого и второго года жизни.",
    amount: "1 212,65 ₽ в месяц до года, 606,34 ₽ — от года до двух",
    category: "Здоровье",
    level: "regional",
    region: "Тюменская область",
    segments: ["expecting-first", "expecting-second", "expecting-third", "nursery", "low-income", "topic-health", "topic-kids-goods", "class-money", "class-once-month"],
    criteria: {
      regions: ["Тюменская область"],
      requiresChildren: true,
      hasChildAgedFrom: 0,
      hasChildAgedTo: 2,
      requiresLowIncome: true,
    },
    how_to_apply: [
      "Подать заявление через портал услуг Тюменской области, на Госуслугах или в МФЦ",
    ],
    documents: [
      "Паспорт заявителя",
      "Свидетельство о рождении ребёнка",
      "Сведения о доходах семьи",
      "Банковские реквизиты",
    ],
    tips: [
      "Порог по доходу — прожиточный минимум для трудоспособного населения, в 2026 году 20 644 ₽.",
      "В Уватском районе суммы выше: 1 581,72 ₽ до года и 790,88 ₽ от года до двух.",
      "Выплата заменяет выдачу продуктов деньгами — покупать питание можно самим.",
    ],
    is_published: true,
    sort_order: 0,
    ...VERIFIED,
    ...SRC,
  },
];

const { data: current, error } = await sb
  .from("measures")
  .select("*")
  .eq("region", "Тюменская область");
if (error) throw error;

const existing = new Set(current.map((m) => m.slug));
const toAdd = additions.filter((a) => !existing.has(a.slug));

console.log(`мер по региону: ${current.length}\n=== Правки ===`);
for (const p of patches) {
  const cur = current.find((m) => m.slug === p.slug);
  console.log(`~ ${p.slug} — ${cur ? cur.title.replace(" (Тюменская область)", "").slice(0, 55) : "НЕ НАЙДЕНА"}`);
  console.log(`    было:  ${cur?.amount ?? "—"}`);
  if (p.fields.amount) console.log(`    стало: ${p.fields.amount}`);
  console.log(`    ${p.reason}`);
}
console.log(`\n=== Новые меры: ${toAdd.length} ===`);
for (const a of toAdd) console.log(`+ ${a.slug} — ${a.title} (${a.amount})`);

if (!APPLY) {
  console.log("\nСухой прогон. Для записи: node scripts/_sverka-2026-07-30-tyumen.mjs --apply");
  process.exit(0);
}

writeFileSync("verification/backup-tyumen-2026-07-30.json", JSON.stringify(current, null, 2), "utf8");
console.log("\nБэкап: verification/backup-tyumen-2026-07-30.json");

for (const p of patches) {
  const { error: e } = await sb.from("measures").update(p.fields).eq("slug", p.slug);
  console.log(e ? `! ${p.slug}: ${e.message}` : `Обновлено: ${p.slug}`);
}
if (toAdd.length) {
  const { error: e } = await sb.from("measures").insert(toAdd);
  console.log(e ? `! добавление: ${e.message}` : `Добавлено мер: ${toAdd.length}`);
}
