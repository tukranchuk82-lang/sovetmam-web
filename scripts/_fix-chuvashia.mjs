// Чувашия, 37 мер: вычитка условий отбора по тексту карточек.
//
// Что нашла:
//   chuv-010 первоочередной приём в детсад — стояло «есть дети», а в тексте
//     перечислены категории: многодетные, семьи СВО, дети с инвалидностью,
//     дети сотрудников силовых структур. Плюс возраст: сад — до семи лет;
//   chuv-015 трудоустройство подростков — «есть дети» при том, что работа
//     для 14–18 лет;
//   chuv-002 возмещение проезда в санаторий — в тексте «детям до 18 лет»,
//     возрастной границы не было;
//   chuv-009 подарок новорождённому — не показывался тем, кто ждёт ребёнка,
//     хотя узнать про него лучше заранее;
//   chuv-038 сельская ипотека — в тексте «работающим в сельской местности»,
//     в условиях села не было.
//
// Остальные 32 меры условиям соответствуют — сверила каждую с текстом.
//
// Запуск: node scripts/_fix-chuvashia.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");
const R = ["Чувашская Республика"];

const PATCHES = {
  "chuv-010": {
    criteria: {
      regions: R,
      requiresChildren: true,
      hasChildAgedTo: 7,
      anyOf: [
        { minChildren: 3 },
        { requiresSvoFamily: true },
        { requiresDisabledChild: true },
      ],
    },
  },
  "chuv-015": {
    criteria: {
      regions: R,
      requiresChildren: true,
      hasChildAgedFrom: 14,
      hasChildAgedTo: 18,
    },
  },
  "chuv-002": {
    criteria: {
      regions: R,
      requiresChildren: true,
      requiresLowIncome: true,
      hasChildAgedTo: 18,
    },
  },
  "chuv-009": {
    criteria: {
      regions: R,
      requiresFamily: true,
      maxYoungestChildAgeYears: 1,
      appliesToExpecting: true,
    },
  },
  "chuv-038": {
    criteria: {
      regions: R,
      minChildren: 3,
      requiresChildren: true,
      requiresMortgageIntent: true,
      requiresSettlement: ["village"],
    },
  },
};

const slugs = Object.keys(PATCHES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
if (before.length !== slugs.length) throw new Error("не все меры найдены");
for (const m of before) {
  console.log(m.title);
  console.log("   было: " + JSON.stringify(m.criteria));
  console.log("  стало: " + JSON.stringify(PATCHES[m.slug].criteria));
}
if (!APPLY) { console.log("\nСухой прогон. Для записи: --apply"); process.exit(0); }
writeFileSync("scripts/_backup-chuvashia.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
