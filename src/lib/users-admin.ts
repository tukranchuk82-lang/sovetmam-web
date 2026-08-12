import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AppRole, MessengerChannel } from "@/lib/onboarding-db";

// База зарегистрированных пользователей для админ-панели. Читаем через
// service_role (RLS закрыт для клиентов), собираем то, что нужно на экране:
// кто, когда пришёл, каким каналом связан, что указал в анкете /podbor и
// сколько мер сохранил в избранное.

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AppRole;
  emailVerifiedAt: string | null;
  createdAt: string;
  messengerChoice: MessengerChannel | null;
  messengerConnected: boolean;
  messengerConnectedAt: string | null;
  telegramId: number | null;
  vkId: number | null;
  maxId: string | null;
  avatarUrl: string | null;
  avatarEmoji: string | null;
  avatarBg: string | null;
  messengerAvatarUrl: string | null;
  survey: UserSurvey | null;
  surveyUpdatedAt: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  savedCount: number;
  /**
   * Отметки о согласиях: на обработку данных и на рассылку.
   *
   * Пусто у тех, кто зарегистрировался до появления галочек: их согласие
   * считается данным при регистрации, отдельной записи о нём нет.
   */
  consents: { kind: string; docVersion: string; acceptedAt: string; revokedAt: string | null }[];
}

/** Поля анкеты /podbor, которые показываем в админке (остальные не трогаем). */
export interface UserSurvey {
  region?: string | null;
  childrenCount?: number | null;
  childrenAges?: number[] | null;
  pregnant?: boolean | null;
  lowIncome?: boolean | null;
  singleParent?: boolean | null;
  svoFamily?: boolean | null;
  disabledChild?: boolean | null;
  fosterParent?: boolean | null;
  mortgageIntent?: boolean | null;
  [key: string]: unknown;
}

type Row = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: AppRole;
  email_verified_at: string | null;
  created_at: string;
  messenger_choice: MessengerChannel | null;
  messenger_connected: boolean;
  messenger_connected_at: string | null;
  telegram_id: number | null;
  vk_id: number | null;
  max_id: string | null;
  avatar_url: string | null;
  avatar_emoji: string | null;
  avatar_bg: string | null;
  messenger_avatar_url: string | null;
  survey: UserSurvey | null;
  survey_updated_at: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
};

const SELECT =
  "id, email, first_name, last_name, role, email_verified_at, created_at, messenger_choice, messenger_connected, messenger_connected_at, telegram_id, vk_id, max_id, avatar_url, avatar_emoji, avatar_bg, messenger_avatar_url, survey, survey_updated_at, utm_source, utm_campaign";

/** Все пользователи, свежие сверху, с числом сохранённых мер. */
export async function listAppUsersForAdmin(): Promise<AdminUser[]> {
  const sb = createSupabaseAdminClient();

  const [users, saved, consents] = await Promise.all([
    sb.from("app_users").select(SELECT).order("created_at", { ascending: false }),
    sb.from("saved_measures").select("user_id"),
    sb.from("user_consents").select("user_id,kind,doc_version,accepted_at,revoked_at"),
  ]);
  if (users.error) throw users.error;

  // Избранное считаем в памяти: записей немного, отдельный запрос на каждого
  // пользователя был бы дороже. Если таблица недоступна — просто нули.
  const savedByUser = new Map<string, number>();
  for (const r of (saved.data ?? []) as { user_id: string }[]) {
    savedByUser.set(r.user_id, (savedByUser.get(r.user_id) ?? 0) + 1);
  }

  // Согласия — тем же приёмом: одна выборка на всех, раскладываем по людям.
  const consentsByUser = new Map<string, AdminUser["consents"]>();
  for (const c of (consents.data ?? []) as {
    user_id: string;
    kind: string;
    doc_version: string;
    accepted_at: string;
    revoked_at: string | null;
  }[]) {
    const list = consentsByUser.get(c.user_id) ?? [];
    list.push({
      kind: c.kind,
      docVersion: c.doc_version,
      acceptedAt: c.accepted_at,
      revokedAt: c.revoked_at,
    });
    consentsByUser.set(c.user_id, list);
  }

  return (users.data as Row[]).map((r) => ({
    id: r.id,
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    role: r.role,
    emailVerifiedAt: r.email_verified_at,
    createdAt: r.created_at,
    messengerChoice: r.messenger_choice,
    messengerConnected: r.messenger_connected,
    messengerConnectedAt: r.messenger_connected_at,
    telegramId: r.telegram_id,
    vkId: r.vk_id,
    maxId: r.max_id,
    avatarUrl: r.avatar_url,
    avatarEmoji: r.avatar_emoji,
    avatarBg: r.avatar_bg,
    messengerAvatarUrl: r.messenger_avatar_url,
    survey: r.survey,
    surveyUpdatedAt: r.survey_updated_at,
    utmSource: r.utm_source,
    utmCampaign: r.utm_campaign,
    savedCount: savedByUser.get(r.id) ?? 0,
    consents: consentsByUser.get(r.id) ?? [],
  }));
}

export interface UsersStats {
  total: number;
  verified: number;
  withMessenger: number;
  withSurvey: number;
  last7days: number;
  byChannel: Record<MessengerChannel, number>;
}

export function computeUsersStats(users: AdminUser[]): UsersStats {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const stats: UsersStats = {
    total: users.length,
    verified: 0,
    withMessenger: 0,
    withSurvey: 0,
    last7days: 0,
    byChannel: { telegram: 0, vk: 0, max: 0 },
  };
  for (const u of users) {
    if (u.emailVerifiedAt) stats.verified += 1;
    if (u.survey) stats.withSurvey += 1;
    if (new Date(u.createdAt).getTime() >= weekAgo) stats.last7days += 1;
    // Считаем по фактически привязанным id, а не по выбранному каналу:
    // человек мог выбрать канал, но так и не дойти до бота.
    const connected =
      u.telegramId != null || u.vkId != null || u.maxId != null;
    if (connected) stats.withMessenger += 1;
    if (u.telegramId != null) stats.byChannel.telegram += 1;
    if (u.vkId != null) stats.byChannel.vk += 1;
    if (u.maxId != null) stats.byChannel.max += 1;
  }
  return stats;
}
