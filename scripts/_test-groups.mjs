// Как подборка разложится по новым группам.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { groupPodbor, POCKET_TITLE } from "../src/lib/podbor-groups.ts";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,level,region,category,amount,segments,criteria,deadline")
    .eq("is_published", true).order("sort_order").order("slug").range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const all = rows.map((r) => ({ ...r, region: r.region ?? undefined, segments: r.segments ?? [], criteria: r.criteria ?? {}, shortDescription: "", howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }));

const { data: u } = await sb.from("app_users").select("email,survey").eq("email", process.argv[2] ?? "tanya@sambot.ru").single();
const g = groupPodbor(u.survey, all);

console.log(`подборка ${u.email}: ${g.total} мер\n`);
if (g.urgent.length) {
  console.log(`УСПЕТЬ ПОДАТЬ · ${g.urgent.length}`);
  for (const it of g.urgent) console.log(`   ${it.measure.title.slice(0, 55)} — ${it.deadline.text}`);
  console.log();
}
for (const [name, bucket, count] of [["ПОЛОЖЕНО ВСЕМ", g.forAll, g.forAllCount], ["ПОЛОЖЕНО ВАМ", g.forYou, g.forYouCount]]) {
  console.log(`${name} · ${count}`);
  for (const key of ["money", "discount", "free"]) {
    const list = bucket[key];
    if (!list.length) continue;
    console.log(`  ${POCKET_TITLE[key]} · ${list.length}`);
    for (const it of list.slice(0, 6)) {
      const flags = [it.measure.amount ? it.measure.amount.slice(0, 22) : null, it.pending.length ? "нужен статус" : null].filter(Boolean);
      console.log(`     ${it.measure.title.slice(0, 52)}${flags.length ? " — " + flags.join(" · ") : ""}`);
    }
    if (list.length > 6) console.log(`     … ещё ${list.length - 6}`);
  }
  console.log();
}
