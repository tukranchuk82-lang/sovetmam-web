import "server-only";
import { cookies } from "next/headers";
import { REGIONS } from "@/lib/measures";
import type { AppUser } from "@/lib/onboarding-db";
import type { AdminScope } from "@/lib/view-mode";

/**
 * Какой регион смотрит владелец/техспец, примеряя на себя роль координатора
 * (своего региона у них нет — см. AdminScope в lib/view-mode.ts). Раньше
 * такого выбора не было вовсе: этот режим всегда показывал данные сразу по
 * всем регионам. Таня попросила — «показывай мне пример админки по
 * координатору так, будто я координатор из Забайкальского края» — отсюда
 * этот выбор.
 *
 * Только для предпросмотра: настоящий координатор всегда видит свой
 * закреплённый регион (app_users.region), эта cookie на него не влияет —
 * см. resolveRegion ниже, единственное место, которое решает, что за регион
 * показывать странице.
 */
const COOKIE = "sm_preview_region";
const MAX_AGE = 60 * 60 * 24 * 180;

export async function getPreviewRegion(): Promise<string | null> {
  const c = await cookies();
  const raw = c.get(COOKIE)?.value;
  return raw && (REGIONS as readonly string[]).includes(raw) ? raw : null;
}

export async function setPreviewRegion(region: string | null): Promise<void> {
  const c = await cookies();
  if (!region || !(REGIONS as readonly string[]).includes(region)) {
    c.delete(COOKIE);
    return;
  }
  c.set(COOKIE, region, { httpOnly: true, sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

/**
 * Регион, который стоит показывать странице, — единственная точка правды
 * (раньше каждая страница решала это по-своему: одни смотрели на scope,
 * другие — прямо на staff.role, из-за чего предпросмотр «на себе» у
 * владельца/техспеца в одних разделах учитывал бы выбранный регион,
 * а в других — нет).
 */
export async function resolveRegion(staff: AppUser, scope: AdminScope): Promise<string | null> {
  if (scope !== "coordinator") return null;
  if (staff.role === "coordinator") return staff.region; // настоящий координатор — только свой, cookie не читаем
  return getPreviewRegion();
}
