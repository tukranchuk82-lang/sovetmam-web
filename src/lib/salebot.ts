import "server-only";
import type { MessengerChannel } from "@/lib/onboarding-db";

/**
 * Формирование прокси-ссылки Salebot: в неё кладём GET-параметры (id нашей БД,
 * email, имя, фамилия), Salebot сохранит их как переменные клиента и заведёт
 * человека в нужного бота. Обратная синхронизация (запись telegram_id/vk_id/
 * max_id в app_users) делается вебхуком из воронки Salebot — см. будущий
 * маршрут /api/salebot/link.
 *
 * ЗАГЛУШКА: базовые прокси-ссылки для каждого бота ещё не получены от Salebot.
 * Как только пришлёшь их (или API-ключ) — подставить в SALEBOT_PROXY_BASE.
 */
const SALEBOT_PROXY_BASE: Record<MessengerChannel, string> = {
  telegram: "https://salebot.pro/proxy/PLACEHOLDER_TG",
  vk: "https://salebot.pro/proxy/PLACEHOLDER_VK",
  max: "https://salebot.pro/proxy/PLACEHOLDER_MAX",
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
