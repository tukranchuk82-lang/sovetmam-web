import "server-only";
import type { MessengerChannel } from "@/lib/onboarding-db";

/**
 * Прокси-ссылки Salebot для каждого бота. В ссылку кладём GET-параметры
 * (app_id — id пользователя в нашей БД, email, имя, фамилия). Salebot сохранит
 * их как переменные клиента, и потом воронка Salebot дёрнет наш вебхук
 * /api/salebot/connect, чтобы вернуть, какой мессенджер и когда подключён.
 *
 * Хэш в ссылках — публичный идентификатор бота (не секрет).
 */
const SALEBOT_PROXY_BASE: Record<MessengerChannel, string> = {
  telegram: "https://s.salebot.pro/847c2b0819df8b14819a25d79c47d0a2_1",
  vk: "https://salebot.pro/ref/847c2b0819df8b14819a25d79c47d0a2",
  max: "https://s.salebot.pro/847c2b0819df8b14819a25d79c47d0a2_20",
};

export function buildSalebotProxyLink(
  channel: MessengerChannel,
  user: { id: string; email: string; firstName: string; lastName: string },
): string {
  const base = SALEBOT_PROXY_BASE[channel];
  const q = new URLSearchParams({
    app_id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
  });
  return `${base}?${q.toString()}`;
}
