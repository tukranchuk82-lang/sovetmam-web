// Разметка пачки №8: жилищный учёт, порог дохода, круг получателей проката.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Женщинам, награждённым знаком, нуждающимся в улучшении жилья».
  "krasn-020": {
    regions: ["Красноярский край"], minChildren: 3, requiresHousingNeed: true,
  },
  // «Если среднедушевой доход не превышает двукратный прожиточный минимум» —
  // стояло условие «ниже одного ПМ», и семьи с доходом от одного до двух
  // прожиточных минимумов выплату 15 481 ₽ не видели.
  "stavropol-001": {
    regions: ["Ставропольский край"], minChildren: 3, maxIncomePm: 2,
    childAgeToMonths: 36,
  },
  // «Встать на учёт как молодая семья, нуждающаяся в жилье».
  "sve-009": {
    regions: ["Свердловская область"], requiresFamily: true,
    requiresParentUnder35: true, requiresHousingNeed: true,
  },
  // «Одному из членов семьи нужно состоять на учёте как нуждающийся в жилье»
  // — условие и для участка, и для выплаты взамен него.
  "chuv-029": {
    regions: ["Чувашская Республика"], minChildren: 3, requiresChildren: true,
    requiresHousingNeed: true,
  },
  // «Семья должна состоять на учёте как нуждающаяся в жилье».
  "bur-011": {
    regions: ["Республика Бурятия"], requiresChildren: true,
    requiresLowIncome: true, requiresHousingNeed: true,
  },
  // «Инвалидам и семьям с детьми-инвалидами, нуждающимся в улучшении
  // жилищных условий».
  "dagestan-011": {
    regions: ["Республика Дагестан"], requiresDisabledChild: true,
    requiresHousingNeed: true,
  },
  // «Для неполных, студенческих, многодетных, малообеспеченных семей, семей
  // с инвалидом и в трудной жизненной ситуации» — стояли только малоимущие.
  "spb-012": {
    regions: ["Санкт-Петербург"], requiresChildren: true, childAgeToMonths: 24,
    anyOf: [
      { requiresLowIncome: true },
      { minChildren: 3 },
      { requiresStudent: true },
      { requiresSingleParent: true },
      { requiresDisabledChild: true },
      { requiresHardship: true },
    ],
  },
  // «Стоящей на учёте как нуждающаяся в жилье», пять несовершеннолетних детей.
  "chuv-027": {
    regions: ["Чувашская Республика"], minChildren: 5, requiresChildren: true,
    requiresHousingNeed: true,
  },
};

// Проверено вручную — метку не ставим.
const CHECKED = JSON.parse(readFileSync("scripts/_housing-checked.json", "utf8"));
CHECKED.push(
  // Учёт на земельный участок ведётся отдельно от учёта нуждающихся в жилье:
  // семья с квартирой имеет право на участок и не должна его терять.
  "kemerovo-010",
  // Эта мера — про саму постановку на учёт. Требовать статус, который она и
  // помогает получить, было бы бессмыслицей.
  "uchyot-nuzhdayushchihsya-v-zhilye",
);
writeFileSync("scripts/_housing-checked.json", JSON.stringify([...new Set(CHECKED)], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch8.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch8.json");
