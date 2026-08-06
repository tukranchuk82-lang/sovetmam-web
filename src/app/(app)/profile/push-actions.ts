"use server";

import { getCurrentAppUser } from "@/lib/user-session";
import { removeSubscription, saveSubscription } from "@/lib/push";

/**
 * Подписка устройства на уведомления.
 *
 * Само разрешение спрашивает браузер, а сюда приходит уже готовая подписка —
 * её нужно только сохранить и привязать к человеку.
 */
export async function subscribeToPushAction(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
}): Promise<{ ok: boolean }> {
  const user = await getCurrentAppUser();
  if (!user) return { ok: false };

  await saveSubscription({
    userId: user.id,
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
    userAgent: input.userAgent,
  });
  return { ok: true };
}

/** Человек выключил уведомления — забываем это устройство. */
export async function unsubscribeFromPushAction(endpoint: string): Promise<{ ok: boolean }> {
  const user = await getCurrentAppUser();
  if (!user) return { ok: false };
  await removeSubscription(endpoint);
  return { ok: true };
}
