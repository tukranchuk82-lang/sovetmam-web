import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { isMeasureStatus, type MeasureStatus } from "@/lib/measure-status-labels";

export type { MeasureStatus };

/** Ответы человека по всем мерам: slug → статус. */
export async function listMeasureStatuses(userId: string): Promise<Record<string, MeasureStatus>> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb.from("measure_status").select("measure_slug, status").eq("user_id", userId);
  if (error) throw error;
  const out: Record<string, MeasureStatus> = {};
  for (const r of data ?? []) if (isMeasureStatus(r.status)) out[r.measure_slug as string] = r.status;
  return out;
}

/** Поставить, поменять или снять (status = null) ответ по мере. */
export async function setMeasureStatus(
  userId: string,
  slug: string,
  status: MeasureStatus | null,
  region: string | null,
): Promise<void> {
  const sb = createSupabaseAdminClient();
  if (status === null) {
    const { error } = await sb.from("measure_status").delete().eq("user_id", userId).eq("measure_slug", slug);
    if (error) throw error;
    return;
  }
  const { error } = await sb
    .from("measure_status")
    .upsert(
      { user_id: userId, measure_slug: slug, status, region, updated_at: new Date().toISOString() },
      { onConflict: "user_id,measure_slug" },
    );
  if (error) throw error;
}
