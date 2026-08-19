// Разметка пачки №1 (расхождения «в тексте условие есть — в галочках нет»).
// Каждая правка обоснована текстом самой меры.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Детям в трудной жизненной ситуации, детям-инвалидам, детям из многодетных
  // малоимущих семей, отличникам и детям участников СВО» — классический anyOf.
  // Отличников проверить нельзя, и это честно написано в самой карточке.
  "smol-032": {
    regions: ["Смоленская область"], requiresChildren: true,
    childAgeFromMonths: 6 * 12, childAgeToMonths: 17 * 12,
    anyOf: [
      { requiresHardship: true },
      { requiresDisabledChild: true },
      { minChildren: 3, requiresLowIncome: true },
      { requiresSvoFamily: true },
    ],
  },
  // «Вставшим на учёт до 12 недель, при доходе не выше прожиточного минимума».
  "kirov-019": {
    regions: ["Кировская область"], requiresPregnancy: true,
    requiresEarlyRegistration: true, requiresLowIncome: true,
  },
  // «Многодетным семьям, нуждающимся в жилье» — статус нуждающихся.
  "tver-022": {
    regions: ["Тверская область"], minChildren: 3, requiresChildren: true,
    requiresHousingNeed: true,
  },
  // «Нуждающейся в улучшении жилищных условий, при рождении тройни».
  "udm-014": {
    regions: ["Удмуртская Республика"], minChildren: 3, requiresFamily: true,
    minSimultaneousBirth: 3, requiresHousingNeed: true,
  },
  // Мера не про студентов вовсе: выплата на первого ребёнка до года по доходу.
  // Галочка «студенты» прятала её от всех остальных.
  "kirov-002": {
    regions: ["Кировская область"], requiresChildren: true,
    childAgeToMonths: 12, requiresLowIncome: true,
  },
  // «Многодетным семьям, нуждающимся в улучшении жилищных условий».
  "oren-014": {
    regions: ["Оренбургская область"], minChildren: 3, requiresChildren: true,
    requiresHousingNeed: true,
  },
  // «Многодетным, малоимущим и пострадавшим от чрезвычайных ситуаций».
  "omsk-026": {
    regions: ["Омская область"], requiresChildren: true,
    anyOf: [
      { minChildren: 3 },
      { requiresLowIncome: true },
      { requiresHardship: true },
    ],
  },
};

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch1.json", JSON.stringify(before, null, 1), "utf8");

for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch1.json");
