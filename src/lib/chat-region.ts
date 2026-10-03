import "server-only";
import { cookies } from "next/headers";
import { REGIONS } from "@/lib/measures";
import { REGION_COOKIE } from "@/lib/region";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppUser } from "@/lib/onboarding-db";

/**
 * Регион человека для чата с координатором.
 *
 * Берём из анкеты подбора, а если анкеты нет — из выбранного им в приложении
 * (cookie). Без региона чат не открыть: от него зависит, кому уйдёт вопрос.
 */
export async function getUserChatRegion(user: AppUser | null): Promise<string | null> {
  const fromSurvey = typeof user?.survey?.region === "string" ? user.survey.region : null;
  if (fromSurvey && (REGIONS as readonly string[]).includes(fromSurvey)) return fromSurvey;
  const c = await cookies();
  const raw = c.get(REGION_COOKIE)?.value ?? null;
  return raw && (REGIONS as readonly string[]).includes(raw) ? raw : null;
}

/**
 * Регион беседы — по её сообщениям (там он записан на момент письма), а если
 * сообщений ещё нет — по анкете человека. Нужен координатору: у человека без
 * анкеты региона в профиле нет, но беседа к региону привязана.
 */
export async function getThreadRegion(userId: string, fallback: AppUser | null): Promise<string | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("coordinator_messages")
    .select("region")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data?.region) return data.region as string;
  return typeof fallback?.survey?.region === "string" ? fallback.survey.region : null;
}
