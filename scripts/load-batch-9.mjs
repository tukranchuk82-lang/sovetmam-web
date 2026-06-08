// Партия 9: жильё (текст «Семья без ребёнка / с одним ребёнком» + ЖКУ).
// Почти всё уже в базе — добавляем только НОВОЕ и обогащаем существующее.
// Запуск: node scripts/load-batch-9.mjs

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

const base = {
  level: "federal",
  region: null,
  category: "Жильё и ипотека",
  amount: null,
  documents: [],
  tips: [],
  how_to_apply: ["Уточните условия в органе местного самоуправления, МФЦ или на Госуслугах"],
  source_url: "https://www.gosuslugi.ru/",
  source_name: "Госуслуги",
  updated_at_label: "2026",
  is_published: true,
};

// --- НОВЫЕ меры (надёжные, публикуем сразу) ---
const measures = [
  {
    ...base,
    slug: "socnaym-maloimushchim",
    title: "Социальный наём жилья для малоимущих",
    short_description:
      "Малоимущей семье, признанной нуждающейся в жилье, государство может предоставить жильё по договору социального найма — за низкую плату.",
    segments: [...ALL_BIRTH, "single-parent"],
    criteria: { requiresLowIncome: true },
    how_to_apply: [
      "Подтвердить статус малоимущей семьи",
      "Встать на учёт нуждающихся в жилье в органе местного самоуправления",
    ],
    tips: [
      "В отдельных регионах (Санкт-Петербург, ХМАО, Челябинская область) есть социальная аренда квартир и для тех, кто зарабатывает чуть выше прожиточного минимума.",
    ],
  },
  {
    ...base,
    slug: "selskie-vyplaty-krst",
    title: "Социальная выплата на строительство или покупку жилья на селе",
    short_description:
      "Гражданам, живущим на сельских территориях, по госпрограмме «Комплексное развитие сельских территорий» дают социальную выплату на строительство или покупку жилья.",
    amount: "часть стоимости жилья (по программе КРСТ)",
    segments: ALL_BIRTH,
    criteria: {},
    how_to_apply: [
      "Уточнить условия госпрограммы «Комплексное развитие сельских территорий»",
      "Подать заявление в орган местного самоуправления или региональный орган АПК",
    ],
    source_name: "Госуслуги / Минсельхоз России",
  },
];

// --- Обогащение существующих мер (полная замена указанных полей) ---
const patches = [
  {
    slug: "semeynaya-ipoteka",
    fields: {
      segments: [...ALL_BIRTH, "disability"],
      criteria: { requiresChildren: true, requiresMortgageIntent: true },
      tips: [
        "Программа действует до конца 2030 года. Подходит семьям: хотя бы с одним ребёнком младше 7 лет; с двумя и более несовершеннолетними детьми; с ребёнком-инвалидом.",
        "Можно рефинансировать действующий кредит на покупку жилья у застройщика или перейти на льготную ставку.",
        "Некоторые банки (Сбербанк, ВТБ, ДОМ.РФ) позволяют оформить семейную ипотеку уже во время беременности (если будущий отец — гражданин РФ) или зафиксировать ставку на период строительства.",
        "В регионах бывают дополнительные жилищные меры: региональный семейный капитал на покупку жилья, оплата аренды студенческим семьям, социальный найм для малоимущих. Уточняйте в своём регионе.",
      ],
    },
  },
  {
    slug: "lgotnye-ipoteki-territorii-it",
    fields: {
      tips: [
        "Льготная ипотека на новых территориях РФ, в Курской и Белгородской областях — ставка до 2% годовых.",
        "ИТ-ипотека — до 6% для сотрудников аккредитованных Минцифры ИТ-компаний (до 2030 года, кроме Москвы и Санкт-Петербурга; ставка может снижаться регионом или банком).",
        "Льготную ипотеку на новых территориях, в Курской и Белгородской областях может оформить только тот, кто после 23 декабря 2023 года не брал кредит по другим федеральным ипотечным программам («Семейная», «Сельская», «Дальневосточная и арктическая», «ИТ-ипотека»).",
      ],
    },
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { console.error("Нет ключей Supabase"); process.exit(1); }
  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  // Новые меры
  const slugs = measures.map((m) => m.slug);
  const { data: existing } = await supabase.from("measures").select("slug").in("slug", slugs);
  const had = new Set((existing ?? []).map((r) => r.slug));
  const { error } = await supabase.from("measures").upsert(measures, { onConflict: "slug" });
  if (error) { console.error("Ошибка записи: " + error.message); process.exit(1); }
  const created = slugs.filter((s) => !had.has(s)).length;
  console.log(`Новые меры: ${measures.length} (создано: ${created}, обновлено: ${measures.length - created})`);

  // Патчи существующих
  for (const p of patches) {
    const { data, error: e } = await supabase.from("measures").update(p.fields).eq("slug", p.slug).select("slug");
    if (e) console.warn(`${p.slug}: ${e.message}`);
    else if (!data?.length) console.warn(`${p.slug}: НЕ НАЙДЕНА (пропущена)`);
    else console.log(`${p.slug}: обогащена`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
