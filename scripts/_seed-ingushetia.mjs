// Республика Ингушетия — первые региональные меры. Суммы подтверждены
// менеджером: Приложение № 9 к закону РИ о бюджете на 2025–2027 гг. +
// постановление Правительства РИ.
//
// Примечание: в исходнике заголовок упоминает «пятого и последующих», но
// конкретная лесенка размеров дана начиная с 8-го ребёнка — её и вносим,
// суммы за 5–7-го не выдумываем.
//
// Запуск: node scripts/_seed-ingushetia.mjs [--apply]

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

const ING = "Республика Ингушетия";
const base = {
  level: "regional",
  region: ING,
  category: "Выплаты и пособия",
  updated_at_label: "2026",
  is_published: true,
  sort_order: 0,
  source_name: "Приложение № 9 к закону Республики Ингушетия о бюджете на 2025–2027 гг.; постановление Правительства РИ",
  source_url: "https://ingushetia.ru/",
};

const rows = [
  {
    ...base,
    slug: "ingushetia-001",
    title: "Единовременная выплата за рождение 8-го и последующих детей (Республика Ингушетия)",
    short_description:
      "Многодетным семьям при рождении восьмого и каждого следующего ребёнка выплачивают единовременное пособие. Размер растёт с очерёдностью ребёнка: за 8-го — 10 000 ₽, и далее на 1 000 ₽ больше за каждого следующего, до 18 000 ₽ за 15-го.",
    amount: "10 000 ₽ за 8-го ребёнка, +1 000 ₽ за каждого следующего до 18 000 ₽ за 15-го (9-й — 11 000 ₽, 10-й — 12 000 ₽ и т.д.)",
    segments: ["many-children", "expecting-fifth-plus", "topic-money", "class-money", "class-once-life"],
    criteria: { regions: [ING], minChildren: 8, requiresChildren: true },
    how_to_apply: [
      "Обратиться в орган социальной защиты населения по месту жительства или в МФЦ",
      "Подать заявление, приложить свидетельства о рождении всех детей",
    ],
    documents: [
      "Паспорт заявителя",
      "Свидетельства о рождении всех детей",
      "Документ, подтверждающий статус многодетной семьи",
      "Банковские реквизиты",
    ],
    tips: [
      "Размер зависит от того, каким по счёту родился ребёнок.",
      "Выплата рассчитана на очень большие семьи — начиная с восьмого ребёнка.",
    ],
  },
  {
    ...base,
    slug: "ingushetia-002",
    title: "Выплата при рождении двойни или тройни (Республика Ингушетия)",
    short_description:
      "Семьям при одновременном рождении нескольких детей выплачивают единовременное пособие: за двойню — 25 000 ₽, за тройню и большее число детей — 50 000 ₽.",
    amount: "25 000 ₽ за двойню; 50 000 ₽ за тройню и более детей одновременно",
    segments: ["many-children", "topic-money", "class-money", "class-once-life"],
    criteria: { regions: [ING], minChildren: 2, requiresChildren: true },
    how_to_apply: [
      "Обратиться в орган социальной защиты населения по месту жительства или в МФЦ",
      "Подать заявление, приложить свидетельства о рождении детей",
    ],
    documents: [
      "Паспорт заявителя",
      "Свидетельства о рождении детей",
      "Банковские реквизиты",
    ],
    tips: [
      "Выплата — именно за одновременное рождение (двойня, тройня и более), а не за общее число детей в семье.",
    ],
  },
];

const APPLY = process.argv.includes("--apply");
if (!APPLY) {
  console.log(`Сухой прогон: ${rows.length} меры (Ингушетия):\n`);
  for (const r of rows) console.log(`  ${r.slug}  ${JSON.stringify(r.criteria)}\n    ${r.title}\n    amount: ${r.amount}\n`);
  console.log("Для записи: node scripts/_seed-ingushetia.mjs --apply");
  process.exit(0);
}

let ok = 0, fail = 0;
for (const r of rows) {
  const { error } = await sb.from("measures").upsert(r, { onConflict: "slug" });
  if (error) { console.log("FAIL", r.slug, "-", error.message); fail++; }
  else { console.log("OK  ", r.slug); ok++; }
}
// отметим проверенными (данные подтверждены менеджером)
await sb.from("measures").update({ verified_at: "2026-07-16T12:00:00+03:00", verified_by: "sverka" }).in("slug", rows.map((r) => r.slug));
console.log(`\nDONE: ${ok} добавлено, ${fail} ошибок`);
