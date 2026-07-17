import "server-only";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";
import type {
  EligibilityCriteria,
  SegmentId,
  SupportLevel,
  SupportMeasure,
} from "@/lib/measures";

// Строка из таблицы public.measures (snake_case).
interface MeasureRow {
  slug: string;
  title: string;
  short_description: string;
  level: SupportLevel;
  region: string | null;
  category: string;
  amount: string | null;
  segments: string[];
  criteria: EligibilityCriteria;
  how_to_apply: string[];
  documents: string[];
  tips: string[] | null;
  source_url: string;
  source_name: string;
  updated_at_label: string | null;
  is_published: boolean;
  sort_order: number;
}

function fromRow(r: MeasureRow): SupportMeasure {
  return {
    slug: r.slug,
    title: r.title,
    shortDescription: r.short_description,
    level: r.level,
    region: r.region ?? undefined,
    category: r.category as SupportMeasure["category"],
    amount: r.amount ?? undefined,
    segments: r.segments as SegmentId[],
    criteria: r.criteria ?? {},
    howToApply: r.how_to_apply,
    documents: r.documents,
    tips: r.tips ?? [],
    sourceUrl: r.source_url,
    sourceName: r.source_name,
    updatedAt: r.updated_at_label ?? "",
  };
}

const SELECT_FIELDS =
  "slug, title, short_description, level, region, category, amount, segments, criteria, how_to_apply, documents, tips, source_url, source_name, updated_at_label, is_published, sort_order";

export async function getAllMeasures(): Promise<SupportMeasure[]> {
  const supabase = createSupabaseAnonClient();
  // PostgREST отдаёт максимум ~1000 строк за запрос, а мер уже больше 2000 —
  // поэтому листаем постранично. Сортируем по (sort_order, slug): slug
  // уникален и даёт стабильный порядок между страницами (без пропусков/дублей).
  const PAGE = 1000;
  const all: MeasureRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("measures")
      .select(SELECT_FIELDS)
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("slug", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) throw error;
    const rows = (data ?? []) as MeasureRow[];
    all.push(...rows);
    if (rows.length < PAGE) break;
  }
  return all.map(fromRow);
}

export async function getMeasureBySlug(
  slug: string,
): Promise<SupportMeasure | null> {
  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from("measures")
    .select(SELECT_FIELDS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  return data ? fromRow(data as MeasureRow) : null;
}

/**
 * Меры по списку слагов (для избранного). Порядок исходного списка сохраняем
 * сами — PostgREST его не гарантирует. Несуществующие/снятые с публикации слаги
 * просто выпадают из результата.
 */
export async function getMeasuresBySlugs(
  slugs: string[],
): Promise<SupportMeasure[]> {
  if (slugs.length === 0) return [];
  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from("measures")
    .select(SELECT_FIELDS)
    .eq("is_published", true)
    .in("slug", slugs);

  if (error) throw error;
  const bySlug = new Map(
    (data as MeasureRow[]).map((r) => [r.slug, fromRow(r)]),
  );
  return slugs.map((s) => bySlug.get(s)).filter(Boolean) as SupportMeasure[];
}

export async function getMeasuresBySegment(
  segmentId: SegmentId,
): Promise<SupportMeasure[]> {
  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from("measures")
    .select(SELECT_FIELDS)
    .eq("is_published", true)
    .contains("segments", [segmentId])
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as MeasureRow[]).map(fromRow);
}

/**
 * Меры, относящиеся к семье с детьми (для плиток «Семья с N детьми» /
 * «Многодетная семья»). Считаем мерой про семью с детьми, если она требует
 * детей/семью, размечена сегментом или задаёт порог по числу детей. Меры
 * стадии беременности (requiresPregnancy) — это домен плиток «Ждём N-го»,
 * у сложившейся семьи их не показываем.
 */
async function getFamilyMeasures(): Promise<SupportMeasure[]> {
  // Через getAllMeasures — у него уже правильная постраничная загрузка
  // (иначе PostgREST молча вернёт только первые ~1000 из 2000+ мер).
  const measures = await getAllMeasures();
  return measures.filter((m) => {
    const c = m.criteria;
    if (c.requiresPregnancy) return false;
    return Boolean(
      c.requiresChildren ||
        c.requiresFamily ||
        c.minChildren != null ||
        (m.segments?.length ?? 0) > 0,
    );
  });
}

/**
 * Плитки «Семья с N детьми». Мера подходит семье с N детьми, если требует
 * не больше N детей: (minChildren ?? 1) ≤ N. Порог считаем по количеству,
 * возраст ребёнка не важен (мера про школьника доступна и семье с 1 ребёнком).
 */
export async function getMeasuresForFamilySize(
  childrenCount: number,
): Promise<SupportMeasure[]> {
  const measures = await getFamilyMeasures();
  return measures.filter((m) => (m.criteria.minChildren ?? 1) <= childrenCount);
}

/**
 * «Многодетная семья» — по ВИТРИННОЙ категории `many-children`, а не по порогу
 * minChildren ≥ 3. Разница принципиальная: мера «многодетным ИЛИ малоимущим»
 * многодетным положена, но порог по числу детей у неё не стоит (иначе анкета
 * зря потребовала бы многодетность от малоимущей семьи с одним ребёнком).
 * По порогу такая мера из плитки выпадала; по категории — попадает.
 */
export async function getMeasuresForManyChildren(): Promise<SupportMeasure[]> {
  const measures = await getFamilyMeasures();
  return measures.filter((m) =>
    (m.segments as unknown as string[]).includes("many-children"),
  );
}

/** Считает кол-во опубликованных мер для каждого сегмента (один SQL-запрос). */
export async function getMeasureCountsBySegment(): Promise<
  Record<string, number>
> {
  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from("measures")
    .select("segments")
    .eq("is_published", true);

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data as { segments: string[] }[]) {
    for (const seg of row.segments) {
      counts[seg] = (counts[seg] ?? 0) + 1;
    }
  }
  return counts;
}

export async function getAllMeasureSlugs(): Promise<string[]> {
  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase
    .from("measures")
    .select("slug")
    .eq("is_published", true);

  if (error) throw error;
  return (data as { slug: string }[]).map((r) => r.slug);
}
