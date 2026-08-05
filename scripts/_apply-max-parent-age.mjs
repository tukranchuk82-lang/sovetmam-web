// Возрастной ценз заявителя: меры «маме до 24/25/28 лет» и подобные.
//
// Раньше все они были размечены как «молодая семья» (до 35), поэтому мама 32
// лет видела выплату «женщинам до 25 лет». Теперь анкета знает точный возраст,
// и меру можно показывать ровно тем, кому она положена.
//
// Запуск: node scripts/_apply-max-parent-age.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

// slug → предельный возраст заявителя (включительно) и почему.
const LIMITS = {
  "sve-010": [23, "женщина, родившая первого ребёнка до 23 лет включительно"],
  "volgograd-002": [24, "женщина до 24 лет включительно"],
  "spb-008": [24, "женщины, родившие первого ребёнка в 19–24 года"],
  "chel-015": [24, "мать не старше 24 лет, очное обучение"],
  "vol-001": [25, "мама до 25 лет включительно"],
  "arh-005": [25, "мама 18–25 лет включительно"],
  "lenobl-015": [25, "оба родителя не старше 25 лет"],
  "tula-006": [25, "мамы до 25 лет"],
  "reg-altayskiy-kray-004": [27, "оба родителя до 27 лет"],
  "voronezh-003": [28, "матери на день рождения второго ребёнка нет 28 лет"],
  "tula-003": [28, "до 25 лет на второго ребёнка, до 28 — на третьего"],
  "spb-006": [30, "оба родителя — очники до 30 лет"],
};

const slugs = Object.keys(LIMITS);
const { data: cur, error } = await sb
  .from("measures")
  .select("slug,title,criteria")
  .in("slug", slugs);
if (error) throw new Error(error.message);

writeFileSync(
  "verification/backup-max-parent-age.json",
  JSON.stringify(cur, null, 1),
  "utf8",
);

let changes = 0,
  ok = 0,
  fail = 0;

for (const m of cur) {
  const [limit, why] = LIMITS[m.slug];
  const criteria = { ...(m.criteria ?? {}), maxParentAge: limit };

  console.log(`\n# ${m.slug} — ${m.title}`);
  console.log(`  ценз: до ${limit} лет (${why})`);
  console.log(`  было:  ${JSON.stringify(m.criteria)}`);
  console.log(`  стало: ${JSON.stringify(criteria)}`);
  changes++;

  if (APPLY) {
    const { error: e } = await sb.from("measures").update({ criteria }).eq("slug", m.slug);
    if (e) {
      console.log("  ОШИБКА:", e.message);
      fail++;
    } else ok++;
  }
}

const missing = slugs.filter((s) => !cur.some((m) => m.slug === s));
if (missing.length) console.log("\n!! не найдены в базе:", missing.join(", "));

console.log(
  `\n${APPLY ? "ЗАПИСАНО" : "СУХОЙ ПРОГОН"}: мер ${changes}` +
    (APPLY ? `, успешно ${ok}, ошибок ${fail}` : ""),
);
if (!APPLY) console.log("Для записи: node scripts/_apply-max-parent-age.mjs --apply");
