import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { appUrl } from "@/lib/inquiry-token";

/**
 * Одноразовые ссылки для входа.
 *
 * Нужны тем, кому не дошёл код на почту: человек пишет боту, ему заводят
 * кабинет вручную, и в тот же чат уходит ссылка — нажал и оказался внутри.
 *
 * Три правила, которые делают ссылку безопасной настолько, насколько это
 * вообще возможно:
 *   — живёт сутки;
 *   — гаснет при первом использовании;
 *   — в базе лежит только хэш, а не сама ссылка: утечка таблицы не откроет
 *     чужие кабинеты.
 *
 * Полностью защититься от пересылки нельзя: если человек сам отдаст ссылку
 * раньше, чем откроет, войдёт тот, кто открыл первым. Поэтому в сообщении
 * прямо просим никому её не передавать.
 */

const TTL_HOURS = 24;

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Создаёт ссылку и возвращает её целиком — показать можно только сейчас. */
export async function createLoginLink(
  userId: string,
  source = "bot",
): Promise<{ url: string; expiresAt: string }> {
  const sb = createSupabaseAdminClient();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_HOURS * 3_600_000).toISOString();

  const { error } = await sb.from("login_links").insert({
    user_id: userId,
    token_hash: hash(token),
    source,
    expires_at: expiresAt,
  });
  if (error) throw error;

  return { url: `${appUrl()}/vhod/${token}`, expiresAt };
}

export type LoginLinkResult =
  | { ok: true; userId: string }
  /** Ссылка просрочена, уже использована или её не существует. */
  | { ok: false };

/** Проверяет ссылку и сразу её гасит: второй раз она не сработает. */
export async function consumeLoginLink(token: string): Promise<LoginLinkResult> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("login_links")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", hash(token))
    .maybeSingle();

  if (!data) return { ok: false };
  if (data.used_at) return { ok: false };
  if (new Date(data.expires_at).getTime() < Date.now()) return { ok: false };

  await sb
    .from("login_links")
    .update({ used_at: new Date().toISOString() })
    .eq("id", data.id);

  return { ok: true, userId: data.user_id as string };
}
