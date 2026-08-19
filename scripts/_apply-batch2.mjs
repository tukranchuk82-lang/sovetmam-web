// Разметка пачки №2. Правим только те меры, где многодетность (или другая
// категория) — именно условие, а не повышающий коэффициент к сумме.
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const CHANGES = {
  // «Положена льготным категориям — в том числе семьям с детьми-инвалидами и
  // многодетным». Стояла только инвалидность, многодетные меру не видели.
  "volgograd-011": {
    regions: ["Волгоградская область"],
    anyOf: [{ requiresDisabledChild: true }, { minChildren: 3 }],
  },
  // «На каждого ребёнка до 16 лет, а при очном обучении — до 18». Условие по
  // доходу верное, не хватало возрастной границы.
  "volgograd-004": {
    regions: ["Волгоградская область"], requiresLowIncome: true,
    childAgeToMonths: 18 * 12,
  },
  // «Дети до 3 лет — всем; дети из многодетных семей — до 6 лет».
  "spb-030": {
    regions: ["Санкт-Петербург"], requiresChildren: true,
    anyOf: [
      { childAgeToMonths: 36 },
      { minChildren: 3, childAgeToMonths: 72 },
    ],
  },
  // «Детям из малоимущих и многодетных семей, детям-инвалидам и с ОВЗ,
  // подопечным детям» — стояло только «есть дети», мера летела всем.
  "yarosl-004": {
    regions: ["Ярославская область"], requiresChildren: true,
    childAgeFromMonths: 7 * 12, childAgeToMonths: 18 * 12,
    anyOf: [
      { requiresLowIncome: true },
      { minChildren: 3 },
      { requiresDisabledChild: true },
      { requiresSpecialNeedsChild: true },
      { requiresFosterParent: true },
    ],
  },
};

const slugs = Object.keys(CHANGES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
writeFileSync("scripts/_backup-batch2.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update({ criteria: CHANGES[slug] }).eq("slug", slug);
  console.log(e ? `ошибка ${slug}: ${e.message}` : `✔ ${slug}`);
}
console.log("\nбэкап: scripts/_backup-batch2.json");
