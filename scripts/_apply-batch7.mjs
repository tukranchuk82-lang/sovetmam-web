// Разметка пачки №7 + список мер, проверенных и признанных ложными
// срабатываниями: чтобы не разбирать их снова в следующих подходах.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // Субсидия молодым семьям была помечена как мера для студентов — очередная
  // ошибка старого бэкофилла. По тексту: молодая семья, вставшая в очередь
  // как нуждающаяся в улучшении жилищных условий.
  "kirov-026": {
    regions: ["Кировская область"], requiresFamily: true,
    requiresParentUnder35: true, requiresHousingNeed: true,
  },
  // «Встать на учёт нуждающихся в жилье».
  "bsh-020": {
    regions: ["Республика Башкортостан"], minChildren: 3, requiresFamily: true,
    requiresHousingNeed: true,
  },
  // «Малоимущим семьям с детьми, нуждающимся в жилье… стоящих на учёте».
  "krym-008": {
    regions: ["Республика Крым"], requiresChildren: true,
    requiresLowIncome: true, requiresHousingNeed: true,
  },
  // Перевод старой возрастной метки в месяцы — для единообразия.
  "voronezh-021": {
    regions: ["Воронежская область"], minChildren: 3, requiresLowIncome: true,
    childAgeToMonths: 36,
  },
};

// Меры, где слово «нуждающиеся» относится не к жилью или где жилищное
// условие касается лишь одного варианта внутри меры. Проверены вручную —
// в следующих выгрузках не показываем.
const CHECKED_FALSE = [
  "obrazovatelnye-garantii-beremennym",
  "zhilyo-dlya-studencheskih-semey",
  "tuva-011",
  "volgograd-009",
  "klg-014",
  "krdadd-008",
  "vol-038",
  "reg-novosibirskaya-oblast-020",
  "voronezh-021",
];
writeFileSync("scripts/_housing-checked.json", JSON.stringify(CHECKED_FALSE, null, 1), "utf8");

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch7.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log(`\nпроверено и признано ложными: ${CHECKED_FALSE.length} мер (список сохранён)`);
