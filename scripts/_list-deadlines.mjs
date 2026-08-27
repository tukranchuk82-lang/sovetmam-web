// Меры, у которых срок обращения назван в тексте, а машинно не проставлен.
//
// Из-за этого «будильник» — плашка «скоро истечёт срок действия» в подборке —
// почти не показывается: сроков в базе всего девять.
//
// Скрипт вытаскивает саму фразу про срок, чтобы её можно было прочитать и
// проставить срок руками. Ничего не меняет.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const rows = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await sb
    .from("measures")
    .select("slug,title,level,region,deadline,eligibility,short_description,tips,how_to_apply,criteria")
    .eq("is_published", true)
    .range(f, f + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}

// Предложения (фразы), в которых говорится о сроке.
const SROK =
  /(в течение\s+\S+\s+(?:месяц\S*|лет|года|дней|дня)|не позднее[^.;]{0,80}|до достижения ребёнком[^.;]{0,60}|со дня рождения[^.;]{0,60}|срок обращения[^.;]{0,80}|подать[^.;]{0,40}до[^.;]{0,40}|успеть[^.;]{0,60}|до\s+\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)[^.;]{0,40}|до\s+\d{1,2}\s+недель[^.;]{0,40})/gi;

const out = [];
for (const m of rows) {
  if (m.deadline) continue;
  const text = [m.short_description, m.eligibility, (m.tips ?? []).join(" "), (m.how_to_apply ?? []).join(" ")]
    .filter(Boolean)
    .join(" ");
  const hits = [...new Set((text.match(SROK) ?? []).map((s) => s.replace(/\s+/g, " ").trim()))];
  if (hits.length) out.push({ ...m, hits });
}

out.sort((a, b) => (a.level === b.level ? (a.region ?? "").localeCompare(b.region ?? "") : a.level === "federal" ? -1 : 1));
let group = null;
for (const m of out) {
  const g = m.level === "federal" ? "ФЕДЕРАЛЬНЫЕ" : m.region;
  if (g !== group) {
    group = g;
    console.log(`\n═══ ${group}`);
  }
  console.log(`${m.slug} · ${m.title.replace(/ \([^)]+\)$/, "").slice(0, 66)}`);
  for (const h of m.hits.slice(0, 3)) console.log(`     «${h.slice(0, 110)}»`);
}
writeFileSync(
  "scripts/_deadlines-todo.json",
  JSON.stringify(out.map(({ slug, title, level, region, hits }) => ({ slug, title, level, region, hits })), null, 1),
  "utf8",
);
console.log(`\nвсего мер со сроком в тексте: ${out.length}`);
