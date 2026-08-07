// Сколько мер стоит за каждой плиткой главной. Показывает пустые и подозрительно
// тощие витрины — те самые «зависшие карточки».
//
// Запуск: node scripts/_audit-tiles.mjs

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(ROOT, ".env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Постранично: без range Supabase молча отдаёт первую тысячу.
const PAGE = 1000;
const all = [];
for (let from = 0; ; from += PAGE) {
  const { data, error } = await sb
    .from("measures")
    .select("slug,title,level,region,segments,criteria")
    .eq("is_published", true)
    .order("slug")
    .range(from, from + PAGE - 1);
  if (error) throw error;
  all.push(...data);
  if (data.length < PAGE) break;
}
console.log(`Опубликованных мер: ${all.length}\n`);

const has = (m, tag) => (m.segments ?? []).includes(tag);
const count = (fn) => all.filter(fn).length;
const fed = (fn) => all.filter((m) => fn(m) && m.level === "federal").length;

function report(title, rows) {
  console.log(`── ${title}`);
  for (const [name, href, fn] of rows) {
    const n = count(fn);
    const f = fed(fn);
    const mark = n === 0 ? "  ПУСТО" : n < 10 ? "  мало" : "";
    console.log(
      `   ${name.padEnd(26)} ${href.padEnd(34)} ${String(n).padStart(5)} (фед ${f})${mark}`,
    );
  }
  console.log();
}

report("Ждём ребёнка", [
  ["Ждём 1-го", "/segment/expecting-first", (m) => has(m, "expecting-first")],
  ["Ждём 2-го", "/segment/expecting-second", (m) => has(m, "expecting-second")],
  ["Ждём 3-го", "/segment/expecting-third", (m) => has(m, "expecting-third")],
  ["Ждём 4-го", "/segment/expecting-fourth", (m) => has(m, "expecting-fourth")],
  ["Ждём 5-го и более", "/segment/expecting-fifth-plus", (m) => has(m, "expecting-fifth-plus")],
]);

report("Семья с N детьми (по criteria.minChildren)", [
  ...[1, 2, 3, 4, 5].map((n) => [
    `Семья с ${n}`,
    `/family/${n}`,
    (m) => (m.criteria?.minChildren ?? 1) <= n,
  ]),
  ["Многодетная", "/family/many", (m) => has(m, "many-children")],
]);

report("Жизненные ситуации", [
  ["Молодая семья", "/situation/young-family", (m) => has(m, "young-family")],
  ["Низкий доход", "/situation/low-income", (m) => has(m, "low-income")],
  ["Одинокий родитель", "/situation/single-parent", (m) => has(m, "single-parent")],
  ["Родитель-инвалид", "/situation/parent-disability", (m) => has(m, "parent-disability")],
  ["Ребёнок-инвалид", "/situation/child-disability", (m) => has(m, "child-disability")],
  ["Потеря в семье", "/situation/loss", (m) => has(m, "loss")],
  ["Ясли", "/situation/nursery", (m) => has(m, "nursery")],
  ["Детский сад", "/situation/kindergarten", (m) => has(m, "kindergarten")],
  ["Колледж", "/situation/college", (m) => has(m, "college")],
  ["ВУЗ", "/situation/university", (m) => has(m, "university")],
  ["Семья и отпуск", "/situation/vacation", (m) => has(m, "vacation")],
  ["Семейный бизнес", "/situation/family-business", (m) => has(m, "family-business")],
  ["Бабушки и дедушки", "/situation/grandparents", () => false],
  ["Вторая семья", "/situation/second-family", () => false],
  ["Школа", "/segment/schoolchild", (m) => has(m, "schoolchild")],
  ["Студенческая семья", "/segment/student-family", (m) => has(m, "student-family")],
  ["Приёмные родители", "/segment/foster-family", (m) => has(m, "foster-family")],
  ["Семья участника СВО", "/segment/svo-family", (m) => has(m, "svo-family")],
]);

const TOPICS = [
  "money", "health", "housing", "utilities", "transport", "education",
  "employers", "vuz", "leisure", "culture", "sport", "taxes", "social",
  "business", "nko", "shops", "kids-goods",
];
report(
  "Темы",
  TOPICS.map((k) => [k, `/topic/${k}`, (m) => has(m, `topic-${k}`)]),
);

const CLASSES = [
  "free", "discount", "money", "once-life", "once-year", "once-month", "situational",
];
report(
  "Классификация",
  CLASSES.map((k) => [k, `/class/${k}`, (m) => has(m, `class-${k}`)]),
);

// Меры, не попавшие ни в одну витрину классификации и тем.
const noTopic = all.filter((m) => !TOPICS.some((k) => has(m, `topic-${k}`)));
const noClass = all.filter((m) => !CLASSES.some((k) => has(m, `class-${k}`)));
console.log(`Без темы: ${noTopic.length}`);
console.log(`Без класса: ${noClass.length}`);
