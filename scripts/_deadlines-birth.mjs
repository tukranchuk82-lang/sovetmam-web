// Сроки обращения после рождения ребёнка — предложения для «будильника».
//
// Печатает предложение целиком, в котором назван срок, и вытащенное число
// месяцев. Ничего не меняет: список читаю глазами, потом проставляю руками.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

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
    .select("slug,title,level,region,deadline,eligibility,short_description,tips,how_to_apply")
    .eq("is_published", true)
    .range(f, f + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}

const WORDS = {
  одного: 1, полутора: 18, двух: 2, трёх: 3, трех: 3, четырёх: 4, четырех: 4,
  пяти: 5, шести: 6, семи: 7, восьми: 8, девяти: 9, десяти: 10,
  одиннадцати: 11, двенадцати: 12, году: 12, года: 12, год: 12,
};

const ROZHDENIE = /(рождени|усыновлени)/i;
const SROK = /(не позднее|в течение|успеть|до достижения ребёнком)/i;

const out = [];
for (const m of rows) {
  if (m.deadline) continue;
  const text = [m.short_description, m.eligibility, (m.tips ?? []).join(" "), (m.how_to_apply ?? []).join(" ")]
    .filter(Boolean)
    .join(" ");
  // Режем на предложения и берём те, где рядом и срок, и рождение.
  const sentences = text.split(/(?<=[.;!?])\s+/).filter((s) => SROK.test(s) && ROZHDENIE.test(s));
  if (!sentences.length) continue;

  let months = null;
  for (const s of sentences) {
    const digits = s.match(/(\d{1,2})\s*(месяц\S*|лет|года?)/i);
    if (digits) {
      months = /месяц/i.test(digits[2]) ? Number(digits[1]) : Number(digits[1]) * 12;
      break;
    }
    const word = s.match(/(одного|полутора|двух|трёх|трех|четырёх|четырех|пяти|шести|семи|восьми|девяти|десяти|одиннадцати|двенадцати)\s*(месяц\S*|лет|года?)/i);
    if (word) {
      const n = WORDS[word[1].toLowerCase()];
      months = /месяц/i.test(word[2]) ? n : n * 12;
      break;
    }
    if (/в течение года|не позднее года|в течение одного года/i.test(s)) {
      months = 12;
      break;
    }
  }
  out.push({ slug: m.slug, title: m.title, level: m.level, region: m.region, months, sentences });
}

out.sort((a, b) => (a.months ?? 99) - (b.months ?? 99) || a.slug.localeCompare(b.slug));
for (const m of out) {
  console.log(`\n${m.slug} · ${m.title.replace(/ \([^)]+\)$/, "").slice(0, 64)} · ${m.level === "federal" ? "ФЕД" : m.region}`);
  console.log(`   срок: ${m.months ? m.months + " мес." : "не распознан"}`);
  for (const s of m.sentences.slice(0, 2)) console.log(`   «${s.replace(/\s+/g, " ").trim().slice(0, 150)}»`);
}
console.log(`\nвсего: ${out.length}; с распознанным сроком: ${out.filter((m) => m.months).length}`);
