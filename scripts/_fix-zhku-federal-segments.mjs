// Догонка к _fix-zhku-federal.mjs.
//
// 1) У переписанной субсидии в segments остался svo-family — из критериев СВО
//    убрали, значит и из раздела «Семьи участников СВО» карточка уходить должна,
//    иначе мера снова начнёт выдаваться не тем.
// 2) Новую меру ВБД приводим к конвенции соседей по кластеру ЖКУ
//    (kompensaciya-zhku-semyi-pogibshih и др.): категория «Налоги и льготы»,
//    теги topic-*/class-*.
//
// Запуск: node scripts/_fix-zhku-federal-segments.mjs          (сухой прогон)
//         node scripts/_fix-zhku-federal-segments.mjs --apply   (запись)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

const { data: rows, error } = await sb
  .from("measures")
  .select("slug,title,category,segments")
  .in("slug", ["subsidiya-zhku-maloimushchim-svo", "kompensaciya-zhku-vbd-svo"]);
if (error) throw error;

const cur = Object.fromEntries(rows.map((m) => [m.slug, m]));

const edits = {
  // Убираем только svo-family, остальные теги не трогаем.
  "subsidiya-zhku-maloimushchim-svo": {
    segments: cur["subsidiya-zhku-maloimushchim-svo"].segments.filter(
      (s) => s !== "svo-family",
    ),
  },
  // По образцу kompensaciya-zhku-semyi-pogibshih — ближайшего аналога.
  "kompensaciya-zhku-vbd-svo": {
    category: "Налоги и льготы",
    segments: [
      "svo-family",
      "topic-money",
      "topic-housing",
      "topic-utilities",
      "class-discount",
      "class-situational",
    ],
  },
};

for (const [slug, edit] of Object.entries(edits)) {
  console.log(`\n=== ${slug} ===`);
  for (const [k, v] of Object.entries(edit)) {
    console.log(`  ${k}:`);
    console.log(`    было:  ${JSON.stringify(cur[slug][k])}`);
    console.log(`    стало: ${JSON.stringify(v)}`);
  }
}

if (!APPLY) {
  console.log("\n\nСУХОЙ ПРОГОН. Записи не было. Для применения: --apply");
} else {
  for (const [slug, edit] of Object.entries(edits)) {
    const { error: e } = await sb.from("measures").update(edit).eq("slug", slug);
    if (e) throw e;
    console.log(`\n✓ ${slug} обновлена`);
  }
}
