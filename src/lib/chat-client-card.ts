import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Карточка человека для координатора: всё, что помогает ответить в чате по
 * делу, — откуда человек, какая у него семья, что он сохранил, писал ли раньше.
 * Берём только то, что человек сам указал в анкете и приложении.
 */

export interface ClientCard {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  region: string | null;
  settlement: string | null;
  messengers: string[];
  surveyUpdatedAt: string | null;
  hasSurvey: boolean;
  childrenCount: number | null;
  flags: string[];
  savedCount: number;
  savedTitles: string[];
  earlierInquiries: number;
}

const SETTLEMENT: Record<string, string> = {
  city: "Город",
  "small-town": "Малый город",
  village: "Село, посёлок",
};

const FLAGS: [string, string][] = [
  ["pregnant", "Ждёт ребёнка"],
  ["singleParent", "Один родитель"],
  ["svoFamily", "Семья участника СВО"],
  ["disabledChild", "Ребёнок с инвалидностью"],
  ["lossOfBreadwinner", "Потеря кормильца"],
  ["fosterParent", "Приёмный родитель"],
];

export async function getClientCard(userId: string, threadRegion: string | null): Promise<ClientCard | null> {
  const sb = createSupabaseAdminClient();
  const { data: u } = await sb
    .from("app_users")
    .select("id, email, first_name, last_name, created_at, telegram_id, vk_id, max_id, survey, survey_updated_at")
    .eq("id", userId)
    .maybeSingle();
  if (!u) return null;

  const survey = (u.survey as Record<string, unknown> | null) ?? null;
  const childrenCount = survey && survey.hasChildren ? Number(survey.childrenCount) || null : null;
  const flags = survey ? FLAGS.filter(([k]) => Boolean(survey[k])).map(([, label]) => label) : [];
  if (survey && Number(survey.childrenCount) >= 3) flags.unshift("Многодетная семья");

  const [{ data: saved }, { count: inquiries }] = await Promise.all([
    sb
      .from("saved_measures")
      .select("measure_slug, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    sb.from("inquiries").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const slugs = (saved ?? []).slice(0, 4).map((s) => s.measure_slug as string);
  const titles = new Map<string, string>();
  if (slugs.length) {
    const { data: ms } = await sb.from("measures").select("slug, title").in("slug", slugs);
    for (const m of ms ?? []) titles.set(m.slug as string, m.title as string);
  }

  return {
    id: u.id as string,
    name: `${u.first_name} ${u.last_name}`.trim(),
    email: u.email as string,
    createdAt: u.created_at as string,
    region: threadRegion ?? (typeof survey?.region === "string" ? survey.region : null),
    settlement:
      typeof survey?.settlementType === "string" ? (SETTLEMENT[survey.settlementType] ?? null) : null,
    messengers: [
      u.telegram_id != null && "Telegram",
      u.max_id != null && "MAX",
      u.vk_id != null && "ВКонтакте",
    ].filter(Boolean) as string[],
    surveyUpdatedAt: (u.survey_updated_at as string | null) ?? null,
    hasSurvey: survey != null,
    childrenCount,
    flags,
    savedCount: (saved ?? []).length,
    savedTitles: slugs.map((s) => titles.get(s) ?? s),
    earlierInquiries: inquiries ?? 0,
  };
}
