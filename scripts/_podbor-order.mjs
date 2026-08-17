// Точный порядок мер в подборке: как их отдаёт база (sort_order, slug)
// и как их раскладывает список на экране.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { matchMeasures } from "../src/lib/measures.ts";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await sb
    .from("measures")
    .select("slug,title,level,region,category,criteria,segments")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("slug", { ascending: true })
    .range(from, from + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}
const measures = rows.map((r) => ({
  slug: r.slug, title: r.title, level: r.level, region: r.region ?? undefined,
  category: r.category, segments: r.segments ?? [], criteria: r.criteria ?? {},
  shortDescription: "", amount: null, howToApply: [], documents: [], tips: [],
}));

const { data: u } = await sb.from("app_users").select("email,survey").eq("email", process.argv[2] ?? "tanya@sambot.ru").single();
const matched = matchMeasures(u.survey, measures, { ignoreRegion: !u.survey.region });

const SHOP = "Скидки в магазинах";
const order = [...matched].sort(
  (a, b) =>
    (a.level === "federal" ? 0 : 1) - (b.level === "federal" ? 0 : 1) ||
    (a.category === SHOP ? 1 : 0) - (b.category === SHOP ? 1 : 0),
);
console.log(`подбор для ${u.email}: ${matched.length} мер. Сразу видно первые 10.\n`);
order.forEach((m, i) => {
  const mark = /земел|участок/i.test(m.title) ? "   ←←← ЗЕМЛЯ" : "";
  const cut = i === 10 ? "\n--- дальше только по кнопке «Показать ещё» ---\n" : "";
  console.log(`${cut}${String(i + 1).padStart(2)}. [${m.level === "federal" ? "фед" : "рег"}] ${m.title.slice(0, 68)}${mark}`);
});
