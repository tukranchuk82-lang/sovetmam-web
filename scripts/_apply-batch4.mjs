// Разметка пачки №4: студенческие семьи и возрастные границы у школьных мер.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Студенческим, многодетным, малоимущим, неполным семьям и семьям в
  // трудной ситуации» — в фильтре были только многодетные и малоимущие.
  "spb-011": {
    regions: ["Санкт-Петербург"], requiresChildren: true, childAgeToMonths: 36,
    anyOf: [
      { minChildren: 3 },
      { requiresLowIncome: true },
      { requiresStudent: true },
      { requiresSingleParent: true },
      { requiresHardship: true },
    ],
  },
  // «Студенческим, многодетным и иным семьям» — стояла жёсткая многодетность,
  // и студенческая семья с одним ребёнком няню не видела.
  "mari-002": {
    regions: ["Республика Марий Эл"], requiresChildren: true,
    childAgeToMonths: 36,
    anyOf: [{ minChildren: 3 }, { requiresStudent: true }],
  },
  "tomsk-019": {
    regions: ["Томская область"], requiresChildren: true, childAgeToMonths: 36,
    anyOf: [{ minChildren: 3 }, { requiresStudent: true }],
  },
  // «Родителям трёх и более детей, а также студентам очной формы до 23 лет».
  "krsk-004": {
    regions: ["Курская область"], requiresChildren: true,
    anyOf: [
      { minChildren: 3 },
      { requiresStudent: true },
      { requiresChildStudying: true },
    ],
  },
  // «Для многодетных, одиноких родителей и студенческих семей»; прокат — для
  // новорождённых, поэтому окно до года и показ будущим родителям.
  "rtadd-007": {
    regions: ["Республика Татарстан"], childAgeToMonths: 12,
    appliesToExpecting: true,
    anyOf: [
      { minChildren: 3 },
      { requiresSingleParent: true },
      { requiresStudent: true },
    ],
  },
  // Питание школьникам 1–11 классов и студентам колледжей: раньше мера
  // предлагалась семьям СВО с младенцами.
  "voronezh-015": {
    regions: ["Воронежская область"], requiresSvoFamily: true,
    childAgeFromMonths: 7 * 12, childAgeToMonths: 20 * 12,
  },
  // Питание 5–11 классам и студентам колледжей.
  "kemerovo-013": {
    regions: ["Кемеровская область — Кузбасс"], requiresSvoFamily: true,
    childAgeFromMonths: 10 * 12, childAgeToMonths: 20 * 12,
  },
  // Переводим старые возрастные метки в месяцы — единообразие с остальными.
  "voronezh-025": {
    regions: ["Воронежская область"],
    childAgeFromMonths: 7 * 12, childAgeToMonths: 23 * 12,
  },
};

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch4.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch4.json");
