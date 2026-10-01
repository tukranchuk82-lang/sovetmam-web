import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { absoluteUrl } from "@/lib/site";
import { notifyCoordinatorChatReply } from "@/lib/salebot";
import { sendCoordinatorChatReplyEmail, sendCoordinatorChatNewMessageEmail } from "@/lib/notify/email";
import { listCoordinatorEmailsForRegion } from "@/lib/staff-db";

/**
 * Уведомления по внутреннему чату «пользователь ↔ координатор региона».
 *
 * Ничего отсюда не бросаем наружу — письмо или сообщение в мессенджер вещь
 * побочная: сама переписка уже сохранена и видна в кабинете/админке, даже
 * если уведомление не дошло (см. тот же приём в lib/inquiry-notify.ts).
 */

function log(msg: string): void {
  console.log(`[Чат с координатором] ${msg}`);
}

const CHAT_LINK = absoluteUrl("/profile/coordinator-chat");

/**
 * Координатор ответил — уведомляем пользователя ровно тем ОДНИМ каналом,
 * который он сам выбрал в кабинете (coordinator_chat_notify_channel). Ничего
 * не выбрано — молчим: чат и бейдж в кабинете остаются единственным способом
 * узнать об ответе, это осознанный выбор человека.
 */
export async function notifyUserAboutCoordinatorReply(
  userId: string,
  region: string,
  preview: string,
): Promise<void> {
  try {
    const sb = createSupabaseAdminClient();
    const { data: user } = await sb
      .from("app_users")
      .select("email, salebot_client_id, coordinator_chat_notify_channel")
      .eq("id", userId)
      .maybeSingle();
    if (!user) return;

    const channel = user.coordinator_chat_notify_channel as string | null;
    if (!channel) {
      log("уведомления выключены пользователем — молчим");
      return;
    }

    if (channel === "email") {
      const email = user.email as string | null;
      if (!email) {
        log("выбрана почта, но её нет у пользователя");
        return;
      }
      await sendCoordinatorChatReplyEmail(email, { region, preview }, CHAT_LINK);
      log(`письмо отправлено: ${email}`);
      return;
    }

    const salebotClientId = user.salebot_client_id as string | null;
    if (!salebotClientId) {
      log(`выбран мессенджер «${channel}», но он не подключён`);
      return;
    }
    const res = await notifyCoordinatorChatReply({ clientId: salebotClientId, link: CHAT_LINK });
    log(`уведомление в мессенджер: ${res.ok ? "ок" : "не ушло"} — ${res.detail}`);
  } catch (e) {
    log(`сбой уведомления пользователя: ${e instanceof Error ? e.message : e}`);
  }
}

/**
 * Пользователь написал — уведомляем координаторов региона на почту (так же,
 * как владельцам уходят письма о новых обращениях). Прямого бота-уведомления
 * координатору пока нет — это отдельная инфраструктура (свой Telegram-бот),
 * не входящая в этот заход.
 */
export async function notifyCoordinatorsAboutUserMessage(
  region: string,
  userName: string,
  preview: string,
): Promise<void> {
  try {
    const emails = await listCoordinatorEmailsForRegion(region);
    if (emails.length === 0) {
      log(`некому отправлять: у региона «${region}» нет координатора с почтой`);
      return;
    }
    for (const to of emails) {
      try {
        await sendCoordinatorChatNewMessageEmail(
          to,
          { region, userName, preview },
          absoluteUrl("/admin/region-chat"),
        );
        log(`письмо координатору отправлено: ${to}`);
      } catch (e) {
        log(`письмо не ушло на ${to}: ${e instanceof Error ? e.message : e}`);
      }
    }
  } catch (e) {
    log(`сбой уведомления координаторов: ${e instanceof Error ? e.message : e}`);
  }
}
