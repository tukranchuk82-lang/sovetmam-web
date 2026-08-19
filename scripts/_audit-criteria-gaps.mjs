// Аудит: в тексте меры условие названо, а в criteria его нет.
// Такие меры выпадают людям, которым не положены. Только чтение.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures")
    .select("slug,title,level,region,short_description,criteria")
    .eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}

const has = (c, ...keys) => keys.some((k) => c[k] !== undefined);
const anyOfHas = (c, key) => Array.isArray(c.anyOf) && c.anyOf.some((v) => v && v[key] !== undefined);

const RULES = [
  { id: "многодетным", re: /многодетн/i,
    ok: (c) => (c.minChildren ?? 0) >= 3 || anyOfHas(c, "minChildren") },
  { id: "двум и более детям", re: /дв(ух|умя|ое|а) и более|второго и последующ|2 и более дет/i,
    ok: (c) => (c.minChildren ?? 0) >= 2 || anyOfHas(c, "minChildren") },
  { id: "малоимущим", re: /малоимущ|малообеспеч|нуждающ|низк\w* доход|ниже прожиточного|среднедушев/i,
    ok: (c) => has(c, "requiresLowIncome", "maxIncomePm") || anyOfHas(c, "requiresLowIncome") || anyOfHas(c, "maxIncomePm") },
  { id: "ребёнку-инвалиду", re: /ребён\w*-инвалид|ребен\w*-инвалид|дет(ей|ям|и)-инвалид|инвалидность\w* ребён/i,
    ok: (c) => has(c, "requiresDisabledChild", "requiresSpecialNeedsChild") || anyOfHas(c, "requiresDisabledChild") },
  { id: "семьям СВО", re: /\bСВО\b|специальной военной операц|мобилизованн|доброволь(ц|ч)/i,
    ok: (c) => has(c, "requiresSvoFamily") || anyOfHas(c, "requiresSvoFamily") },
  { id: "одиноким родителям", re: /одинок\w+ (мат|отц|родител)|единственн\w+ родител|неполн\w+ семь/i,
    ok: (c) => has(c, "requiresSingleParent") || anyOfHas(c, "requiresSingleParent") },
  { id: "студентам", re: /студенч|студент/i,
    ok: (c) => has(c, "requiresStudent") || anyOfHas(c, "requiresStudent") },
  { id: "приёмным семьям", re: /приёмн\w+ семь|приемн\w+ семь|опекун|попечител|усыновител/i,
    ok: (c) => has(c, "requiresFosterParent") || anyOfHas(c, "requiresFosterParent") },
  { id: "при потере кормильца", re: /потер\w+ кормильца|погибш\w+ родител/i,
    ok: (c) => has(c, "requiresLossOfBreadwinner") || anyOfHas(c, "requiresLossOfBreadwinner") },
  { id: "плательщикам НДФЛ", re: /налогов\w+ вычет|вернуть НДФЛ|возврат НДФЛ/i,
    ok: (c) => has(c, "requiresNdfl") },
  { id: "молодым семьям", re: /молод\w+ семь|до 35 лет/i,
    ok: (c) => has(c, "maxParentAge") || anyOfHas(c, "maxParentAge") },
  { id: "беременным", re: /беременн/i,
    ok: (c) => has(c, "requiresPregnancy") || anyOfHas(c, "requiresPregnancy") },
];

const found = [];
for (const m of rows) {
  const text = `${m.title} ${m.short_description ?? ""}`;
  const c = m.criteria ?? {};
  for (const r of RULES) {
    if (r.re.test(text) && !r.ok(c)) found.push({ ...m, gap: r.id });
  }
}

const byGap = {};
for (const f of found) (byGap[f.gap] ??= []).push(f);
console.log(`Проверено ${rows.length} мер. Расхождений: ${found.length} (мер: ${new Set(found.map((f) => f.slug)).size})\n`);
console.log("ПО ТИПАМ УСЛОВИЙ (в тексте есть — в галочках нет):");
for (const [gap, list] of Object.entries(byGap).sort((a, b) => b[1].length - a[1].length)) {
  const fed = list.filter((m) => m.level === "federal").length;
  console.log(`  ${String(list.length).padStart(4)}  ${gap}${fed ? `  (из них федеральных: ${fed})` : ""}`);
}
writeFileSync("scripts/_gaps.json", JSON.stringify(found, null, 1), "utf8");
console.log("\nПодробности: scripts/_gaps.json");
console.log("\nФЕДЕРАЛЬНЫЕ (их видит каждый) — все:");
for (const f of found.filter((x) => x.level === "federal")) console.log(`  [${f.gap}] ${f.slug} — ${f.title.slice(0, 62)}`);
