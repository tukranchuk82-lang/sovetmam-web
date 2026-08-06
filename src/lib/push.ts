import "server-only";
import webpush from "web-push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Пуш-уведомления.
 *
 * Нужны, чтобы человек узнал об ответе, даже когда приложение закрыто. Письмо
 * и сообщение в мессенджер остаются: пуш их не заменяет, а дополняет — часть
 * людей запрещает уведомления, часть не устанавливает приложение.
 *
 * Ключи VAPID лежат в переменных окружения. Публичный уходит в браузер (у него
 * префикс NEXT_PUBLIC_), приватный остаётся на сервере. Если ключей нет,
 * отправка молча пропускается — приложение из-за этого падать не должно.
 */

export type PushPayload = {
  title: string;
  body: string;
  /** Куда вести по нажатию — путь внутри приложения. */
  url: string;
  /** Кружок с числом на иконке приложения. */
  badge?: number;
};

function configured(): boolean {
  const ok = Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
  if (ok) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:info@sovetmam.ru",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
  }
  return ok;
}

export async function saveSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
}): Promise<void> {
  const sb = createSupabaseAdminClient();
  // Одно устройство — одна запись: браузер может прислать ту же подписку
  // повторно, и плодить дубли незачем.
  await sb.from("push_subscriptions").upsert(
    {
      user_id: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

/**
 * Отправляет уведомление на все устройства человека.
 *
 * Возвращает, сколько устройств получили. Подписки, на которые push-сервис
 * ответил «больше не существует», удаляем — иначе список устройств копил бы
 * мусор годами.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!configured()) {
    console.log(`[Пуш] ключи не настроены, пропускаю: ${payload.title}`);
    return 0;
  }

  const sb = createSupabaseAdminClient();
  const { data } = await sb
    .from("push_subscriptions")
    .select("endpoint,p256dh,auth")
    .eq("user_id", userId);

  const subs = data ?? [];
  if (subs.length === 0) return 0;

  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: s.endpoint as string,
          keys: { p256dh: s.p256dh as string, auth: s.auth as string },
        },
        JSON.stringify(payload),
      );
      sent++;
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode;
      // 404 и 410 — подписки больше нет: удалили приложение, отозвали
      // разрешение. Чистим, остальные ошибки просто отмечаем в логе.
      if (status === 404 || status === 410) {
        await removeSubscription(s.endpoint as string);
      } else {
        console.log(`[Пуш] не доставлено (${status ?? "?"}): ${(e as Error).message}`);
      }
    }
  }

  return sent;
}
