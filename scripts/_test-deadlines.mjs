// Как срок выглядит для разных семей.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { deadlineStatus } from "../src/lib/measures.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const { data } = await sb.from("measures").select("slug,title,deadline").not("deadline", "is", null);
const measures = Object.fromEntries(data.map((m) => [m.slug, { ...m, criteria: {}, segments: [] }]));

const now = new Date();
const monthsAgo = (n) => {
  const d = new Date(now.getFullYear(), now.getMonth() - n, 1);
  return { birthMonth: d.getMonth() + 1, birthYear: d.getFullYear() };
};
const base = { pregnant: false, hasChildren: true, childrenCount: 1, childrenAges: [0], region: "Москва" };

const cases = [
  ["ребёнок родился 2 месяца назад", { ...base, children: [monthsAgo(2)] }, "edinovremennoe-pri-rozhdenii-rebenka"],
  ["ребёнку 5 месяцев", { ...base, children: [monthsAgo(5)] }, "edinovremennoe-pri-rozhdenii-rebenka"],
  ["ребёнку 8 месяцев — срок прошёл", { ...base, children: [monthsAgo(8)] }, "edinovremennoe-pri-rozhdenii-rebenka"],
  ["ждёт первенца", { ...base, pregnant: true, hasChildren: false, children: [] }, "edinovremennoe-pri-rozhdenii-rebenka"],
  ["беременна, срок до 12 недель, на учёт не встала", { ...base, pregnant: true, pregnancyStage: "under12", registeredEarly: false, children: [] }, "edinoe-posobie"],
  ["беременна, уже встала на учёт", { ...base, pregnant: true, pregnancyStage: "under12", registeredEarly: true, children: [] }, "edinoe-posobie"],
  ["беременна, срок 28–35 недель", { ...base, pregnant: true, pregnancyStage: "28-35", children: [] }, "edinoe-posobie"],
  ["любая семья — семейная выплата", base, "semeynaya-nalogovaya-vyplata-2025"],
  ["жена призывника", base, "posobie-na-rebenka-voennosluzhashego-po-prizyvu"],
];

console.log(`сегодня ${now.toLocaleDateString("ru-RU")}\n`);
for (const [name, profile, slug] of cases) {
  const st = deadlineStatus(profile, measures[slug], now);
  console.log(`${name}:`);
  console.log(`   ${st ? (st.urgent ? "СРОЧНО · " : "") + st.text : "— (ничего не показываем)"}\n`);
}
