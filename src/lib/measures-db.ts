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
  const { data, error } = await supabase
    .from("measures")
    .select(SELECT_FIELDS)
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as MeasureRow[]).map(fromRow);
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
