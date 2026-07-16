// Федеральный конкурс «Это у нас семейное» (платформа «Россия — страна
// возможностей»). Приз: сертификат до 5 млн ₽ на жильё (60 семей-победителей) +
// семейное путешествие по России для финалистов.
//
// Правило: ссылки (family.rsv.ru, VK) — только в source_url, в видимый текст не
// ставим. Организатора-платформу называем как есть (это и есть предмет меры).
//
// Запуск: node scripts/_seed-konkurs-semeynoe.mjs [--apply]

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

const row = {
  slug: "konkurs-eto-u-nas-semeynoe",
  title: "Конкурс «Это у нас семейное» — приз до 5 млн ₽ на жильё и путешествие",
  short_description:
    "Всероссийский семейный конкурс: команды из нескольких поколений проходят творческие, спортивные и интеллектуальные испытания. Финалисты отправляются в семейное путешествие по России, а 60 семей-победителей получают сертификат 5 000 000 ₽ на улучшение жилищных условий.",
  level: "federal",
  region: null,
  category: "Культура и отдых",
  amount:
    "Главный приз — сертификат 5 000 000 ₽ на улучшение жилищных условий (60 семей-победителей). Все финалисты — семейное путешествие по России на команду до 6 человек (проезд, проживание, питание, экскурсии)",
  segments: ["topic-housing", "topic-leisure", "class-money", "class-situational"],
  criteria: { requiresChildren: true, hasChildAgedFrom: 5, hasChildAgedTo: 17 },
  how_to_apply: [
    "Собрать семейную команду минимум из трёх поколений (дети, родители, бабушки/дедушки), от 4 человек, обязательно с ребёнком от 5 до 17 лет включительно",
    "Когда откроется новый сезон — зарегистрироваться и пройти онлайн-этап на платформе «Россия — страна возможностей»",
    "Пройти дальнейшие этапы — творческие, спортивные и интеллектуальные испытания — и подготовить короткое мотивационное видео или эссе о своей семье и её ценностях",
  ],
  documents: [
    "Заявка семейной команды на участие",
    "Мотивационное видео или эссе о семье",
  ],
  tips: [
    "В команде обязательно должен быть ребёнок от 5 до 17 лет включительно и представители минимум трёх поколений семьи.",
    "Сертификат 5 млн ₽ можно потратить только на улучшение жилищных условий: покупку квартиры или дома, погашение ипотеки или первоначальный взнос.",
    "В путешествие едут до 6 человек из команды; проезд, проживание, питание и экскурсии включены.",
    "Конкурс открыт для любых семей — многодетных, приёмных, семей участников СВО, трудовых и творческих династий, спортсменов, ветеранов труда.",
    "Новый сезон 2027 года стартует в конце декабря 2026 — начале января 2027; точные даты объявляют на платформе «Россия — страна возможностей».",
  ],
  source_name: "Конкурс «Это у нас семейное» (платформа «Россия — страна возможностей»)",
  source_url: "https://family.rsv.ru/",
  updated_at_label: "2026",
  is_published: true,
  sort_order: 0,
  verified_at: "2026-07-17T12:00:00+03:00",
  verified_by: "sverka",
};

const APPLY = process.argv.includes("--apply");
if (!APPLY) {
  console.log("Сухой прогон — 1 мера:\n");
  console.log(" ", row.slug, "|", row.level, "|", JSON.stringify(row.criteria));
  console.log(" ", row.title);
  console.log("  category:", row.category, "| segments:", row.segments.join("+"));
  console.log("\nДля записи: node scripts/_seed-konkurs-semeynoe.mjs --apply");
  process.exit(0);
}

const { error } = await sb.from("measures").upsert(row, { onConflict: "slug" });
console.log(error ? "FAIL " + error.message : "OK   " + row.slug + " — добавлена");
