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
  // VK Mini App — ссылка с hash-фрагментом (#...), параметры кладём в фрагмент.
  vk: "https://vk.ru/app7062840#847c2b0819df8b14819a25d79c47d0a2&force=1",
  max: "https://s.salebot.pro/847c2b0819df8b14819a25d79c47d0a2_20",
};

export function buildSalebotProxyLink(
  channel: MessengerChannel,
  user: { id: string; email: string; firstName: string; lastName: string },
): string {
  const base = SALEBOT_PROXY_BASE[channel];
  const params: Record<string, string> = {
    app_id: user.id,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
  };
  const enc = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  // Ссылка с hash-фрагментом (VK) — добавляем параметры в фрагмент через «&».
  // Остальные — обычные query-параметры через «?».
  return base.includes("#") ? `${base}&${enc}` : `${base}?${enc}`;
}

/**
 * Уведомление в мессенджер через Salebot.
 *
 * Мы не составляем текст сообщения — его собирает воронка на стороне Salebot.
 * Наше дело: дёрнуть клиента по его salebot_client_id, передать кодовое слово
 * (по нему в Salebot стартует нужный блок) и переменные, которые в этом блоке
 * можно подставить в текст: тема обращения и ссылка на ответ в приложении.
 *
 * Ошибки наружу не бросаем: не доставленное уведомление не повод ронять
 * сохранение ответа — ответ уже лежит в базе и виден человеку в приложении.
 */
export async function notifySalebotAnswer(params: {
  clientId: string;
  subject: string;
  link: string;
}): Promise<{ ok: boolean; detail: string }> {
  const key = process.env.SALEBOT_API_KEY;
  if (!key) return { ok: false, detail: "SALEBOT_API_KEY не задан" };

  // Кодовое слово, по которому в Salebot стартует блок с уведомлением.
  const trigger = process.env.SALEBOT_ANSWER_TRIGGER ?? "new_answer";

  try {
    const res = await fetch(`https://chatter.salebot.pro/api/${key}/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: params.clientId,
        message: trigger,
        // Переменные клиента — их видно в блоке Salebot как #{inquiry_subject}
        // и #{inquiry_link}.
        inquiry_subject: params.subject,
        inquiry_link: params.link,
      }),
    });
    const text = await res.text();
    return { ok: res.ok, detail: `${res.status} ${text.slice(0, 300)}` };
  } catch (e) {
    return { ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}
