// Две тывинские меры, найденные попутно при доборе ЖКУ.
//
// ВАЖНО про «социальный уголь»: агент опирался на ПП РТ от 01.03.2018 № 72
// (2,2 т угля семьям с 5+ детьми). Официальный портал республики за сентябрь
// 2025 даёт другие параметры — 4+ детей, 2 т 145 кг, печное отопление, доход не
// выше ПМ. Постановление 2018 года, судя по всему, перекрыто ПП от 23.03.2020
// № 105 («Социальный уголь»), которое отменило часть прежних актов. Берём
// параметры портала, а не постановления 2018 года.
//
// ТКО заводим черновиком: сам факт меры подтверждён (ПП РТ от 03.02.2021 № 40),
// но размер компенсации нигде не подтверждается — «50 % семьям с 4+ детьми» из
// отчёта агента источником не подкреплено.
//
// Запуск: node scripts/_add-tuva-2.mjs          (сухой прогон)
//         node scripts/_add-tuva-2.mjs --apply   (запись)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

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
const TU = "Республика Тыва";

const rows = [
  {
    slug: "tuva-socugol",
    title: "«Социальный уголь»: бесплатное топливо многодетным семьям (Республика Тыва)",
    short_description:
      "Многодетным семьям с четырьмя и более детьми, которые живут в домах с печным отоплением и имеют доход ниже прожиточного минимума, осенью бесплатно привозят уголь или дрова.",
    level: "regional",
    region: TU,
    category: "Жильё и ипотека",
    amount:
      "2 тонны 145 кг угля; в Тоджинском и Тере-Хольском районах — 4,8 куб. м дров",
    segments: [
      "expecting-fourth",
      "expecting-fifth-plus",
      "many-children",
      "low-income",
      "topic-money",
      "topic-housing",
      "topic-utilities",
      "class-discount",
      "class-situational",
    ],
    criteria: {
      regions: [TU],
      minChildren: 4,
      requiresChildren: true,
      requiresLowIncome: true,
    },
    how_to_apply: [
      "Обратиться в орган социальной защиты по месту жительства до начала отопительного сезона",
    ],
    documents: [
      "Паспорт",
      "Свидетельства о рождении детей",
      "Документы о доходах семьи",
      "Документ, подтверждающий печное отопление в доме",
    ],
    tips: [
      "Топливо привозят осенью, к отопительному сезону — заявление подают заранее.",
      "Мера только для домов с печным отоплением.",
      "Такую же поддержку получают семьи участников СВО, включая семьи погибших и пропавших без вести.",
      "Параметры указаны по данным отопительного сезона 2025 года — объём и условия на текущий год уточняйте в соцзащите.",
    ],
    source_url: "https://rtyva.ru/press/news/5900/",
    source_name: "Официальный портал Республики Тыва (rtyva.ru)",
    updated_at_label: "20.07.2026",
    is_published: true,
    sort_order: 0,
    verified_at: "2026-07-20",
    verified_by:
      "добор: параметры с портала rtyva.ru (сентябрь 2025); ПП № 72 от 2018 устарело — сверить с ПП № 105 от 23.03.2020",
  },
  {
    slug: "tuva-tko-kompensaciya",
    title: "Компенсация платы за вывоз мусора многодетным семьям (Республика Тыва)",
    short_description:
      "Многодетным семьям возмещают часть расходов на коммунальную услугу по обращению с твёрдыми коммунальными отходами.",
    level: "regional",
    region: TU,
    category: "Жильё и ипотека",
    amount: "Компенсация части платы за обращение с ТКО (размер уточняется)",
    segments: [
      "expecting-third",
      "expecting-fourth",
      "expecting-fifth-plus",
      "many-children",
      "topic-money",
      "topic-utilities",
      "class-discount",
      "class-situational",
    ],
    criteria: { regions: [TU], minChildren: 3, requiresChildren: true },
    how_to_apply: [
      "Обратиться в орган социальной защиты по месту жительства",
    ],
    documents: ["Паспорт", "Свидетельства о рождении детей", "Квитанции за вывоз ТКО"],
    tips: [
      "Порядок утверждён постановлением Правительства Республики Тыва от 03.02.2021 № 40.",
      "Размер компенсации и число детей, дающее право на неё, требуют подтверждения в Минтруде республики.",
    ],
    source_url: "https://www.garant.ru/hotlaw/tyva/1446892/",
    source_name: "Постановление Правительства Республики Тыва от 03.02.2021 № 40",
    updated_at_label: "20.07.2026",
    is_published: false,
    sort_order: 0,
    verified_at: "2026-07-20",
    verified_by:
      "ЧЕРНОВИК: факт меры подтверждён (ПП № 40), размер компенсации источником не подтверждён",
  },
];

const { data: existing } = await sb
  .from("measures")
  .select("slug")
  .in("slug", rows.map((r) => r.slug));
if (existing?.length) {
  console.log("уже есть в базе:", existing.map((m) => m.slug).join(", "), "— прерываюсь");
  process.exitCode = 1;
} else {
  for (const r of rows) {
    console.log(`\n=== ${r.slug} ===`);
    console.log(`  ${r.title}`);
    console.log(`  ${r.amount}`);
    console.log(`  criteria: ${JSON.stringify(r.criteria)}`);
    console.log(`  публикуем: ${r.is_published ? "да" : "НЕТ (черновик)"}`);
  }

  if (!APPLY) {
    console.log("\n\nСУХОЙ ПРОГОН. Записи не было. Для применения: --apply");
  } else {
    const { error } = await sb.from("measures").insert(rows);
    if (error) throw error;
    console.log("\n✓ записано 2 карточки (1 опубликована, 1 в черновике)");
  }
}
