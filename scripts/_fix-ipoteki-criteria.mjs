// Условия отбора ипотек.
//
// Семейная выпадала любой семье с детьми, хотя положена только там, где есть
// ребёнок до шести лет, двое несовершеннолетних или ребёнок с инвалидностью.
//
// Дальневосточная и арктическая выпадала по всей стране, хотя жильё нужно
// покупать в регионах Дальнего Востока и Арктики.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const s = l.trim(); if (!s || s.startsWith("#") || !s.includes("=")) continue;
  const i = s.indexOf("="); env[s.slice(0, i)] = s.slice(i + 1);
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

// Дальний Восток целиком и регионы, куда входят арктические территории.
const DV_ARCTIC = [
  "Амурская область", "Еврейская автономная область", "Забайкальский край",
  "Камчатский край", "Магаданская область", "Приморский край",
  "Республика Бурятия", "Республика Саха (Якутия)", "Сахалинская область",
  "Хабаровский край", "Чукотский автономный округ",
  "Мурманская область", "Архангельская область", "Ненецкий автономный округ",
  "Ямало-Ненецкий автономный округ", "Красноярский край",
  "Республика Карелия", "Республика Коми",
];

const PATCHES = {
  "semeynaya-ipoteka": {
    criteria: {
      requiresMortgageIntent: true,
      requiresChildren: true,
      anyOf: [
        { maxYoungestChildAgeYears: 6 },
        { minChildren: 2 },
        { requiresDisabledChild: true },
      ],
    },
  },
  "dalnevostochnaya-arkticheskaya-ipoteka": {
    criteria: { requiresMortgageIntent: true, regions: DV_ARCTIC },
  },
};

const slugs = Object.keys(PATCHES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
for (const m of before) {
  console.log(`\n${m.title}`);
  console.log(`  было:   ${JSON.stringify(m.criteria)}`);
  console.log(`  станет: ${JSON.stringify(PATCHES[m.slug].criteria).slice(0, 150)}`);
}
if (!APPLY) { console.log("\nСухой прогон. Для записи: --apply"); process.exit(0); }
writeFileSync("scripts/_backup-ipoteki-criteria.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
  console.log("записано:", slug);
}
