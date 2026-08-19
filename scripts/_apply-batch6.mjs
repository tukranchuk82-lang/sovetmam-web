// Разметка пачки №6: статус нуждающихся в жилье + разбор соседних ошибок.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Встать на учёт как молодая семья, нуждающаяся в жилье» — прямое условие.
  "bsh-019": {
    regions: ["Республика Башкортостан"], requiresFamily: true,
    requiresParentUnder35: true, requiresHousingNeed: true,
  },
  // «Встать на учёт как многодетная семья, нуждающаяся в улучшении жилья».
  "krasn-002": {
    regions: ["Красноярский край"], minChildren: 3, requiresHousingNeed: true,
  },
  // «Признать семью малоимущей и нуждающейся в жилом помещении».
  "bel-zhilyo-bezvozmezdnoe": {
    regions: ["Белгородская область"], minChildren: 3, requiresChildren: true,
    requiresLowIncome: true, requiresHousingNeed: true,
  },
  // «Для многодетных семей, нуждающихся в улучшении жилья».
  "dnr-011": {
    regions: ["Донецкая Народная Республика"], minChildren: 3,
    requiresChildren: true, requiresHousingNeed: true,
  },
  // Соцняня: «для студенческих, многодетных и иных нуждающихся семей» —
  // стояли только малоимущие, как было в Петербурге и Марий Эл.
  "reg-kaliningradskaya-oblast-022": {
    regions: ["Калининградская область"], requiresChildren: true,
    childAgeToMonths: 36,
    anyOf: [
      { requiresLowIncome: true },
      { minChildren: 3 },
      { requiresStudent: true },
      { requiresSingleParent: true },
    ],
  },
  // «Малоимущим многодетным семьям с пятью и более детьми, нуждающимся в
  // жилье» — все три условия обязательны, а стояло «или трое детей, или
  // низкий доход»: выплату видели семьи, которым она не положена.
  "tula-023": {
    regions: ["Тульская область"], requiresChildren: true, minChildren: 5,
    requiresLowIncome: true, requiresHousingNeed: true,
  },
  // «Семьям, воспитывающим троих и более детей-инвалидов» — нужны оба
  // условия сразу, а стояло «или трое детей, или низкий доход, или
  // инвалидность»: выплата 16 500 ₽ показывалась любой малоимущей семье.
  "reg-novosibirskaya-oblast-020": {
    regions: ["Новосибирская область"], requiresChildren: true,
    minChildren: 3, requiresDisabledChild: true,
  },
};

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch6.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch6.json");
