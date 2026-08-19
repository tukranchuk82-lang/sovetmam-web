// Проверка порядка выдачи: внутри кармана сначала федеральные меры, потом
// региональные, и в каждой половине сначала те, у которых названа сумма.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { groupPodbor, POCKET_TITLE } from "../src/lib/_podbor-groups-run.ts";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const s = line.trim();
  if (!s || s.startsWith("#") || !s.includes("=")) continue;
  const i = s.indexOf("=");
  env[s.slice(0, i)] = s.slice(i + 1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb
    .from("measures")
    .select("slug,title,level,region,category,amount,segments,criteria,deadline")
    .eq("is_published", true)
    .range(f, f + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}
const measures = rows.map((r) => ({
  ...r,
  region: r.region ?? undefined,
  segments: r.segments ?? [],
  criteria: r.criteria ?? {},
  shortDescription: "",
  howToApply: [],
  documents: [],
  tips: [],
  sourceUrl: "",
  sourceName: "",
  updatedAt: "",
}));

const profile = {
  region: "Костромская область",
  hasChildren: true,
  childrenCount: 3,
  children: [
    { birthMonth: 5, birthYear: 2014 },
    { birthMonth: 3, birthYear: 2019 },
    { birthMonth: 9, birthYear: 2021 },
  ],
  familyStatus: "married",
  employment: "working",
  employmentKind: "hired",
  lowIncome: true,
};

const g = groupPodbor(profile, measures, new Date("2026-08-19T12:00:00"));
console.log(`всего в подборке: ${g.total} (всем — ${g.forAllCount}, вам — ${g.forYouCount}, горит срок — ${g.urgent.length})`);

let allOk = true;
for (const [group, title] of [[g.forAll, "ПОЛОЖЕНО ВСЕМ"], [g.forYou, "ПОЛОЖЕНО ВАМ"]]) {
  console.log(`\n${title}`);
  for (const key of ["money", "discount", "free"]) {
    const items = group[key];
    if (!items.length) continue;
    console.log(` ${POCKET_TITLE[key]} — ${items.length}:`);
    for (const it of items.slice(0, 5)) {
      const lvl = it.measure.level === "federal" ? "ФЕД" : "рег";
      console.log(`   ${lvl} ${it.measure.amount ? "\u20bd" : " "} ${it.measure.title.slice(0, 56)}`);
    }
    const levels = items.map((i) => (i.measure.level === "federal" ? 0 : 1));
    const ok = levels.every((v, i) => i === 0 || levels[i - 1] <= v);
    if (!ok) allOk = false;
    console.log(`   федеральные впереди: ${ok ? "да" : "НЕТ"}`);
  }
}
console.log(`\nитог: ${allOk ? "порядок верный" : "ПОРЯДОК НАРУШЕН"}`);
