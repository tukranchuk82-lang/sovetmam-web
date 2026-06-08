import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { SupportMeasure } from "@/lib/measures";

// Полная строка из public.measures, включая неопубликованные и админ-поля.
export interface MeasureAdminRow extends SupportMeasure {
  isPublished: boolean;
  sortOrder: number;
}

const SELECT_FIELDS =
  "slug, title, short_description, level, region, category, amount, segments, criteria, how_to_apply, documents, tips, source_url, source_name, updated_at_label, is_published, sort_order";

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
