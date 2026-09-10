import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Спорные меры — очередь в админке.
 *
 * Раньше расхождения источников копились в docs/spornye-mery.md: файл видел
 * только тот, кто открыл репозиторий, а прислать уточнение можно было разве
 * что в чат. Теперь то же самое живёт в базе и открыто всем админам на
 * /admin/disputes — вместе со ссылками на источники (с пометкой, что именно
 * с ними не так) и полем, куда можно прислать правильный текст.
 */

export type DisputeSourceProblem = "contradicts" | "unreachable" | "note";

export interface DisputeSource {
  url: string;
  label: string;
  problem: DisputeSourceProblem;
}

export interface MeasureDispute {
  id: string;
  measureSlug: string | null;
  measureTitle: string | null;
  title: string;
  reason: string;
  sources: DisputeSource[];
  status: "open" | "resolved";
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  notes: DisputeNote[];
}

export interface DisputeNote {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface DisputeRow {
  id: string;
  measure_slug: string | null;
  title: string;
  reason: string;
  sources: DisputeSource[];
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  measures: { title: string } | { title: string }[] | null;
}

interface NoteRow {
  id: string;
  dispute_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

function measureTitleOf(m: DisputeRow["measures"]): string | null {
  if (!m) return null;
  return Array.isArray(m) ? (m[0]?.title ?? null) : m.title;
}

function fromRow(r: DisputeRow, notes: DisputeNote[]): MeasureDispute {
  return {
    id: r.id,
    measureSlug: r.measure_slug,
    measureTitle: measureTitleOf(r.measures),
    title: r.title,
    reason: r.reason,
    sources: r.sources ?? [],
    status: r.status,
    createdAt: r.created_at,
    resolvedAt: r.resolved_at,
    resolvedBy: r.resolved_by,
    notes,
  };
}

/** Все споры нужного статуса, вместе с уточнениями админов, свежие сверху. */
export async function listDisputes(
  status: "open" | "resolved",
): Promise<MeasureDispute[]> {
  const supabase = createSupabaseAdminClient();
  const { data: disputes, error } = await supabase
    .from("measure_disputes")
    .select("*, measures(title)")
    .eq("status", status)
    .order("created_at", { ascending: status === "resolved" ? false : true });
  if (error) throw error;
  const rows = (disputes ?? []) as DisputeRow[];
  if (rows.length === 0) return [];

  const { data: notes, error: notesError } = await supabase
    .from("measure_dispute_notes")
    .select("*")
    .in(
      "dispute_id",
      rows.map((r) => r.id),
    )
    .order("created_at", { ascending: true });
  if (notesError) throw notesError;

  const notesByDispute = new Map<string, DisputeNote[]>();
  for (const n of (notes ?? []) as NoteRow[]) {
    const list = notesByDispute.get(n.dispute_id) ?? [];
    list.push({
      id: n.id,
      authorName: n.author_name,
      body: n.body,
      createdAt: n.created_at,
    });
    notesByDispute.set(n.dispute_id, list);
  }

  return rows.map((r) => fromRow(r, notesByDispute.get(r.id) ?? []));
}

export async function countOpenDisputes(): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("measure_disputes")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");
  if (error) throw error;
  return count ?? 0;
}

/** Присланное админом уточнение — текст или ссылка на нормативный акт. */
export async function addDisputeNote(
  disputeId: string,
  authorName: string,
  body: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("measure_dispute_notes")
    .insert({ dispute_id: disputeId, author_name: authorName, body });
  if (error) throw error;
}

export async function resolveDispute(
  disputeId: string,
  resolvedBy: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("measure_disputes")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq("id", disputeId);
  if (error) throw error;
}

export async function reopenDispute(disputeId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("measure_disputes")
    .update({ status: "open", resolved_at: null, resolved_by: null })
    .eq("id", disputeId);
  if (error) throw error;
}

/** Заводит новый спор — вызывается скриптами сверки и вручную из админки. */
export async function createDispute(input: {
  measureSlug: string | null;
  title: string;
  reason: string;
  sources: DisputeSource[];
}): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("measure_disputes").insert({
    measure_slug: input.measureSlug,
    title: input.title,
    reason: input.reason,
    sources: input.sources,
  });
  if (error) throw error;
}
