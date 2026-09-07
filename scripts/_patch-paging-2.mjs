// Ещё два места, где выборка обрезалась на тысяче:
//   getMeasuresBySegment — у метки «Ждём 5-го и более» 1553 меры, треть
//     страницы человек просто не видел;
//   getMeasureCountsBySegment — счётчики на плитках каталога считались по
//     первой тысяче мер, поэтому были занижены.
import { readFileSync, writeFileSync } from "node:fs";

const path = "src/lib/measures-db.ts";
let s = readFileSync(path, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";
const L = (...x) => x.join(nl);

const pairs = [
  [
    L('import { createSupabaseAnonClient } from "@/lib/supabase/anon";'),
    L(
      'import { createSupabaseAnonClient } from "@/lib/supabase/anon";',
      'import { fetchAllPages } from "@/lib/supabase/paged";',
    ),
  ],
  [
    L(
      "  const supabase = createSupabaseAnonClient();",
      "  const { data, error } = await supabase",
      '    .from("measures")',
      "    .select(SELECT_FIELDS)",
      '    .eq("is_published", true)',
      '    .contains("segments", [segmentId])',
      '    .order("sort_order", { ascending: true });',
      "",
      "  if (error) throw error;",
      "  return (data as MeasureRow[]).map(fromRow);",
    ),
    L(
      "  const supabase = createSupabaseAnonClient();",
      "  // Страницами: в крупных метках больше полутора тысяч мер, а PostgREST",
      "  // отдаёт тысячу и молчит — остального человек на странице не увидит.",
      "  const rows = await fetchAllPages<MeasureRow>((from, to) =>",
      "    supabase",
      '      .from("measures")',
      "      .select(SELECT_FIELDS)",
      '      .eq("is_published", true)',
      '      .contains("segments", [segmentId])',
      '      .order("sort_order", { ascending: true })',
      '      .order("slug", { ascending: true })',
      "      .range(from, to),",
      "  );",
      "  return rows.map(fromRow);",
    ),
  ],
  [
    L(
      "  const supabase = createSupabaseAnonClient();",
      "  const { data, error } = await supabase",
      '    .from("measures")',
      '    .select("segments")',
      '    .eq("is_published", true);',
      "",
      "  if (error) throw error;",
      "",
      "  const counts: Record<string, number> = {};",
      "  for (const row of data as { segments: string[] }[]) {",
    ),
    L(
      "  const supabase = createSupabaseAnonClient();",
      "  // Тоже страницами: иначе счётчики на плитках каталога считались бы по",
      "  // первой тысяче мер и всегда были бы занижены.",
      "  const rows = await fetchAllPages<{ segments: string[]; slug: string }>((from, to) =>",
      "    supabase",
      '      .from("measures")',
      '      .select("segments, slug")',
      '      .eq("is_published", true)',
      '      .order("slug", { ascending: true })',
      "      .range(from, to),",
      "  );",
      "",
      "  const counts: Record<string, number> = {};",
      "  for (const row of rows) {",
    ),
  ],
];
for (const [from, to] of pairs) {
  if (!s.includes(from)) throw new Error("не нашла: " + from.split(nl)[1]?.trim().slice(0, 50));
  s = s.replace(from, to);
}
writeFileSync(path, s, "utf8");
console.log("правлено:", path);
