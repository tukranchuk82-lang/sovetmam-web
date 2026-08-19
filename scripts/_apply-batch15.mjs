// Разметка пачки №15.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Восемь и более детей» — стояло три, и выплату 622 800 ₽ видели семьи с
  // тремя детьми.
  "bsh-004": {
    regions: ["Республика Башкортостан"], minChildren: 8, requiresFamily: true,
  },
  // Комплекс мер семьям участников СВО — метки СВО в условиях не было вовсе,
  // зато стояла метка «родители учатся очно».
  "komi-032": {
    regions: ["Республика Коми"], requiresChildren: true,
    requiresSvoFamily: true,
    childAgeFromMonths: 3 * 12, childAgeToMonths: 23 * 12,
  },
  // Выплата студентам из многодетных семей: учится ребёнок, а не родители.
  "ryaz-021": {
    regions: ["Рязанская область"], minChildren: 3, requiresChildren: true,
    requiresLowIncome: true, maxIncomePm: 1, requiresChildStudying: true,
  },
  // Компенсация платного обучения ребёнка до 23 лет.
  "reg-kaliningradskaya-oblast-004": {
    regions: ["Калининградская область"], minChildren: 3,
    requiresChildren: true, requiresChildStudying: true,
  },
  // Пенсия платится ребёнку до 18 лет, при очной учёбе — до 23.
  "pensiya-po-potere-kormilca": {
    requiresFamily: true, requiresLossOfBreadwinner: true,
    childAgeToMonths: 23 * 12,
  },
};

const CHECKED = JSON.parse(readFileSync("scripts/_studying-checked.json", "utf8"));
CHECKED.push(
  "sah-033", "zhku-mnogodetnym-tatarstan", "zhku-mnogodetnym-saratov",
  "psk-019", "ryaz-044", "ryaz-029", "ryaz-048",
);
writeFileSync("scripts/_studying-checked.json", JSON.stringify([...new Set(CHECKED)], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch15.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
