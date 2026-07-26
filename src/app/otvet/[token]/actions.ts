"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getInquiry, respondToInquiry } from "@/lib/inquiries-db";
import { notifyUserAboutAnswer } from "@/lib/inquiry-notify";
import { verifyReplyToken } from "@/lib/inquiry-token";

/**
 * Ответ по одноразовой ссылке из письма — без входа в приложение.
 *
 * Право отвечать даёт сам токен: он подписан служебным ключом и привязан к
 * конкретному обращению. Поэтому проверяем его заново на отправке, а не
 * доверяем тому, что человек просто открыл страницу.
 */
export async function replyByTokenAction(token: string, fd: FormData) {
  const check = verifyReplyToken(token);
  if (!check.ok) redirect(`/otvet/${token}`);

  const response = String(fd.get("response") ?? "").trim();
  if (!response) throw new Error("Ответ не может быть пустым");

  const authorRaw = String(fd.get("author") ?? "").trim();
  const author = authorRaw || "Команда «Совета матерей»";

  await respondToInquiry(check.inquiryId, response, author);

  after(async () => {
    const fresh = await getInquiry(check.inquiryId);
    if (fresh) await notifyUserAboutAnswer(fresh);
  });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${check.inquiryId}`);
  revalidatePath("/profile");
  revalidatePath(`/profile/inquiries/${check.inquiryId}`);

  redirect(`/otvet/${token}?sent=1`);
}
