"use server";

import { getCurrentAppUser } from "@/lib/user-session";
import { isMeasureStatus } from "@/lib/measure-status-labels";
import {
  listMeasureStatuses,
  setMeasureStatus,
  type MeasureStatus,
} from "@/lib/measure-status-db";

/** Ответы текущего человека по мерам (пусто, если не вошёл). */
export async function getMyMeasureStatuses(): Promise<Record<string, MeasureStatus>> {
  const user = await getCurrentAppUser();
  if (!user) return {};
  return listMeasureStatuses(user.id);
}

/**
 * Записать ответ по мере. status = null — снять ответ. Возвращает { authed }:
 * authed=false — человек не вошёл (клиент предложит войти).
 */
export async function setMeasureStatusAction(
  slug: string,
  status: MeasureStatus | null,
): Promise<{ authed: boolean }> {
  const user = await getCurrentAppUser();
  if (!user || !user.emailVerifiedAt) return { authed: false };
  if (typeof slug !== "string" || slug.length === 0 || slug.length > 200) return { authed: true };
  if (status !== null && !isMeasureStatus(status)) return { authed: true };
  const region = (user.survey as { region?: string } | null)?.region ?? null;
  await setMeasureStatus(user.id, slug, status, region);
  return { authed: true };
}
