"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/user-session";
import {
  closeBotHelpRequest,
  getBotHelpRequest,
} from "@/lib/bot-help";
import {
  getAppUserByEmail,
  upsertUserForRequest,
  markMessengerConnected,
} from "@/lib/onboarding-db";
import { createLoginLink } from "@/lib/login-links";
import { sendLoginLinkViaSalebot } from "@/lib/salebot";
import { recordConsent, DOC_VERSION } from "@/lib/consents";

/**
 * Кабинет по заявке из бота.
 *
 * Человек не смог получить код на почту и написал нам. Здесь ему заводят
 * кабинет руками и отправляют в тот же чат одноразовую ссылку для входа.
 */

export type CreateResult =
  | { ok: true; sent: boolean; url: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createAccountForRequest(input: {
  requestId: string;
  email: string;
  firstName: string;
  lastName: string;
}): Promise<CreateResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Нужны права администратора." };

  const email = input.email.trim().toLowerCase();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Проверьте адрес почты." };
  if (firstName.length < 2) return { ok: false, error: "Укажите имя." };

  const req = await getBotHelpRequest(input.requestId);
  if (!req) return { ok: false, error: "Заявка не найдена." };

  const existing = await getAppUserByEmail(email);
  const user = await upsertUserForRequest(email, firstName, lastName, {
    utm_source: "bot",
  });

  // Согласие на обработку данных человек даёт на форме сам. Здесь кабинет
  // заводит администратор, поэтому отметку ставим от его имени и с текущей
  // редакцией документа — иначе в базе не останется следа вовсе.
  if (!existing) {
    await recordConsent({
      userId: user.id,
      kind: "personal_data",
      docVersion: DOC_VERSION.personalData,
    });
  }

  // Привязываем бота, из которого пришла заявка: в следующий раз человек
  // получит код прямо туда и писать нам больше не понадобится.
  await markMessengerConnected({
    appId: user.id,
    channel: req.channel,
    salebotClientId: req.salebotClientId,
  });

  const link = await createLoginLink(user.id, "bot");
  const sent = await sendLoginLinkViaSalebot({
    clientId: req.salebotClientId,
    url: link.url,
  });

  await closeBotHelpRequest(req.id, "done", user.id);
  revalidatePath("/admin/requests");

  return { ok: true, sent: sent.ok, url: link.url };
}

/** Заявка не по делу или дубль — просто закрываем. */
export async function declineRequest(requestId: string): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin) return;
  await closeBotHelpRequest(requestId, "declined");
  revalidatePath("/admin/requests");
}

/** Выдать новую ссылку тому, у кого кабинет уже есть (первая истекла). */
export async function resendLoginLink(input: {
  requestId: string;
}): Promise<CreateResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: "Нужны права администратора." };

  const req = await getBotHelpRequest(input.requestId);
  if (!req?.userId) return { ok: false, error: "У заявки нет кабинета." };

  const link = await createLoginLink(req.userId, "bot");
  const sent = await sendLoginLinkViaSalebot({
    clientId: req.salebotClientId,
    url: link.url,
  });
  return { ok: true, sent: sent.ok, url: link.url };
}
