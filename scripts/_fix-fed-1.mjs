// Федеральные меры, партия 1: явные ошибки отбора.
//
// Каждая правка — из текста карточки, а не из заголовка. Что нашла:
//   kreditnye-kanikuly-spisanie-svo — стояло «родитель с инвалидностью»
//     вместо семьи участника СВО: мера уходила совсем не тем;
//   lgotnyy-avtokredit — «есть семья»; в тексте: двое несовершеннолетних
//     детей, либо медик, педагог, человек с инвалидностью, участник СВО;
//   materinskiy-kapital и остаток — «есть семья»; в тексте: первый ребёнок
//     с 2020 года, второй и последующие с 2007-го, то есть ребёнку не
//     больше 19 лет, либо женщина ждёт ребёнка;
//   proezd-detey — «есть семья»; льготы кончаются в 18 лет;
//   стипендии и академический отпуск — только родителю-студенту, хотя
//     касаются и семьи, где студент — ребёнок (недобор, а не мусор);
//   transport-invalidam — противоречивая пара условий, оставила anyOf;
//   eko-po-oms — показывалась всем подряд: анкета не спрашивает про
//     бесплодие, подтвердить нечем. По утверждённому правилу убираем из
//     подбора, в каталоге и в разделе «Планируем ребёнка» остаётся;
//   nalogovyy-vychet-lechenie — вычет за любое лечение, а название говорило
//     про беременность; переименовала, условия не трогала.
//
// Запуск: node scripts/_fix-fed-1.mjs [--apply]
import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1)]; }));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const APPLY = process.argv.includes("--apply");

const STUDENT_OR_CHILD = {
  anyOf: [{ requiresStudent: true }, { requiresChildStudying: true }],
};

const PATCHES = {
  "kreditnye-kanikuly-spisanie-svo": { criteria: { requiresSvoFamily: true } },

  "lgotnyy-avtokredit": {
    criteria: {
      anyOf: [
        { minChildrenUnder18: 2 },
        { requiresWorkField: ["medicine", "education"] },
        { requiresDisabledParent: true },
        { requiresSvoFamily: true },
      ],
    },
  },

  "materinskiy-kapital": {
    criteria: {
      requiresFamily: true,
      anyOf: [{ requiresPregnancy: true }, { hasChildAgedTo: 19 }],
    },
  },
  "ostatok-materinskogo-kapitala": {
    criteria: {
      requiresFamily: true,
      anyOf: [{ requiresPregnancy: true }, { hasChildAgedTo: 19 }],
    },
  },

  "proezd-detey": { criteria: { requiresChildren: true, hasChildAgedTo: 18 } },

  "stipendii-gosudarstvennye": { criteria: STUDENT_OR_CHILD },
  "stipendii-prezidentskie-imennye": { criteria: STUDENT_OR_CHILD },
  "akademicheskiy-otpusk": { criteria: STUDENT_OR_CHILD },
  "vyplaty-studencheskim-semyam-ot-vuza": { criteria: STUDENT_OR_CHILD },

  "transport-invalidam": {
    criteria: {
      anyOf: [{ requiresDisabledChild: true }, { requiresDisabledParent: true }],
    },
  },

  "eko-po-oms": { criteria: { excludeFromMatching: true } },

  "nalogovyy-vychet-lechenie": {
    title: "Налоговый вычет за лечение и лекарства",
  },
};

const slugs = Object.keys(PATCHES);
const { data: before, error } = await sb.from("measures").select("slug,title,criteria").in("slug", slugs);
if (error) throw error;
if (before.length !== slugs.length) {
  const found = before.map((m) => m.slug);
  throw new Error("не нашлись: " + slugs.filter((s) => !found.includes(s)).join(", "));
}
for (const m of before) {
  const p = PATCHES[m.slug];
  console.log(m.title);
  if (p.criteria) {
    console.log("   было: " + JSON.stringify(m.criteria));
    console.log("  стало: " + JSON.stringify(p.criteria));
  }
  if (p.title) console.log("  название → " + p.title);
}
if (!APPLY) { console.log("\nСухой прогон. Для записи: --apply"); process.exit(0); }
writeFileSync("scripts/_backup-fed-1.json", JSON.stringify(before, null, 1), "utf8");
for (const slug of slugs) {
  const { error: e } = await sb.from("measures").update(PATCHES[slug]).eq("slug", slug);
  if (e) throw new Error(`${slug}: ${e.message}`);
}
console.log("\nзаписано:", slugs.length);
