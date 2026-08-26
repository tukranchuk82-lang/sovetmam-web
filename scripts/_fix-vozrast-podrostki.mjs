// У мер для подростков стояла только нижняя граница возраста, а верхняя по
// умолчанию равна 18 годам. Из-за этого Пушкинская карта не выпадала семьям
// со студентом 19–22 лет, хотя действует до 23-летия, а образовательный
// кредит — семьям с абитуриентом старше 18.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const s = l.trim(); if (!s || s.startsWith("#") || !s.includes("=")) continue;
  const i = s.indexOf("="); env[s.slice(0, i)] = s.slice(i + 1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const PATCHES = {
  "pushkinskaya-karta": { criteria: { requiresFamily: true, hasChildAgedFrom: 14, hasChildAgedTo: 22 } },
  "obrazovatelnyy-kredit": { criteria: { requiresFamily: true, hasChildAgedFrom: 16, hasChildAgedTo: 23 } },
};

const slugs = Object.keys(PATCHES);
const { data: before } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
for (const m of before) {
  console.log(`${m.title}`);
  console.log(`  было:   ${JSON.stringify(m.criteria)}`);
  console.log(`  станет: ${JSON.stringify(PATCHES[m.slug].criteria)}`);
}
if (!APPLY) { console.log("\nСухой прогон. Для записи: --apply"); process.exit(0); }
writeFileSync("scripts/_backup-vozrast-podrostki.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (error) throw error;
  console.log("записано:", slug);
}
