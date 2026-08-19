// Разметка пачки №13: меры, адресованные учащимся детям.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «На каждого ребёнка, который учится в школе, колледже или вузе, — до 23
  // лет. На дошкольников выплата не назначается».
  "volgograd-007": {
    regions: ["Волгоградская область"], minChildren: 3,
    childAgeFromMonths: 7 * 12, childAgeToMonths: 23 * 12,
  },
  // Пособие назначается самому студенту. Стояло requiresStudent — а это метка
  // «родители учатся очно», то есть студенческая семья. Здесь же учится
  // ребёнок, и нужна другая метка.
  "volgograd-008": {
    regions: ["Волгоградская область"], minChildren: 3,
    requiresChildStudying: true,
  },
  // «Участникам СВО и их детям до 23 лет компенсируют платное обучение СПО».
  "reg-kaliningradskaya-oblast-014": {
    regions: ["Калининградская область"], requiresSvoFamily: true,
    anyOf: [{ requiresChildStudying: true }, { requiresStudent: true }],
  },
  // «На детей 17–18 лет, а при очном обучении — до 23».
  "lnr-008": {
    regions: ["Луганская Народная Республика"], requiresChildren: true,
    requiresLowIncome: true,
    childAgeFromMonths: 17 * 12, childAgeToMonths: 23 * 12,
  },
  // «Многодетным семьям на каждого ребёнка, обучающегося по очной форме, до
  // 23 лет» — стояло «многодетные ИЛИ студенческая семья», из-за чего выплату
  // видела любая семья, где учатся родители.
  "perm-006": {
    regions: ["Пермский край"], minChildren: 3,
    childAgeFromMonths: 7 * 12, childAgeToMonths: 23 * 12,
  },
  // «Семьям, где оба родителя — инвалиды, либо одинокому родителю-инвалиду».
  // Стояла только неполная семья, а инвалидность родителя не проверялась.
  "krasn-006": {
    regions: ["Красноярский край"], requiresChildren: true,
    requiresDisabledParent: true, childAgeToMonths: 23 * 12,
  },
};

// Здесь «до 23 лет при очном обучении» — правило подсчёта состава семьи, а не
// условие меры. Движок уже считает многодетность по Указу № 63: дети до 18
// плюс дети до 23 на очном обучении.
const CHECKED = [
  "krd-002", "volgograd-009", "kbr-007", "ryaz-014", "sah-012",
  // Здесь «до 23 лет» — возраст матери, а не ребёнка.
  "sve-010",
];
writeFileSync("scripts/_studying-checked.json", JSON.stringify(CHECKED, null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch13.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch13.json");
