import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupportMeasure } from "@/lib/measures";

// Полная строка из public.measures, включая неопубликованные и админ-поля.
export interface MeasureAdminRow extends SupportMeasure {
  isPublished: boolean;
  sortOrder: number;
}

const SELECT_FIELDS =
  "slug, title, short_description, level, region, category, amount, segments, criteria, eligibility, how_to_apply, documents, tips, source_url, source_name, updated_at_label, is_published, sort_order";

function rowToAdmin(r: Record<string, unknown>): MeasureAdminRow {
  return {
    slug: r.slug as string,
    title: r.title as string,
    shortDescription: r.short_description as string,
    level: r.level as SupportMeasure["level"],
    region: (r.region as string | null) ?? undefined,
    category: r.category as SupportMeasure["category"],
    amount: (r.amount as string | null) ?? undefined,
    segments: (r.segments as string[]) as SupportMeasure["segments"],
    criteria: (r.criteria as SupportMeasure["criteria"]) ?? {},
    eligibility: (r.eligibility as string | null) ?? null,
    howToApply: (r.how_to_apply as string[]) ?? [],
    documents: (r.documents as string[]) ?? [],
    tips: (r.tips as string[] | null) ?? [],
    sourceUrl: r.source_url as string,
    sourceName: r.source_name as string,
    updatedAt: ((r.updated_at_label as string | null) ?? "") as string,
    isPublished: r.is_published as boolean,
    sortOrder: r.sort_order as number,
  };
}

export async function listMeasuresForAdmin(): Promise<MeasureAdminRow[]> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("measures")
    .select(SELECT_FIELDS)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToAdmin);
}

/**
 * Краткая строка меры для списка в админке.
 *
 * Полные карточки (listMeasuresForAdmin) на список не годятся: мер больше двух
 * тысяч, и каждая тянет тексты, документы и подсказки — страница разрасталась
 * на мегабайты. Здесь только то, что видно в строке списка и по чему фильтруем.
 */
export interface MeasureIndexRow {
  slug: string;
  title: string;
  level: "federal" | "regional";
  region: string | null;
  category: string;
  amount: string | null;
  isPublished: boolean;
  verifiedAt: string | null;
}

/**
 * Все меры для списка в админке — постранично.
 *
 * PostgREST отдаёт максимум 1000 строк за запрос, поэтому без постраничного
 * обхода админка показывала лишь часть базы и молча теряла остальные меры.
 */
export async function listMeasuresIndexForAdmin(): Promise<MeasureIndexRow[]> {
  const supabase = createSupabaseAdminClient();
  const PAGE = 1000;
  const out: MeasureIndexRow[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("measures")
      .select("slug, title, level, region, category, amount, is_published, verified_at")
      .order("level", { ascending: true })
      .order("region", { ascending: true, nullsFirst: true })
      .order("title", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;

    const rows = data ?? [];
    for (const r of rows as Record<string, unknown>[]) {
      out.push({
        slug: r.slug as string,
        title: r.title as string,
        level: r.level as "federal" | "regional",
        region: (r.region as string | null) ?? null,
        category: r.category as string,
        amount: (r.amount as string | null) ?? null,
        isPublished: r.is_published as boolean,
        verifiedAt: (r.verified_at as string | null) ?? null,
      });
    }
    if (rows.length < PAGE) break;
  }

  return out;
}

export interface MeasuresStats {
  total: number;
  published: number;
  drafts: number;
  federal: number;
  regional: number;
  /** Сколько регионов из 89 уже имеют хотя бы одну опубликованную меру. */
  regionsCovered: number;
  /** Регионы совсем без опубликованных мер — их и надо закрывать в первую очередь. */
  emptyRegions: string[];
  /** Меры, которые ни разу не сверялись с источником. */
  neverVerified: number;
}

export function computeMeasuresStats(
  rows: MeasureIndexRow[],
  allRegions: readonly string[],
): MeasuresStats {
  const withMeasures = new Set<string>();
  let published = 0;
  let federal = 0;
  let neverVerified = 0;

  for (const r of rows) {
    if (r.isPublished) {
      published += 1;
      if (r.region) withMeasures.add(r.region);
    }
    if (r.level === "federal") federal += 1;
    if (!r.verifiedAt) neverVerified += 1;
  }

  return {
    total: rows.length,
    published,
    drafts: rows.length - published,
    federal,
    regional: rows.length - federal,
    regionsCovered: withMeasures.size,
    emptyRegions: allRegions.filter((r) => !withMeasures.has(r)),
    neverVerified,
  };
}

export async function getMeasureForAdmin(
  slug: string,
): Promise<MeasureAdminRow | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("measures")
    .select(SELECT_FIELDS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToAdmin(data) : null;
}

export interface MeasureInput {
  slug: string;
  title: string;
  shortDescription: string;
  level: "federal" | "regional";
  region: string | null;
  category: string;
  amount: string | null;
  segments: string[];
  criteria: SupportMeasure["criteria"];
  eligibility: string | null;
  howToApply: string[];
  documents: string[];
  tips: string[];
  sourceUrl: string;
  sourceName: string;
  updatedAtLabel: string | null;
  isPublished: boolean;
  sortOrder: number;
}

function inputToRow(m: MeasureInput) {
  return {
    slug: m.slug,
    title: m.title,
    short_description: m.shortDescription,
    level: m.level,
    region: m.region,
    category: m.category,
    amount: m.amount,
    segments: m.segments,
    criteria: m.criteria,
    eligibility: m.eligibility,
    how_to_apply: m.howToApply,
    documents: m.documents,
    tips: m.tips,
    source_url: m.sourceUrl,
    source_name: m.sourceName,
    updated_at_label: m.updatedAtLabel,
    is_published: m.isPublished,
    sort_order: m.sortOrder,
  };
}

export async function insertMeasure(m: MeasureInput): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("measures").insert(inputToRow(m));
  if (error) throw error;
}

export async function updateMeasure(
  originalSlug: string,
  m: MeasureInput,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("measures")
    .update(inputToRow(m))
    .eq("slug", originalSlug);
  if (error) throw error;
}

export async function deleteMeasure(slug: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("measures").delete().eq("slug", slug);
  if (error) throw error;
}
