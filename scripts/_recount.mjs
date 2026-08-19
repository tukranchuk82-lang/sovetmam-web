import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb.from("measures").select("title,short_description,tips,how_to_apply").eq("is_published", true).range(f, f + 999);
  if (error) throw error;
  rows.push(...data); if (data.length < 1000) break;
}
const T = (m) => [m.title, m.short_description, ...(m.tips ?? []), ...(m.how_to_apply ?? [])].join(" ");
const NB = "(?<![А-Яа-яЁёA-Za-z])", NA = "(?![А-Яа-яЁёA-Za-z])";
const pairs = [
  ["семья участника СВО", new RegExp(NB + "СВО" + NA + "|специальн\w+ военн\w+ операц|мобилизованн|доброволь(ц|ч)", "i")],
  ["ОВЗ / особые потребности", new RegExp(NB + "ОВЗ" + NA + "|ограниченн\w+ возможност|особ\w+ образовательн", "i")],
  ["ИП / предприниматель", new RegExp(NB + "ИП" + NA + "|индивидуальн\w+ предпринимател|предпринимательск", "i")],
  ["одинокий / единственный родитель", /одинок|единственн\w+ родител|неполн\w+ семь|мать-одиночк/i],
  ["гражданство РФ", /гражданств|гражданин\w* Российск|гражданин\w* РФ/i],
  ["ценз оседлости (прожить N лет)", /прожива\w+ (не менее|более|от)\s*\d|ценз\w* оседлост|постоянн\w+ проживани|мест\w+ жительств\w+ не менее/i],
  ["имущественный ценз / нулевой доход", /имуществен\w+ (ценз|обеспеченност)|нулев\w+ доход|комплексн\w+ оценк/i],
  ["работник культуры", /работник\w* культуры|сфер\w+ культуры|учреждени\w+ культуры/i],
  ["трудная жизненная ситуация", new RegExp("трудн\w+ жизненн\w+ ситуац|" + NB + "ТЖС" + NA + "|чрезвычайн\w+ ситуац", "i")],
];
for (const [name, re] of pairs) console.log(`${name.padEnd(34)} ${String(rows.filter((m) => re.test(T(m))).length).padStart(5)}`);
