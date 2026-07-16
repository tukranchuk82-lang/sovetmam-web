// Актуализация федеральных наград «Родительская слава» на 2026.
// Единовременные суммы верны (медаль 200 000 ₽ / орден 500 000 ₽), но у обеих
// с 01.10.2025 появилась ЕЖЕМЕСЯЧНАЯ выплата каждому награждённому родителю
// (медаль 1 281,10 ₽, орден 2 562,20 ₽) — её не было ни у нас, ни в карточке
// клиента. Плюс уточнения (усыновители 5 лет; развод/оценки — не препятствие).
//
// Запуск: node scripts/_update-roditelskaya-slava.mjs [--apply]

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

const V = "2026-07-17T12:00:00+03:00";
const PATCHES = {
  "gosnagrady-mnogodetnym": {
    amount:
      "200 000 ₽ единовременно (одному из родителей, без налога) + ежемесячная денежная выплата 1 281,10 ₽ каждому награждённому родителю (с 1 октября 2025, индексируется)",
    tips: [
      "Это ближайшая доступная награда для семьи с 4–6 детьми: звание «Мать-героиня» требует 10 детей, орден «Родительская слава» — семерых.",
      "Ключевое условие по срокам: четвёртому ребёнку должно исполниться три года.",
      "Усыновлённые дети учитываются, если воспитываются в семье не менее пяти лет.",
      "Самостоятельно «подать на медаль» нельзя — нужно ходатайство организации, но начать разговор об этом семья может сама, придя в соцзащиту.",
      "Учитывают не только число детей, но и заботу о них: здоровье, образование, развитие, участие в спорте, творчестве и общественной жизни.",
      "Развод родителей или отсутствие у детей отличных оценок — не препятствие; важна реальная вовлечённость родителей и подтверждённая активность детей (грамоты, секции, кружки).",
      "Помимо федеральной медали почти в каждом регионе есть своя награда многодетным с отдельной выплатой — её можно получить дополнительно.",
      "Единовременная выплата одна на семью, а ежемесячную получает каждый награждённый родитель.",
    ],
    verified_at: V,
    verified_by: "sverka",
  },
  "orden-roditelskaya-slava": {
    amount:
      "500 000 ₽ единовременно (одному из родителей, без налога) + ежемесячная денежная выплата 2 562,20 ₽ каждому награждённому родителю (с 1 октября 2025, индексируется)",
    tips: [
      "Нужно, чтобы седьмому ребёнку исполнилось три года, а остальные дети были живы.",
      "Знак ордена вручают обоим родителям; единовременное поощрение — одно на семью, а ежемесячную выплату получает каждый награждённый родитель.",
      "Усыновлённые дети учитываются, если воспитываются в семье не менее пяти лет.",
      "Учитывают не только число детей, но и заботу о них: здоровье, образование, физическое, духовное и нравственное развитие, вклад семьи в укрепление семейных ценностей.",
      "Развод родителей или отсутствие у детей отличных оценок — не препятствие; важна реальная вовлечённость родителей и подтверждённая активность детей.",
      "Регионы обычно выдвигают на орден одну-две семьи в год, поэтому важно собрать сильный пакет: грамоты, дипломы, достижения детей.",
    ],
    verified_at: V,
    verified_by: "sverka",
  },
};

const APPLY = process.argv.includes("--apply");
const slugs = Object.keys(PATCHES);
const { data: cur, error } = await sb.from("measures").select("*").in("slug", slugs);
if (error) { console.error(error.message); process.exit(1); }
const bySlug = Object.fromEntries(cur.map((r) => [r.slug, r]));

for (const slug of slugs) {
  const c = bySlug[slug], p = PATCHES[slug];
  console.log("\n### " + slug);
  for (const k of ["amount", "tips"]) {
    console.log(`  ${k}:`);
    console.log("    − " + JSON.stringify(c[k]));
    console.log("    + " + JSON.stringify(p[k]));
  }
}

if (!APPLY) {
  console.log("\nСухой прогон. Для записи: node scripts/_update-roditelskaya-slava.mjs --apply");
  process.exit(0);
}

writeFileSync("verification/backup-roditelskaya-slava.json", JSON.stringify(cur, null, 2));
let ok = 0;
for (const slug of slugs) {
  const { error } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (error) console.log("FAIL", slug, error.message);
  else { console.log("OK  ", slug); ok++; }
}
console.log(`\nDONE: ${ok}/${slugs.length}. Бэкап: verification/backup-roditelskaya-slava.json`);
