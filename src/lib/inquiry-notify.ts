import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { INQUIRY_TYPE_LABEL } from "@/lib/inquiries";
import { getMeasureBySlug } from "@/lib/measures-db";
import { sendNewInquiryEmail, sendInquiryAnswerEmail } from "@/lib/notify/email";
import { notifySalebotAnswer } from "@/lib/salebot";
import { appUrl, buildReplyUrl } from "@/lib/inquiry-token";
import type { Inquiry } from "@/lib/inquiries-db";

/**
 * Уведомления по обращениям.
 *
 * Ничего отсюда не бросаем наружу: письмо или сообщение в мессенджер — вещь
 * побочная. Если почта не ушла, обращение всё равно сохранено и видно в
 * админке, а ответ — в кабинете пользователя. Роняя форму из-за отвалившегося
 * SMTP, мы бы теряли само обращение.
 */

function log(msg: string): void {
  console.log(`[Обращения] ${msg}`);
}

/** Кому уходят письма о новых обращениях — всем владельцам. */
async function inquiryRecipients(): Promise<string[]> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("app_users")
    .select("email")
    .eq("role", "owner");
  if (error) {
    log(`не удалось получить список владельцев: ${error.message}`);
    return [];
  }
  return (data ?? []).map((r) => r.email as string).filter(Boolean);
}

async function userContacts(
  userId: string,
): Promise<{ email: string | null; salebotClientId: string | null }> {
  const sb = createSupabaseAdminClient();
  const { data, error } = await sb
    .from("app_users")
    .select("email, salebot_client_id")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return { email: null, salebotClientId: null };
  return {
    email: (data.email as string) || null,
    salebotClientId: (data.salebot_client_id as string | null) ?? null,
  };
}

/** Новое обращение — письмо тем, кто на них отвечает. */
export async function notifyStaffAboutInquiry(inquiry: Inquiry): Promise<void> {
  try {
    const recipients = await inquiryRecipients();
    if (recipients.length === 0) {
      log("некому отправлять: владельцев с почтой не нашлось");
      return;
    }

    const { email: userEmail } = await userContacts(inquiry.userId);
    const measure = inquiry.measureSlug
      ? await getMeasureBySlug(inquiry.measureSlug).catch(() => null)
      : null;

    const data = {
      userName: inquiry.userName,
      userEmail: userEmail ?? "почта не указана",
      region: inquiry.region,
      typeLabel: INQUIRY_TYPE_LABEL[inquiry.type],
      subject: inquiry.subject,
      body: inquiry.body,
      measureTitle: measure?.title ?? null,
      createdAt: inquiry.createdAt,
    };
    const replyUrl = buildReplyUrl(inquiry.id);

    for (const to of recipients) {
      try {
        await sendNewInquiryEmail(to, data, replyUrl);
        log(`письмо о новом обращении отправлено: ${to}`);
      } catch (e) {
        log(`письмо не ушло на ${to}: ${e instanceof Error ? e.message : e}`);
      }
    }
  } catch (e) {
    log(`сбой уведомления о новом обращении: ${e instanceof Error ? e.message : e}`);
  }
}

/** На обращение ответили — уведомляем человека: почта плюс мессенджер. */
export async function notifyUserAboutAnswer(inquiry: Inquiry): Promise<void> {
  try {
    const { email, salebotClientId } = await userContacts(inquiry.userId);
    const link = `${appUrl()}/profile/inquiries/${inquiry.id}`;

    if (email) {
      try {
        await sendInquiryAnswerEmail(
          email,
          {
            subject: inquiry.subject,
            response: inquiry.response ?? "",
            answeredBy: inquiry.respondedByName
              ? `Ответила ${inquiry.respondedByName}`
              : "Команда «Совета матерей»",
          },
          link,
        );
        log(`письмо об ответе отправлено: ${email}`);
      } catch (e) {
        log(`письмо об ответе не ушло: ${e instanceof Error ? e.message : e}`);
      }
    }

    if (salebotClientId) {
      const res = await notifySalebotAnswer({
        clientId: salebotClientId,
        subject: inquiry.subject,
        link,
      });
      log(`уведомление в мессенджер: ${res.ok ? "ок" : "не ушло"} — ${res.detail}`);
    } else {
      log("мессенджер не подключён — уведомление только на почту");
    }
  } catch (e) {
    log(`сбой уведомления об ответе: ${e instanceof Error ? e.message : e}`);
  }
}
