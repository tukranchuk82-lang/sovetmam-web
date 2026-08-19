// Меры, где упомянута нуждаемость в жилье, но метки requiresHousingNeed нет.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,region,level,amount,short_description,criteria,how_to_apply,tips,documents")
    .eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const re = /нуждающ|улучшени\w+ жилищн|аварийн\w+ жиль/i;
const has = (m) => {
  const c = m.criteria ?? {};
  return c.requiresHousingNeed !== undefined ||
    (Array.isArray(c.anyOf) && c.anyOf.some((s) => s && s.requiresHousingNeed !== undefined));
};
const list = rows.filter((m) => re.test([m.title, m.short_description, ...(m.tips ?? []), ...(m.how_to_apply ?? [])].join(" ")) && !has(m));
const from = Number(process.argv[2] ?? 0), to = Number(process.argv[3] ?? 12);
const slice = list.slice(from, to);
const out = slice.map((m) => [
  `### ${m.slug}  [${m.region ?? "федеральная"}]`,
  `НАЗВАНИЕ: ${m.title}`,
  `СУММА: ${m.amount ?? "—"}`,
  `СУТЬ: ${m.short_description ?? "—"}`,
  `КАК ОФОРМИТЬ: ${(m.how_to_apply ?? []).join(" / ") || "—"}`,
  `ВАЖНО: ${(m.tips ?? []).join(" / ") || "—"}`,
  `СЕЙЧАС В УСЛОВИЯХ: ${JSON.stringify(m.criteria)}`,
].join("\n")).join("\n\n");
writeFileSync("scripts/_batch.txt", out, "utf8");
console.log(`всего ждут метки: ${list.length}; выгружено ${slice.length} (с ${from} по ${to})`);
