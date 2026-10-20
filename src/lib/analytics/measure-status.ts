import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAllPages } from "@/lib/supabase/paged";
import { listMeasuresIndexForAdmin } from "@/lib/measures-admin";
import { inPeriod, type Period } from "@/lib/analytics/period";
import type { MeasureStatus } from "@/lib/measure-status-labels";

/**
 * Отчёт «Оформление мер»: что люди говорят про меры из своей подборки —
 * пользуются, не подавали или получили отказ. Показывает, где мера доходит до
 * человека, а где «не подаём» или «отказывают» (значит, условия в каталоге
 * надо уточнить).
 */

export interface MeasureStatusRow {
  slug: string;
  title: string;
  level: "federal" | "regional";
  region: string | null;
  using: number;
  notApplied: number;
  refused: number;
  total: number;
  /** Доля «отказали» среди тех, кто подавал (пользуются + отказали); null — подавших нет. */
  refusedPct: number | null;
  /** Доля «пользуются» среди всех ответивших. */
  usingPct: number;
}

export interface MeasureStatusReport {
  answers: number;
  people: number;
  using: number;
  notApplied: number;
  refused: number;
  /** Среди подавших (пользуются + отказали): сколько получили отказ, %. */
  refusedPct: number | null;
  rows: MeasureStatusRow[];
}

export async function getMeasureStatusReport(period: Period): Promise<MeasureStatusReport> {
  const sb = createSupabaseAdminClient();
  const [rowsAll, index] = await Promise.all([
    fetchAllPages<{ user_id: string; measure_slug: string; status: MeasureStatus; updated_at: string }>((from, to) =>
      sb.from("measure_status").select("user_id, measure_slug, status, updated_at").order("id").range(from, to),
    ),
    listMeasuresIndexForAdmin(),
  ]);
  const rows = rowsAll.filter((r) => inPeriod(r.updated_at, period));
  const meta = new Map(index.map((m) => [m.slug, m]));

  const by = new Map<string, { using: number; notApplied: number; refused: number }>();
  for (const r of rows) {
    const e = by.get(r.measure_slug) ?? { using: 0, notApplied: 0, refused: 0 };
    if (r.status === "using") e.using++;
    else if (r.status === "not_applied") e.notApplied++;
    else e.refused++;
    by.set(r.measure_slug, e);
  }

  const out: MeasureStatusRow[] = [...by.entries()].map(([slug, e]) => {
    const m = meta.get(slug);
    const total = e.using + e.notApplied + e.refused;
    const applied = e.using + e.refused;
    return {
      slug,
      title: m?.title ?? slug,
      level: m?.level ?? "regional",
      region: m?.region ?? null,
      using: e.using,
      notApplied: e.notApplied,
      refused: e.refused,
      total,
      refusedPct: applied ? Math.round((e.refused / applied) * 100) : null,
      usingPct: total ? Math.round((e.using / total) * 100) : 0,
    };
  });
  out.sort((a, b) => b.total - a.total);

  const using = rows.filter((r) => r.status === "using").length;
  const notApplied = rows.filter((r) => r.status === "not_applied").length;
  const refused = rows.filter((r) => r.status === "refused").length;
  const applied = using + refused;
  return {
    answers: rows.length,
    people: new Set(rows.map((r) => r.user_id)).size,
    using,
    notApplied,
    refused,
    refusedPct: applied ? Math.round((refused / applied) * 100) : null,
    rows: out,
  };
}
