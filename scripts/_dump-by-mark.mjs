// Универсальная выгрузка: меры, где в тексте есть признак, а метки нет.
// Запуск: node scripts/_dump-by-mark.mjs <ключ> <от> <до>
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const MARKS = {
  unemployed: { re: /безработн|центр\w* занятости|служб\w* занятости/i, key: "requiresUnemployedStatus" },
  hardship: { re: /трудн\w+ жизненн\w+ ситуац|пожар|чрезвычайн\w+ ситуац|наводнени/i, key: "requiresHardship" },
  leave: { re: /в декрете|отпуск\w* по уходу за ребёнком|отпуск\w* по уходу за ребенком/i, key: "requiresParentalLeave" },
  conscript: { re: /по призыву|срочн\w+ служб/i, key: "requiresConscriptSpouse" },
  village: { re: /сельск\w+ местност|сельск\w+ поселени|до 50 тысяч|деревн|посёлк/i, key: "requiresSettlement" },
  early: { re: /до 12 недель|ранн\w+ срок\w* беременност/i, key: "requiresEarlyRegistration" },
};
const mark = MARKS[process.argv[2]];
if (!mark) { console.error("ключи: " + Object.keys(MARKS).join(", ")); process.exit(1); }

const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,region,level,amount,short_description,criteria,how_to_apply,tips")
    .eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const has = (m) => {
  const c = m.criteria ?? {};
  if (c[mark.key] !== undefined) return true;
  return Array.isArray(c.anyOf) && c.anyOf.some((x) => x && x[mark.key] !== undefined);
};
let checked = [];
try { checked = JSON.parse(readFileSync(`scripts/_${process.argv[2]}-checked.json`, "utf8")); } catch {}
const list = rows.filter((m) => !checked.includes(m.slug) && !has(m) && mark.re.test([m.title, m.short_description, ...(m.tips ?? []), ...(m.how_to_apply ?? [])].join(" ")));
const slice = list.slice(Number(process.argv[3] ?? 0), Number(process.argv[4] ?? 12));
writeFileSync("scripts/_batch.txt", slice.map((m) => [
  `### ${m.slug}  [${m.region ?? "федеральная"}]`,
  `НАЗВАНИЕ: ${m.title}`,
  `СУТЬ: ${m.short_description ?? "—"}`,
  `ВАЖНО: ${(m.tips ?? []).join(" / ").slice(0, 400) || "—"}`,
  `СЕЙЧАС: ${JSON.stringify(m.criteria)}`,
].join("\n")).join("\n\n"), "utf8");
console.log(`«${process.argv[2]}»: ждут разбора ${list.length}, выгружено ${slice.length}`);
