// Меры, где упомянуто очное обучение ребёнка до 23 лет, но метки
// requiresChildStudying (или возрастного окна) нет.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,region,level,amount,short_description,criteria,how_to_apply,tips")
    .eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const re = /до 23 лет|очн\w+ форм\w+ обучени|обучающ\w+ по очной/i;
const has = (m) => {
  const c = m.criteria ?? {};
  const keys = ["requiresChildStudying", "childAgeToMonths", "childAgeFromMonths"];
  if (keys.some((k) => c[k] !== undefined)) return true;
  return Array.isArray(c.anyOf) && c.anyOf.some((x) => x && keys.some((k) => x[k] !== undefined));
};
let checked = [];
try { checked = JSON.parse(readFileSync("scripts/_studying-checked.json", "utf8")); } catch {}
const list = rows.filter((m) => !checked.includes(m.slug) && re.test([m.title, m.short_description, ...(m.tips ?? []), ...(m.how_to_apply ?? [])].join(" ")) && !has(m));
const from = Number(process.argv[2] ?? 0), to = Number(process.argv[3] ?? 12);
const slice = list.slice(from, to);
writeFileSync("scripts/_batch.txt", slice.map((m) => [
  `### ${m.slug}  [${m.region ?? "федеральная"}]`,
  `НАЗВАНИЕ: ${m.title}`,
  `СУММА: ${m.amount ?? "—"}`,
  `СУТЬ: ${m.short_description ?? "—"}`,
  `КАК ОФОРМИТЬ: ${(m.how_to_apply ?? []).join(" / ") || "—"}`,
  `ВАЖНО: ${(m.tips ?? []).join(" / ") || "—"}`,
  `СЕЙЧАС В УСЛОВИЯХ: ${JSON.stringify(m.criteria)}`,
].join("\n")).join("\n\n"), "utf8");
console.log(`всего ждут разбора: ${list.length}; выгружено ${slice.length}`);
