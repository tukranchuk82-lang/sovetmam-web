// Разметка пачки №9.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Семьям, нуждающимся в улучшении жилищных условий».
  "oren-013": {
    regions: ["Оренбургская область"], requiresChildren: true,
    requiresMortgageIntent: true, requiresHousingNeed: true,
  },
  // «Семьям, признанным нуждающимися в улучшении жилищных условий (менее
  // 12 кв. м на человека)» — здесь учёт именно жилищный, в отличие от
  // кузбасского и ростовского участков, где ведётся отдельный учёт на землю.
  "hmao-018": {
    regions: ["Ханты-Мансийский автономный округ — Югра"], minChildren: 3,
    requiresHousingNeed: true,
  },
  // Господдержка молодым семьям была помечена как мера для студентов —
  // четвёртая такая ошибка за сегодня. По тексту: молодая семья в списке
  // участников как нуждающаяся в жилье.
  "chel-016": {
    regions: ["Челябинская область"], requiresFamily: true,
    requiresParentUnder35: true, requiresHousingNeed: true,
  },
  // «Молодым семьям, нуждающимся в улучшении жилищных условий».
  "rtadd-003": {
    regions: ["Республика Татарстан"], requiresFamily: true,
    requiresParentUnder35: true, requiresHousingNeed: true,
  },
  // «Выплата доводит доход семьи до прожиточного минимума» — значит она для
  // семей, чей доход ниже минимума; условия по доходу не было.
  "tat-009": {
    regions: ["Республика Татарстан"], requiresFamily: true,
    requiresDisabledChild: true, requiresLowIncome: true,
  },
};

const CHECKED = JSON.parse(readFileSync("scripts/_housing-checked.json", "utf8"));
CHECKED.push(
  // Размечены в прошлых пачках, слово «нуждающиеся» относится к доходу.
  "stavropol-001", "mari-001", "reg-kaliningradskaya-oblast-022", "spb-012",
  // Приём в программу закрыт, мера исключена из подбора.
  "bur-015",
  // Учёт на земельный участок, а не на жильё — как в Кузбассе.
  "rstadd-011",
  // «Нуждающиеся в гемодиализе» и «в постоянном уходе» — про лечение.
  "komi-018", "tat-009",
);
writeFileSync("scripts/_housing-checked.json", JSON.stringify([...new Set(CHECKED)], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch9.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch9.json");
