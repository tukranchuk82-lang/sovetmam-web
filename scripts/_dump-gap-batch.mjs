// Выгружает пачку мер с расхождениями — с полным текстом, чтобы размечать
// сразу по всему набору меток, а не возвращаться к мере по второму разу.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const gaps = JSON.parse(readFileSync("scripts/_gaps.json", "utf8"));
const kind = process.argv[2];
const from = Number(process.argv[3] ?? 0);
const to = Number(process.argv[4] ?? 10);
const slugs = [...new Set(gaps.filter((g) => g.gap === kind).map((g) => g.slug))].slice(from, to);

const { data } = await sb.from("measures")
  .select("slug,title,region,level,amount,short_description,criteria,how_to_apply,tips,documents,source_name")
  .in("slug", slugs);

const out = data.map((m) => [
  `### ${m.slug}  [${m.region ?? "федеральная"}]`,
  `НАЗВАНИЕ: ${m.title}`,
  `СУММА: ${m.amount ?? "—"}`,
  `СУТЬ: ${m.short_description ?? "—"}`,
  `КАК ОФОРМИТЬ: ${(m.how_to_apply ?? []).join(" / ") || "—"}`,
  `ВАЖНО: ${(m.tips ?? []).join(" / ") || "—"}`,
  `ДОКУМЕНТЫ: ${(m.documents ?? []).join(", ") || "—"}`,
  `СЕЙЧАС В УСЛОВИЯХ: ${JSON.stringify(m.criteria)}`,
  `ИСТОЧНИК: ${m.source_name ?? "—"}`,
].join("\n")).join("\n\n");
writeFileSync("scripts/_batch.txt", out, "utf8");
console.log(`выгружено мер: ${data.length} → scripts/_batch.txt`);
