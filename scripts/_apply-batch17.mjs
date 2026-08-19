// Разметка пачки №17 — завершение пласта по учащимся детям.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // Краевой материнский капитал стоял с условием «ребёнок-инвалид» — его
  // видели только семьи с инвалидностью. По тексту: третий ребёнок либо
  // первый у женщины до 23 лет.
  "krasn-001": {
    regions: ["Красноярский край"], requiresFamily: true,
    anyOf: [{ minChildren: 3 }, { maxParentAge: 23 }],
  },
  // Выплата по уходу за ребёнком-инвалидом: стояло «инвалидность ИЛИ приёмная
  // семья», и 17 790 ₽ видела любая приёмная семья без инвалидности.
  "msk-uhod-rebenok-invalid": {
    regions: ["Москва"], requiresDisabledChild: true,
    childAgeToMonths: 23 * 12,
  },
  // «Многодетным компенсируют обучение детей-студентов» — стояло
  // «многодетные ИЛИ студенческая семья».
  "komi-013": {
    regions: ["Республика Коми"], requiresChildren: true, minChildren: 3,
    requiresChildStudying: true,
  },
  // «На каждого ребёнка участника СВО» — стояло «семья СВО ИЛИ студенческая
  // семья», из-за чего выплату видели студенты без всякого отношения к СВО.
  "perm-003": {
    regions: ["Пермский край"], requiresChildren: true, requiresSvoFamily: true,
  },
  // Компенсация за детский сад: переводим возраст в месяцы.
  "kbr-005": {
    regions: ["Кабардино-Балкарская Республика"], requiresChildren: true,
    childAgeFromMonths: 18, childAgeToMonths: 7 * 12,
    anyOf: [{ minChildren: 3 }, { requiresLowIncome: true }],
  },
  // «Студенткам очной формы до 23 лет… если доход не превышает прожиточный
  // минимум» — ни возраста, ни дохода в условиях не было.
  "kostroma-022": {
    regions: ["Костромская область"], requiresFamily: true,
    requiresStudent: true, maxParentAge: 23, requiresLowIncome: true,
    childAgeToMonths: 36, appliesToExpecting: true,
  },
  // «Малоимущей семье по 2 000 ₽ на каждого ребёнка» — условия «есть дети» не
  // было, и пособие показывалось бездетным.
  "tyumen-004": {
    regions: ["Тюменская область"], requiresChildren: true,
    requiresLowIncome: true, childAgeToMonths: 23 * 12,
  },
};

const CHECKED = JSON.parse(readFileSync("scripts/_studying-checked.json", "utf8"));
CHECKED.push("saha-017", "msk-mnogodetnym-rost-zhizni", "zhku-mnogodetnym-kostroma",
  "chech-011", "chech-012", "zapor-008");
writeFileSync("scripts/_studying-checked.json", JSON.stringify([...new Set(CHECKED)], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch17.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
