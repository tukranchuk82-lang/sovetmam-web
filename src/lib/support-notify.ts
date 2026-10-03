import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { absoluteUrl } from "@/lib/site";
import { notifyStaffSalebot } from "@/lib/salebot";
import { sendPushToUser } from "@/lib/push";
import { sendSupportEmail } from "@/lib/notify/email";
import { resolveChannels, TARGET_FIELDS } from "@/lib/coordinator-notify";
import { countUnreadForCoordinator, countWaitingForTech } from "@/lib/support-chat-db";

/**
 * Уведомления в чате «координатор ↔ техподдержка».
 *
 * Координатор написал — сообщаем техспецам (а если техспецов нет, то владельцам):
 * пушем, сообщением от бота в мессенджере (Salebot) и письмом — теми каналами,
 * которые каждый включил себе. К сообщению прилагается ссылка прямо на эту
 * переписку. Техспец ответил — те же каналы у координатора, ссылка на чат.
 *
 * Ничего не бросаем наружу: сама переписка уже сохранена и видна в приложении.
 */

function log(msg: string): void {
  console.log(`[Техподдержка] ${msg}`);
}

export const SUPPORT_PATH = "/admin/support";

interface Target {
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

async function deliver(
  t: Target,
  opts: { title: string; text: string; path: string; badge: number; emailSubject: string },
): Promise<void> {
  const link = absoluteUrl(opts.path);
  const ch = resolveChannels(t);
  try {
    await sendPushToUser(t.id, { title: opts.title, body: opts.text.slice(0, 140), url: opts.path, badge: opts.badge });
  } catch (e) {
    log(`пуш не ушёл: ${e instanceof Error ? e.message : e}`);
  }
  if (ch.messenger && t.salebot_client_id) {
    const res = await notifyStaffSalebot({ clientId: t.salebot_client_id, text: `${opts.title}: ${opts.text.slice(0, 220)}`, link });
    log(`бот: ${res.ok ? "ок" : "не ушло"} — ${res.detail}`);
  }
  if (ch.email && t.email) {
    try {
      await sendSupportEmail(t.email, { subject: opts.emailSubject, text: opts.text }, link);
    } catch (e) {
      log(`письмо не ушло на ${t.email}: ${e instanceof Error ? e.message : e}`);
    }
  }
}

/** Координатор написал в техподдержку. */
export async function notifyTechAboutSupportMessage(
  coordinatorId: string,
  coordinatorName: string,
  region: string | null,
  preview: string,
): Promise<void> {
  try {
    const sb = createSupabaseAdminClient();
    let { data } = await sb.from("app_users").select(TARGET_FIELDS).eq("role", "tech");
    if (!data || data.length === 0) {
      ({ data } = await sb.from("app_users").select(TARGET_FIELDS).eq("role", "owner"));
    }
    const targets = (data ?? []) as Target[];
    if (targets.length === 0) {
      log("некому сообщать: нет ни техспеца, ни владельца");
      return;
    }
    const badge = await countWaitingForTech();
    const who = region ? `${coordinatorName} (${region})` : coordinatorName;
    for (const t of targets) {
      await deliver(t, {
        title: `Новое обращение в техподдержку от ${who}`,
        text: preview,
        path: `${SUPPORT_PATH}/${coordinatorId}`,
        badge,
        emailSubject: `Техподдержка: обращение от ${coordinatorName}`,
      });
    }
  } catch (e) {
    log(`сбой уведомления техподдержки: ${e instanceof Error ? e.message : e}`);
  }
}

/** Техспец ответил координатору. */
export async function notifyCoordinatorAboutSupportReply(coordinatorId: string, preview: string): Promise<void> {
  try {
    const sb = createSupabaseAdminClient();
    const { data } = await sb.from("app_users").select(TARGET_FIELDS).eq("id", coordinatorId).maybeSingle();
    if (!data) return;
    await deliver(data as Target, {
      title: "Техподдержка ответила вам",
      text: preview,
      path: SUPPORT_PATH,
      badge: await countUnreadForCoordinator(coordinatorId),
      emailSubject: "Техподдержка ответила вам",
    });
  } catch (e) {
    log(`сбой уведомления координатора: ${e instanceof Error ? e.message : e}`);
  }
}
