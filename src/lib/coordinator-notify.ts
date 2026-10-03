import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { absoluteUrl } from "@/lib/site";
import { notifyCoordinatorChatReply, notifyStaffSalebot } from "@/lib/salebot";
import { sendCoordinatorChatReplyEmail, sendCoordinatorChatNewMessageEmail } from "@/lib/notify/email";
import { sendPushToUser } from "@/lib/push";
import { countUnreadForUser as countChatUnreadForUser, countUnreadForRegion } from "@/lib/coordinator-chat-db";
import { countUnreadForUser as countInquiryUnreadForUser } from "@/lib/inquiry-thread";

/**
 * Уведомления по внутреннему чату «человек ↔ координатор региона».
 *
 * Каналов три, и включаться они могут в любой комбинации:
 *  - пуш на устройство (есть, пока у человека есть подписка);
 *  - сообщение от бота в мессенджере (Telegram, MAX, ВКонтакте — какой
 *    подключён) — через Salebot;
 *  - письмо.
 * Те же правила действуют и для координатора: ему приходят уведомления о
 * новых вопросах теми же каналами.
 *
 * Ничего отсюда не бросаем наружу — уведомление вещь побочная: сама переписка
 * уже сохранена и видна в приложении, даже если оно не дошло.
 */

function log(msg: string): void {
  console.log(`[Чат с координатором] ${msg}`);
}

/** Куда ведёт ссылка в уведомлении человеку. */
export const USER_CHAT_PATH = "/profile/coordinator-chat";
/** Куда — координатору (с конкретной беседой). */
export function staffChatPath(userId: string): string {
  return `/admin/region-chat/${userId}`;
}

interface NotifyTarget {
  id: string;
  email: string | null;
  salebot_client_id: string | null;
  telegram_id: number | null;
  vk_id: number | null;
  max_id: string | null;
  coordinator_chat_notify_channel: string | null;
  chat_notify_messenger: boolean | null;
  chat_notify_email: boolean | null;
  chat_notify_asked_at: string | null;
}

export const TARGET_FIELDS =
  "id, email, salebot_client_id, telegram_id, vk_id, max_id, coordinator_chat_notify_channel, chat_notify_messenger, chat_notify_email, chat_notify_asked_at";

/**
 * Какими каналами писать человеку.
 *
 * Если он ещё не трогал новые настройки, но раньше выбрал один канал по-старому
 * (coordinator_chat_notify_channel), уважаем тот выбор. Иначе: почта включена,
 * пока её не выключили; бот — если мессенджер подключён и не выключен.
 */
export function resolveChannels(t: NotifyTarget): { email: boolean; messenger: boolean } {
  const hasMessenger = Boolean(t.salebot_client_id && (t.telegram_id || t.vk_id || t.max_id));
  const legacy = t.coordinator_chat_notify_channel;
  if (!t.chat_notify_asked_at && legacy) {
    return { email: legacy === "email" && Boolean(t.email), messenger: legacy !== "email" && hasMessenger };
  }
  return {
    email: t.chat_notify_email !== false && Boolean(t.email),
    messenger: hasMessenger && t.chat_notify_messenger !== false,
  };
}

/** Координатор ответил — уведомляем человека всеми включёнными им каналами. */
export async function notifyUserAboutCoordinatorReply(
  userId: string,
  region: string,
  preview: string,
): Promise<void> {
  try {
    const sb = createSupabaseAdminClient();
    const { data } = await sb.from("app_users").select(TARGET_FIELDS).eq("id", userId).maybeSingle();
    if (!data) return;
    const user = data as NotifyTarget;
    const link = absoluteUrl(USER_CHAT_PATH);
    const ch = resolveChannels(user);

    // Пуш — первым и независимо: он мгновенный и не зависит от остальных.
    try {
      const badge = (await countChatUnreadForUser(userId)) + (await countInquiryUnreadForUser(userId));
      const n = await sendPushToUser(userId, {
        title: "Координатор ответил вам",
        body: preview.slice(0, 140),
        url: USER_CHAT_PATH,
        badge,
      });
      if (n > 0) log(`пуш отправлен на ${n} устр.`);
    } catch (e) {
      log(`пуш не ушёл: ${e instanceof Error ? e.message : e}`);
    }

    if (ch.messenger && user.salebot_client_id) {
      const res = await notifyCoordinatorChatReply({ clientId: user.salebot_client_id, link });
      log(`бот: ${res.ok ? "ок" : "не ушло"} — ${res.detail}`);
    }
    if (ch.email && user.email) {
      try {
        await sendCoordinatorChatReplyEmail(user.email, { region, preview }, link);
        log(`письмо отправлено: ${user.email}`);
      } catch (e) {
        log(`письмо не ушло: ${e instanceof Error ? e.message : e}`);
      }
    }
  } catch (e) {
    log(`сбой уведомления пользователя: ${e instanceof Error ? e.message : e}`);
  }
}

/**
 * Человек написал — уведомляем координаторов региона теми же каналами. Если в
 * регионе координатора нет, чата у людей и не будет, так что сюда не доходим.
 */
export async function notifyCoordinatorsAboutUserMessage(
  region: string,
  userId: string,
  userName: string,
  preview: string,
): Promise<void> {
  try {
    const sb = createSupabaseAdminClient();
    const { data } = await sb
      .from("app_users")
      .select(TARGET_FIELDS)
      .eq("role", "coordinator")
      .eq("region", region);
    const coordinators = (data ?? []) as NotifyTarget[];
    if (coordinators.length === 0) {
      log(`некому сообщать: у региона «${region}» нет координатора`);
      return;
    }

    const path = staffChatPath(userId);
    const link = absoluteUrl(path);
    const badge = await countUnreadForRegion(region);

    for (const c of coordinators) {
      const ch = resolveChannels(c);
      try {
        await sendPushToUser(c.id, {
          title: `${userName}: новый вопрос`,
          body: preview.slice(0, 140),
          url: path,
          badge,
        });
      } catch (e) {
        log(`пуш координатору не ушёл: ${e instanceof Error ? e.message : e}`);
      }
      if (ch.messenger && c.salebot_client_id) {
        const res = await notifyStaffSalebot({
          clientId: c.salebot_client_id,
          text: `${userName} написал(а) в чате: ${preview.slice(0, 200)}`,
          link,
        });
        log(`бот координатору: ${res.ok ? "ок" : "не ушло"} — ${res.detail}`);
      }
      if (ch.email && c.email) {
        try {
          await sendCoordinatorChatNewMessageEmail(c.email, { region, userName, preview }, link);
          log(`письмо координатору отправлено: ${c.email}`);
        } catch (e) {
          log(`письмо не ушло на ${c.email}: ${e instanceof Error ? e.message : e}`);
        }
      }
    }
  } catch (e) {
    log(`сбой уведомления координаторов: ${e instanceof Error ? e.message : e}`);
  }
}
