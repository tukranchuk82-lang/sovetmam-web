// Доводка сделанных мер до шаблона: точные ссылки-источники и выверенные
// условия отбора. Проверено 24.08.2026.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const s = l.trim(); if (!s || s.startsWith("#") || !s.includes("=")) continue;
  const i = s.indexOf("="); env[s.slice(0, i)] = s.slice(i + 1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

const PATCHES = {
  // Была ссылка на главную РЖД — теперь раздел «Проезд детей» правил перевозок.
  "proezd-detey": {
    source_url: "https://www.rzd.ru/ru/9836/page/103290?id=12558",
    source_name: "РЖД, правила перевозок: проезд детей; статья 106 Воздушного кодекса РФ",
  },
  // Была главная Минздрава — теперь страница услуги на Госуслугах.
  "eko-po-oms": {
    source_url: "https://www.gosuslugi.ru/life/details/eko",
    source_name: "Госуслуги: ЭКО по ОМС; программа государственных гарантий бесплатной медицинской помощи",
  },
  // Была главная Минтруда — теперь линия помощи, куда звонят в первую очередь.
  "krizisnye-centry": {
    source_url: "https://ona.org.ru/help",
    source_name: "Всероссийский телефон доверия для женщин 8-800-700-06-00; региональные министерства социальной защиты",
  },
  // Была главная Госуслуг — теперь портал персонифицированного финансирования,
  // через который сертификат и оформляют.
  "sertifikat-dopolnitelnogo-obrazovaniya": {
    source_url: "https://pfdo.ru/",
    source_name: "Портал персонифицированного финансирования дополнительного образования",
    // Сертификат положен детям 5–18 лет: беременным и семьям с малышами эта
    // мера не нужна, а стояло просто «есть дети или беременность».
    criteria: { requiresChildren: true, hasChildAgedFrom: 5, hasChildAgedTo: 18 },
  },
};

const slugs = Object.keys(PATCHES);
const { data: before, error } = await sb
  .from("measures").select("slug,title,criteria,source_url,source_name").in("slug", slugs);
if (error) throw error;

for (const m of before) {
  const p = PATCHES[m.slug];
  console.log(`\n${m.title}`);
  console.log(`  источник: ${m.source_url}`);
  console.log(`         → ${p.source_url}`);
  if (p.criteria) console.log(`  условия: ${JSON.stringify(m.criteria)} → ${JSON.stringify(p.criteria)}`);
}

if (!APPLY) {
  console.log("\nСухой прогон. Для записи: --apply");
  process.exit(0);
}
writeFileSync("scripts/_backup-core-sources.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
  console.log("записано:", slug);
}
