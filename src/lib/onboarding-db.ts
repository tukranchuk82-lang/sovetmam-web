import "server-only";
import { createHash, randomInt } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type MessengerChannel = "telegram" | "vk" | "max";

export interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerifiedAt: string | null;
  messengerConnected: boolean;
  messengerChoice: MessengerChannel | null;
  survey: Record<string, unknown> | null;
  avatarUrl: string | null;
  avatarEmoji: string | null;
  avatarBg: string | null;
  messengerAvatarUrl: string | null;
}

export interface Utm {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

const OTP_TTL_MIN = 10; // код живёт 10 минут
const OTP_MAX_ATTEMPTS = 5;

function hashCode(email: string, code: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-secret";
  return createHash("sha256").update(`${email}:${code}:${secret}`).digest("hex");
}

type Row = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  email_verified_at: string | null;
  messenger_connected: boolean;
  messenger_choice: MessengerChannel | null;
  survey: Record<string, unknown> | null;
  avatar_url: string | null;
  avatar_emoji: string | null;
  avatar_bg: string | null;
  messenger_avatar_url: string | null;
};

function fromRow(r: Row): AppUser {
  return {
    id: r.id,
    email: r.email,
    firstName: r.first_name,
    lastName: r.last_name,
    emailVerifiedAt: r.email_verified_at,
    messengerConnected: r.messenger_connected,
    messengerChoice: r.messenger_choice,
    survey: r.survey,
    avatarUrl: r.avatar_url,
    avatarEmoji: r.avatar_emoji,
    avatarBg: r.avatar_bg,
    messengerAvatarUrl: r.messenger_avatar_url,
  };
}

const SELECT =
  "id, email, first_name, last_name, email_verified_at, messenger_connected, messenger_choice, survey, avatar_url, avatar_emoji, avatar_bg, messenger_avatar_url";

export async function getAppUserById(id: string): Promise<AppUser | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("app_users").select(SELECT).eq("id", id).maybeSingle();
  return data ? fromRow(data as Row) : null;
}

export async function getAppUserByEmail(email: string): Promise<AppUser | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("app_users")
    .select(SELECT)
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return data ? fromRow(data as Row) : null;
}

/**
 * Создаёт/обновляет пользователя на шаге запроса кода: пишем имя/фамилию, а
 * UTM — только при первом касании (не перезатираем уже сохранённые метки).
 */
export async function upsertUserForRequest(
  email: string,
  firstName: string,
  lastName: string,
  utm: Utm,
): Promise<AppUser> {
  const sb = createSupabaseAdminClient();
  const norm = email.toLowerCase();
  const existing = await getAppUserByEmail(norm);

  if (existing) {
    await sb
      .from("app_users")
      .update({ first_name: firstName, last_name: lastName })
      .eq("id", existing.id);
    return { ...existing, firstName, lastName };
  }

  const { data, error } = await sb
    .from("app_users")
    .insert({
      email: norm,
      first_name: firstName,
      last_name: lastName,
      utm_source: utm.utm_source ?? null,
      utm_medium: utm.utm_medium ?? null,
      utm_campaign: utm.utm_campaign ?? null,
      utm_content: utm.utm_content ?? null,
      utm_term: utm.utm_term ?? null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return fromRow(data as Row);
}

/** Генерирует код, сохраняет его хэш, гасит прежние коды для email. Возвращает код. */
export async function issueOtp(email: string): Promise<string> {
  const sb = createSupabaseAdminClient();
  const norm = email.toLowerCase();
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000).toISOString();

  // гасим прежние неиспользованные коды
  await sb
    .from("email_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("email", norm)
    .is("consumed_at", null);

  await sb.from("email_otps").insert({
    email: norm,
    code_hash: hashCode(norm, code),
    expires_at: expiresAt,
  });
  return code;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "expired" | "invalid" | "too_many" };

/** Проверяет код: срок, попытки, хэш. При успехе гасит код. */
export async function verifyOtp(email: string, code: string): Promise<VerifyResult> {
  const sb = createSupabaseAdminClient();
  const norm = email.toLowerCase();
  const { data } = await sb
    .from("email_otps")
    .select("id, code_hash, expires_at, attempts")
    .eq("email", norm)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { ok: false, reason: "invalid" };
  if (data.attempts >= OTP_MAX_ATTEMPTS) return { ok: false, reason: "too_many" };
  if (new Date(data.expires_at).getTime() < Date.now())
    return { ok: false, reason: "expired" };

  if (data.code_hash !== hashCode(norm, code)) {
    await sb
      .from("email_otps")
      .update({ attempts: data.attempts + 1 })
      .eq("id", data.id);
    return { ok: false, reason: "invalid" };
  }

  await sb
    .from("email_otps")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", data.id);
  await sb
    .from("app_users")
    .update({ email_verified_at: new Date().toISOString() })
    .eq("email", norm);
  return { ok: true };
}

export async function setMessengerChoice(
  userId: string,
  channel: MessengerChannel,
): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb.from("app_users").update({ messenger_choice: channel }).eq("id", userId);
}

/** Сохраняет ответы анкеты (перезапись). */
export async function saveSurvey(
  userId: string,
  survey: Record<string, unknown>,
): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb
    .from("app_users")
    .update({ survey, survey_updated_at: new Date().toISOString() })
    .eq("id", userId);
}

// ---- Аватар ----

/** Загружает фото в Storage (bucket avatars) и возвращает публичную ссылку. */
export async function uploadAvatarFile(
  userId: string,
  bytes: Buffer,
  ext: string,
  contentType: string,
): Promise<string> {
  const sb = createSupabaseAdminClient();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await sb.storage
    .from("avatars")
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw error;
  return sb.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}

/** Ставит загруженное фото (сбрасывает смайлик). */
export async function setAvatarImage(userId: string, url: string): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb
    .from("app_users")
    .update({ avatar_url: url, avatar_emoji: null, avatar_bg: null })
    .eq("id", userId);
}

/** Ставит смайлик на фоне (сбрасывает загруженное фото). */
export async function setAvatarEmoji(
  userId: string,
  emoji: string,
  bg: string,
): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb
    .from("app_users")
    .update({ avatar_emoji: emoji, avatar_bg: bg, avatar_url: null })
    .eq("id", userId);
}

/** Сбрасывает аватар к дефолту (человечек). */
export async function clearAvatar(userId: string): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb
    .from("app_users")
    .update({ avatar_url: null, avatar_emoji: null, avatar_bg: null })
    .eq("id", userId);
}
