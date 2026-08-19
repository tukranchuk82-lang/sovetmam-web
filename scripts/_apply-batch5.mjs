// Разметка пачки №5: прокат детских вещей, присмотр, льготный проезд.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Прокат детских вещей устроен в регионах одинаково: студенческие и молодые
// семьи, одинокие родители, многодетные, семьи с детьми-инвалидами.
const RENT_GROUPS = [
  { requiresStudent: true },
  { requiresParentUnder35: true },
  { requiresSingleParent: true },
  { requiresLowIncome: true },
  { minChildren: 3 },
];

const CHANGES = {
  // «Школьники и студенты» — стояло условие «есть школьник», из-за чего семьи
  // со студентами льготу не видели.
  "kostroma-035": {
    regions: ["Костромская область"], requiresChildren: true,
    childAgeFromMonths: 7 * 12, childAgeToMonths: 23 * 12,
  },
  "ryaz-049": {
    regions: ["Рязанская область"], requiresChildren: true,
    childAgeFromMonths: 7 * 12, childAgeToMonths: 25 * 12,
  },
  // Выплаты студентам — детям участников СВО: вуз и колледж, а окно стояло
  // 15–18 лет, из-за чего студенты вузов выпадали.
  "chao-031": {
    regions: ["Чукотский автономный округ"], requiresChildren: true,
    requiresSvoFamily: true,
    childAgeFromMonths: 16 * 12, childAgeToMonths: 25 * 12,
  },
  // Присмотр за детьми — услуга для дошкольного возраста.
  "krg-015": {
    regions: ["Курганская область"], requiresChildren: true,
    childAgeToMonths: 7 * 12,
  },
  // Питание школьникам и студентам колледжей из семей участников СВО.
  "rtadd-016": {
    regions: ["Республика Татарстан"], requiresChildren: true,
    requiresSvoFamily: true,
    childAgeFromMonths: 7 * 12, childAgeToMonths: 20 * 12,
  },
  // Прокат вещей для малышей — три региона, один и тот же круг получателей.
  "mari-001": {
    regions: ["Республика Марий Эл"], requiresChildren: true,
    childAgeToMonths: 24, anyOf: RENT_GROUPS,
  },
  "yarosl-006": {
    regions: ["Ярославская область"], requiresChildren: true,
    childAgeToMonths: 24, anyOf: RENT_GROUPS,
  },
  "rst-016": {
    regions: ["Ростовская область"], requiresChildren: true,
    childAgeToMonths: 24,
    anyOf: [...RENT_GROUPS, { requiresDisabledChild: true }],
  },
};

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch5.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch5.json");
