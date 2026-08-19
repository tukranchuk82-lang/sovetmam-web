// Сколько работы по разметке осталось — по пластам.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("slug,title,level,criteria,deadline,short_description,tips,how_to_apply").eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const text = (m) => [m.title, m.short_description, ...(m.tips ?? []), ...(m.how_to_apply ?? [])].join(" ");
const has = (m, key) => {
  const c = m.criteria ?? {};
  if (c[key] !== undefined) return true;
  return Array.isArray(c.anyOf) && c.anyOf.some((s) => s && s[key] !== undefined);
};
const pair = (name, re, key) => {
  const need = rows.filter((m) => re.test(text(m)));
  const done = need.filter((m) => has(m, key));
  console.log(`  ${name.padEnd(34)} упоминают ${String(need.length).padStart(4)} · метка стоит у ${String(done.length).padStart(3)} · ждут ${need.length - done.length}`);
};
console.log(`\nВСЕГО МЕР: ${rows.length}\n`);
console.log("НОВЫЕ МЕТКИ — сколько мер их ждёт:");
pair("нуждающиеся в жилье", /нуждающ|улучшени\w+ жилищн|аварийн\w+ жиль/i, "requiresHousingNeed");
pair("статус безработного", /безработн|центр\w* занятости|служб\w* занятости/i, "requiresUnemployedStatus");
pair("ребёнок 18–23 очно", /до 23 лет|очн\w+ форм\w+ обучени/i, "requiresChildStudying");
pair("село, малый город", /сельск\w+ местност|до 50 тысяч|посёлк|деревн/i, "requiresSettlement");
pair("декрет, отпуск по уходу", /в декрете|отпуск\w* по уходу/i, "requiresParentalLeave");
pair("муж на срочной службе", /по призыву|срочн\w+ служб/i, "requiresConscriptSpouse");
pair("трудная жизненная ситуация", /трудн\w+ жизненн\w+ ситуац|пожар|чрезвычайн/i, "requiresHardship");
pair("редкое заболевание", /орфанн|редк\w+ заболевани|Круг добра/i, "requiresRareDisease");
pair("ранний учёт по беременности", /до 12 недель|ранн\w+ срок/i, "requiresEarlyRegistration");
console.log("\nСРОКИ ПОДАЧИ:");
const dl = /в течение (\d+|шести|трёх) месяц|не позднее|до 31 декабря|с 1 июня|до 1 октября|сгора/i;
const needDl = rows.filter((m) => dl.test(text(m)));
console.log(`  срок назван в тексте: ${needDl.length} · поле заполнено у ${rows.filter((m) => m.deadline).length}`);
console.log("\nПОЛНОТА КАРТОЧЕК:");
const oneStep = rows.filter((m) => (m.how_to_apply ?? []).length === 1).length;
console.log(`  «как оформить» одной строкой: ${oneStep} (${Math.round((oneStep / rows.length) * 100)}%)`);
