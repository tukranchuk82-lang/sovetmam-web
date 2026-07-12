// График регулярной сверки мер с официальными источниками.
//
// Вычитывать все 2159 мер за один день невозможно — качество упадёт. Поэтому
// база обходится за месяц порциями:
//   1-е число        — федеральные меры
//   2-е … 27-е       — по 3–4 региона в день (89 регионов)
//   28-е … конец мес.— резерв: доработка спорных мест, повторная проверка
//
// Запуск: node scripts/verify-schedule.mjs [день]
// Без аргумента берётся сегодняшнее число. Скрипт печатает, что сверять
// сегодня, и выгружает сами меры — их читает уже человек (или агент).
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Список регионов берём из кода приложения — чтобы график и каталог не разъехались.
const src = readFileSync("src/lib/measures.ts", "utf8");
const block = src.match(/export const REGIONS = \[([\s\S]*?)\] as const;/);
const REGIONS = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

// Разбивка та же, что в src/lib/verification.ts (её использует админка).
// Логика продублирована намеренно: скрипт запускается голым node, без сборщика,
// и импортировать .ts не может. Если правишь здесь — правь и там.
function planFor(day) {
  if (day === 1) return { kind: "federal", title: "Федеральные меры" };
  const chunks = [];
  let i = 0;
  let d = 2;
  while (i < REGIONS.length) {
    const size = d % 2 === 0 ? 3 : 4; // 3–4 региона в день: 89 регионов ложатся во 2…27
    chunks.push({ day: d, regions: REGIONS.slice(i, i + size) });
    i += size;
    d++;
  }
  const chunk = chunks.find((c) => c.day === day);
  if (!chunk) return { kind: "reserve", title: "Резервный день: доработка спорных мер" };
  return { kind: "regions", title: chunk.regions.join(", "), regions: chunk.regions };
}

const day = Number(process.argv[2]) || new Date().getDate();
const plan = planFor(day);

console.log(`\n=== СВЕРКА, ${day}-е число: ${plan.title} ===\n`);
if (plan.kind === "reserve") {
  console.log("Плановых мер на сегодня нет. Используйте день, чтобы:");
  console.log("  · доработать меры, помеченные как спорные в прошлые дни;");
  console.log("  · перепроверить меры, по которым были обращения пользователей.");
  process.exit(0);
}

let all = [];
let from = 0;
while (true) {
  let q = sb
    .from("measures")
    .select("slug,title,short_description,amount,how_to_apply,documents,tips,criteria,region,level,source_name")
    .eq("is_published", true)
    .range(from, from + 999);
  const { data, error } = await q;
  if (error) throw error;
  all = all.concat(data);
  if (data.length < 1000) break;
  from += 1000;
}

const list =
  plan.kind === "federal"
    ? all.filter((m) => m.level === "federal")
    : all.filter((m) => plan.regions.includes(m.region));

console.log(`мер к сверке: ${list.length}\n`);
if (plan.kind === "regions") {
  for (const r of plan.regions) {
    console.log(`  ${r}: ${list.filter((m) => m.region === r).length}`);
  }
}

mkdirSync("verification", { recursive: true });
const file = `verification/day-${String(day).padStart(2, "0")}.json`;
writeFileSync(file, JSON.stringify({ day, plan: plan.title, measures: list }, null, 2));
console.log(`\nвыгружено в ${file} — эти меры и сверяем с официальными источниками.`);
