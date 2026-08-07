// Прогоняет СОХРАНЁННЫЕ анкеты живых пользователей через движок подбора и
// показывает, кому сколько мер выпадает. Ищем тех, у кого список пуст —
// именно они видят «У вас уже есть подборка», но без самих мер.
//
// Запуск: node --experimental-strip-types scripts/_audit-podbor-results.mjs

import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(ROOT, ".env.local") });

const { matchMeasures } = await import(
  pathToFileURL(join(ROOT, "src/lib/measures.ts")).href
);

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Меры — постранично (Supabase режет по тысяче).
const PAGE = 1000;
const rows = [];
for (let from = 0; ; from += PAGE) {
  const { data, error } = await sb
    .from("measures")
    .select(
      "slug,title,short_description,level,region,category,amount,segments,criteria,how_to_apply,documents,tips,source_url,source_name,updated_at_label",
    )
    .eq("is_published", true)
    .order("slug")
    .range(from, from + PAGE - 1);
  if (error) throw error;
  rows.push(...data);
  if (data.length < PAGE) break;
}
const measures = rows.map((r) => ({
  slug: r.slug,
  title: r.title,
  shortDescription: r.short_description ?? "",
  level: r.level,
  region: r.region ?? undefined,
  category: r.category,
  amount: r.amount ?? undefined,
  segments: r.segments ?? [],
  criteria: r.criteria ?? {},
  howToApply: r.how_to_apply ?? [],
  documents: r.documents ?? [],
  tips: r.tips ?? [],
  sourceUrl: r.source_url ?? "",
  sourceName: r.source_name ?? "",
  updatedAt: r.updated_at_label ?? "",
}));

const { data: users, error: uErr } = await sb
  .from("app_users")
  .select("email, survey, survey_updated_at")
  .not("survey", "is", null);
if (uErr) throw uErr;

console.log(`Мер в базе: ${measures.length}`);
console.log(`Анкет сохранено: ${users.length}\n`);

// Точно так же, как это делает форма: анкета считается заполненной, если в ней
// есть ответ про детей. Иначе показывается сама анкета, а не результат.
const filled = users.filter((u) => typeof u.survey?.hasChildren === "boolean");
console.log(`Из них «заполненных» с точки зрения формы: ${filled.length}\n`);

let empty = 0;
for (const u of filled) {
  const matched = matchMeasures(u.survey, measures, { ignoreRegion: true });
  const fed = matched.filter((m) => m.level === "federal").length;
  if (matched.length === 0) empty++;
  const mark = matched.length === 0 ? "  ← ПУСТО" : "";
  console.log(
    `  ${(u.email ?? "—").padEnd(34)} мер: ${String(matched.length).padStart(4)} (фед ${String(fed).padStart(3)})  регион: ${u.survey?.region || "не указан"}${mark}`,
  );
}

console.log(`\nАнкет с пустым результатом: ${empty} из ${filled.length}`);

// Отдельно — анкеты, которые форма НЕ считает заполненными: у таких людей
// вместо результата открывается пустая анкета заново.
const broken = users.filter((u) => typeof u.survey?.hasChildren !== "boolean");
if (broken.length > 0) {
  console.log(`\nАнкеты без ответа про детей (форма покажет пустой опрос): ${broken.length}`);
  for (const u of broken) {
    console.log(`   ${u.email} — ключи: ${Object.keys(u.survey ?? {}).join(", ").slice(0, 120)}`);
  }
}
