// Сколько мер человек РЕАЛЬНО видит в плитке «Семья с N детьми».
//
// В разделе работает фильтр: федеральные меры плюс меры выбранного региона.
// Поэтому общее число по базе ничего не говорит о том, что видно на экране.
//
// Запуск: node scripts/_audit-family-tiles.mjs

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(ROOT, ".env.local") });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const PAGE = 1000;
const all = [];
for (let from = 0; ; from += PAGE) {
  const { data, error } = await sb
    .from("measures")
    .select("slug,title,level,region,segments,criteria")
    .eq("is_published", true)
    .order("slug")
    .range(from, from + PAGE - 1);
  if (error) throw error;
  all.push(...data);
  if (data.length < PAGE) break;
}

const REGIONS_TO_CHECK = [
  "Москва",
  "Московская область",
  "Республика Адыгея",
  "Костромская область",
];

// Правило плитки: мера подходит семье с N детьми, если требует не больше N.
const fits = (m, n) => (m.criteria?.minChildren ?? 1) <= n;
const forRegion = (m, r) =>
  m.region === r || (m.criteria?.regions ?? []).includes(r);

console.log("Что видно в плитке «Семья с N детьми» (федеральные + свой регион):\n");
console.log(
  "N".padEnd(6),
  "всего в базе".padEnd(14),
  "федеральных".padEnd(13),
  REGIONS_TO_CHECK.map((r) => r.slice(0, 12).padEnd(14)).join(""),
);

for (const n of [1, 2, 3, 4, 5]) {
  const fit = all.filter((m) => fits(m, n));
  const fed = fit.filter((m) => m.level === "federal").length;
  const byRegion = REGIONS_TO_CHECK.map((r) => {
    const reg = fit.filter((m) => m.level === "regional" && forRegion(m, r)).length;
    return String(fed + reg).padEnd(14);
  });
  console.log(
    String(n).padEnd(6),
    String(fit.length).padEnd(14),
    String(fed).padEnd(13),
    byRegion.join(""),
  );
}

// Сколько из видимого — меры, где число детей вообще является условием.
console.log("\nИз них меры, где число детей — условие (minChildren ≥ 2):");
for (const n of [1, 2, 3, 4, 5]) {
  const specific = all.filter(
    (m) => fits(m, n) && (m.criteria?.minChildren ?? 1) >= 2,
  );
  const fed = specific.filter((m) => m.level === "federal").length;
  const msk = specific.filter(
    (m) => m.level === "regional" && forRegion(m, "Москва"),
  ).length;
  console.log(
    `  N=${n}: всего ${String(specific.length).padStart(4)}, федеральных ${String(fed).padStart(3)}, Москва ${fed + msk}`,
  );
}
