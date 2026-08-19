// Разметка пачки №11.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Малоимущей семье, признанной нуждающейся в жилье».
  "socnaym-maloimushchim": {
    criteria: { requiresLowIncome: true, requiresHousingNeed: true },
  },
  // «Семьям с тремя и более детьми, нуждающимся в улучшении жилищных условий».
  "rtadd-002": {
    criteria: {
      regions: ["Республика Татарстан"], minChildren: 3,
      requiresHousingNeed: true,
    },
  },
  // «Право есть только у тех, кто встал на жилищный учёт до 1 января 2005».
  "zapor-009": {
    criteria: {
      regions: ["Запорожская область"], requiresChildren: true,
      requiresDisabledChild: true, requiresHousingNeed: true,
    },
  },
  // «Семьям с четырьмя и более детьми, нуждающимся в улучшении жилищных
  // условий» — стояло три ребёнка и не было нуждаемости.
  "mgd-017": {
    criteria: {
      regions: ["Магаданская область"], minChildren: 4, requiresChildren: true,
      requiresHousingNeed: true,
    },
  },
  // «Семья должна стоять на учёте как нуждающаяся в жилье»; обратиться нужно,
  // пока ребёнку не исполнилось полтора года — самое частое основание отказа.
  "kostroma-019": {
    criteria: {
      regions: ["Костромская область"], minChildren: 3, requiresChildren: true,
      requiresMortgageIntent: true, requiresHousingNeed: true,
      childAgeToMonths: 18,
    },
    deadline: { kind: "after-birth", months: 18 },
  },
  // «Беременным, нуждающимся в социальной поддержке, и беременным супругам
  // участников СВО» — стояло «малоимущие ИЛИ беременность», из-за чего путёвку
  // видела любая беременная женщина области.
  "lpc-015": {
    criteria: {
      regions: ["Липецкая область"], requiresPregnancy: true,
      anyOf: [{ requiresLowIncome: true }, { requiresSvoFamily: true }],
    },
  },
  // «Супругам участников СВО — присмотр за детьми до 7 лет» — стояло условие
  // по доходу, из-за чего мера доставалась не тем, кому адресована.
  "ivn-034": {
    criteria: {
      regions: ["Ивановская область"], requiresChildren: true,
      requiresSvoFamily: true, childAgeToMonths: 7 * 12,
    },
  },
  // «Детям, нуждающимся в санаторном лечении, детям в трудной жизненной
  // ситуации и детям участников СВО».
  "tomsk-021": {
    criteria: {
      regions: ["Томская область"], requiresChildren: true,
      anyOf: [
        { requiresLowIncome: true },
        { requiresHardship: true },
        { requiresSvoFamily: true },
        { requiresDisabledChild: true },
      ],
    },
  },
};

const CHECKED = JSON.parse(readFileSync("scripts/_housing-checked.json", "utf8"));
CHECKED.push(
  "reg-kaliningradskaya-oblast-021", "prokat-detskih-tovarov",
  // Списки детей-сирот на жильё ведутся отдельно от общего учёта нуждающихся.
  "chel-021",
  // «Нуждающимся в санаторно-курортном лечении» — про лечение, не про жильё.
  "mari-013",
);
writeFileSync("scripts/_housing-checked.json", JSON.stringify([...new Set(CHECKED)], null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria,deadline").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch11.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(CHANGES[slug]).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch11.json");
