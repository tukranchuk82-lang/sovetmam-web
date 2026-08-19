// Разметка пачки №12 — завершение жилищного пласта.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const RENT_GROUPS = [
  { requiresStudent: true },
  { requiresParentUnder35: true },
  { requiresSingleParent: true },
  { requiresLowIncome: true },
  { minChildren: 3 },
];

const CHANGES = {
  // Прокат детских вещей: полный круг получателей, как в остальных регионах.
  "tomsk-020": {
    regions: ["Томская область"], requiresChildren: true,
    childAgeToMonths: 24, anyOf: RENT_GROUPS,
  },
  "kchr-011": {
    regions: ["Карачаево-Черкесская Республика"], requiresChildren: true,
    childAgeToMonths: 12, appliesToExpecting: true, anyOf: RENT_GROUPS,
  },
  // «Стоят на учёте нуждающихся в жилье» и «у семьи не должно быть жилья в
  // собственности» — первый случай, где нужны обе жилищные метки сразу.
  "chao-022": {
    regions: ["Чукотский автономный округ"], requiresChildren: true,
    requiresHousingNeed: true, requiresNoHome: true,
  },
  // «Молодой семье, признанной нуждающейся в жилье».
  "chuv-007": {
    regions: ["Чувашская Республика"], requiresFamily: true,
    requiresParentUnder35: true, requiresHousingNeed: true,
  },
  "chech-010": {
    regions: ["Чеченская Республика"], requiresFamily: true,
    requiresParentUnder35: true, requiresHousingNeed: true,
  },
  // «Обязательное условие — семья стоит на учёте как нуждающаяся в улучшении
  // жилищных условий. Доход семьи для этой меры не проверяют».
  "kostroma-027": {
    regions: ["Костромская область"], minChildren: 3, requiresChildren: true,
    requiresHousingNeed: true,
  },
  // Выплата до 4 млн ₽ за областную медаль — тоже только стоящим на учёте.
  "kostroma-032": {
    regions: ["Костромская область"], minChildren: 4, requiresChildren: true,
    requiresHousingNeed: true,
  },
};

const CHECKED = JSON.parse(readFileSync("scripts/_housing-checked.json", "utf8"));
CHECKED.push(
  "tomsk-021", "lpc-015", "ivn-034",
  // «Дети из нуждающихся семей» — про доход, не про жильё.
  "lpc-011",
  // «Нуждающимся членам семьи — соцобслуживание на дому» — про уход.
  "chech-018",
);
writeFileSync("scripts/_housing-checked.json", JSON.stringify([...new Set(CHECKED)], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch12.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch12.json");
