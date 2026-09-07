import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendPushToUser } from "@/lib/push";
import { notifyAdminsSalebot } from "@/lib/salebot";
import { appUrl } from "@/lib/inquiry-token";
import type { MessengerChannel } from "@/lib/onboarding-db";

/**
 * Заявки на создание кабинета из ботов.
 *
 * Человек не получил код на почту, нажал в приложении «напишите нам» и попал
 * в бота. Воронка Salebot сообщает нам об этом, заявка появляется в админке,
 * и по ней вручную заводят кабинет.
 *
 * Уведомления шлём сразу в два места: веб-пуш в приложение и сообщение в
 * Telegram — заявка ждать не должна, человек в этот момент сидит без входа.
 */

export interface BotHelpRequest {
  id: string;
  salebotClientId: string;
  channel: MessengerChannel;
  name: string | null;
  username: string | null;
  note: string | null;
  status: "new" | "done" | "declined";
  userId: string | null;
  handledAt: string | null;
  createdAt: string;
}

type Row = {
  id: string;
  salebot_client_id: string;
  channel: MessengerChannel;
  name: string | null;
  username: string | null;
  note: string | null;
  status: BotHelpRequest["status"];
  user_id: string | null;
  handled_at: string | null;
  created_at: string;
};

const fromRow = (r: Row): BotHelpRequest => ({
  id: r.id,
  salebotClientId: r.salebot_client_id,
  channel: r.channel,
  name: r.name,
  username: r.username,
  note: r.note,
  status: r.status,
  userId: r.user_id,
  handledAt: r.handled_at,
  createdAt: r.created_at,
});

export const CHANNEL_LABEL: Record<MessengerChannel, string> = {
  telegram: "Telegram",
  vk: "ВКонтакте",
  max: "MAX",
};

/**
 * Записывает заявку. Если у клиента уже есть незакрытая заявка, новую не
 * создаём: человек мог написать боту несколько раз подряд, а в списке от
 * этого должна остаться одна строка.
 */
export async function createBotHelpRequest(input: {
  salebotClientId: string;
  channel: MessengerChannel;
  name?: string | null;
  username?: string | null;
  note?: string | null;
}): Promise<{ created: boolean; id: string | null }> {
  const sb = createSupabaseAdminClient();

  const { data: open } = await sb
    .from("bot_help_requests")
    .select("id")
    .eq("salebot_client_id", input.salebotClientId)
    .eq("status", "new")
    .maybeSingle();
  if (open) return { created: false, id: open.id as string };

  const { data, error } = await sb
    .from("bot_help_requests")
    .insert({
      salebot_client_id: input.salebotClientId,
      channel: input.channel,
      name: input.name ?? null,
      username: input.username ?? null,
      note: input.note ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  await notifyNewRequest({
    name: input.name ?? null,
    channel: input.channel,
  });
  return { created: true, id: data.id as string };
}

/** Уведомление о новой заявке: пуш в приложение и сообщение в Telegram. */
async function notifyNewRequest(req: {
  name: string | null;
  channel: MessengerChannel;
}): Promise<void> {
  const sb = createSupabaseAdminClient();
  const { data: admins } = await sb
    .from("app_users")
    .select("id, salebot_client_id, telegram_id")
    .in("role", ["owner", "tech"]);

  const who = req.name?.trim() || "Человек";
  const title = "Заявка на кабинет";
  const body = `${who} написал в ${CHANNEL_LABEL[req.channel]} — кабинета нет, ждёт входа`;

  for (const a of (admins ?? []) as {
    id: string;
    salebot_client_id: string | null;
    telegram_id: number | null;
  }[]) {
    // В приложение — веб-пуш (у кого включены уведомления).
    await sendPushToUser(a.id, {
      title,
      body,
      url: `${appUrl()}/admin/requests`,
    }).catch(() => undefined);

    // В Telegram — сообщением от нашего бота.
    if (a.salebot_client_id && a.telegram_id != null) {
      await notifyAdminsSalebot({
        clientId: a.salebot_client_id,
        text: `${title}: ${body}`,
        link: `${appUrl()}/admin/requests`,
      });
    }
  }
}

/** Список заявок для админки: новые сверху. */
export async function listBotHelpRequests(): Promise<BotHelpRequest[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("bot_help_requests")
    .select("*")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

/** Сколько заявок ждёт ответа — для кружка в меню админки. */
export async function countNewBotHelpRequests(): Promise<number> {
  const sb = createSupabaseAdminClient();
  const { count } = await sb
    .from("bot_help_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");
  return count ?? 0;
}

/** Закрывает заявку: кабинет заведён или человеку отказали. */
export async function closeBotHelpRequest(
  id: string,
  status: "done" | "declined",
  userId?: string,
): Promise<void> {
  const sb = createSupabaseAdminClient();
  await sb
    .from("bot_help_requests")
    .update({
      status,
      user_id: userId ?? null,
      handled_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export async function getBotHelpRequest(id: string): Promise<BotHelpRequest | null> {
  const sb = createSupabaseAdminClient();
  const { data } = await sb.from("bot_help_requests").select("*").eq("id", id).maybeSingle();
  return data ? fromRow(data as Row) : null;
}
