// Подборка по анкете конкретного человека — чтобы глазами увидеть, что ему
// выдаёт приложение. Запуск: node scripts/_check-anketa.mjs <email>
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { matchMeasures, evaluateEligibility } from "../src/lib/measures.ts";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,level,region,category,amount,segments,criteria,deadline")
    .eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const all = rows.map((r) => ({ ...r, region: r.region ?? undefined, segments: r.segments ?? [], criteria: r.criteria ?? {}, shortDescription: "", howToApply: [], documents: [], tips: [], sourceUrl: "", sourceName: "", updatedAt: "" }));

const email = process.argv[2];
const { data: users, error: ue } = await sb.from("app_users").select("email,survey").eq("email", email);
if (ue) throw ue;
if (!users?.length) throw new Error("нет такой анкеты: " + email);
const survey = users[0].survey;

const now = new Date();
const age = (ch) => {
  const y = now.getFullYear() - ch.birthYear;
  const m = now.getMonth() + 1 - (ch.birthMonth ?? 1);
  return (y * 12 + m) / 12;
};
console.log("АНКЕТА:", email);
console.log("  регион:", survey.region, "| занятость:", survey.employmentStatus, "| беременна:", survey.pregnant);
console.log("  дети:", (survey.children ?? []).map((c) => `${age(c).toFixed(1)} лет`).join(", ") || "нет");
console.log("  доход (incomePm):", survey.incomePm ?? "—", "| многодетная:", survey.manyChildren ?? "—");

const matched = matchMeasures(survey, all);
console.log("\nВСЕГО ПОДОБРАНО:", matched.length, "\n");
for (const level of ["federal", "regional"]) {
  const list = matched.filter((m) => m.level === level);
  console.log(`── ${level === "federal" ? "ФЕДЕРАЛЬНЫЕ" : "РЕГИОНАЛЬНЫЕ"} (${list.length}) ──`);
  for (const m of list) {
    const ev = evaluateEligibility(survey, m);
    const mark = ev.pending.length ? ` [оформить: ${ev.pending.join(",")}]` : "";
    console.log(`  ${m.title}${mark}`);
    console.log(`      ${m.slug} · ${JSON.stringify(m.criteria)}`);
  }
  console.log();
}
