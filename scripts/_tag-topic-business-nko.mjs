// Разметка витринных меток для новых тематических плиток на главной:
// «Бизнес» (topic-business) и «НКО» (topic-nko). Заменили собой «Магазины» и
// «Товары для детей».
//
// Бизнес — это преференции, которые семьям даёт САМ бизнес (торговые сети,
// компании): скидки, кешбэк, карты лояльности. В базе они лежат в категории
// «Скидки в магазинах». Господдержка предпринимателей сюда НЕ входит — она
// живёт в теме «Работодатели» (topic-employers).
//
// НКО — помощь от фондов и некоммерческих организаций (в т.ч. государственных
// фондов: «Круг добра», «Защитники Отечества»). Отбираем поимённо: формального
// поля «кто предоставляет» в таблице нет, а поиск по тексту даёт ложные
// срабатывания («жилищного фонда», «фонд оплаты труда»).
//
// Скрипт идемпотентен: метки добавляются без дублей, повторный запуск безопасен.

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

// «Бизнес» — вся категория «Скидки в магазинах» (отбор по категории, чтобы
// новые меры от сетей подхватывались повторным запуском).
const BUSINESS_CATEGORY = "Скидки в магазинах";

// «НКО» — поимённо.
const NKO_SLUGS = [
  "fond-krug-dobra", // Фонд «Круг добра» — лекарства детям с орфанными болезнями
  "fond-zashchitniki-otechestva", // Фонд «Защитники Отечества» — сопровождение семей
  "detskiy-telefon-doveriya", // оператор — Фонд поддержки детей в ТЖС
  "rstadd-015", // соцкоординатор «Защитники Отечества» (Ростовская область)
];

const { data: rows, error } = await sb
  .from("measures")
  .select("slug,title,category,segments")
  .or(`category.eq.${BUSINESS_CATEGORY},slug.in.(${NKO_SLUGS.join(",")})`);
if (error) throw error;

let touched = 0;
for (const m of rows) {
  const tag = m.category === BUSINESS_CATEGORY ? "topic-business" : "topic-nko";
  const segments = m.segments || [];
  if (segments.includes(tag)) {
    console.log(`= уже размечено [${tag}] ${m.title}`);
    continue;
  }
  const { error: upErr } = await sb
    .from("measures")
    .update({ segments: [...segments, tag] })
    .eq("slug", m.slug);
  if (upErr) throw upErr;
  touched++;
  console.log(`+ ${tag} → ${m.title}`);
}

const missing = NKO_SLUGS.filter((s) => !rows.some((r) => r.slug === s));
if (missing.length) console.log("\n!! слаги не найдены:", missing.join(", "));

console.log(`\nОбновлено мер: ${touched} из ${rows.length}`);
