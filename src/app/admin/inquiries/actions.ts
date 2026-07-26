"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getCurrentAdmin } from "@/lib/user-session";
import {
  getInquiry,
  listAllInquiries,
  respondToInquiry,
} from "@/lib/inquiries-db";
import {
  notifyStaffAboutInquiry,
  notifyUserAboutAnswer,
} from "@/lib/inquiry-notify";

export async function replyInquiryAction(inquiryId: string, fd: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/admin/inquiries");
  const respondedByName = `${admin.firstName} ${admin.lastName}`.trim();

  const response = String(fd.get("response") ?? "").trim();
  if (!response) throw new Error("Ответ не может быть пустым");

  await respondToInquiry(inquiryId, response, respondedByName);

  // Уведомления шлём после ответа страницы — почта и Salebot не должны
  // задерживать переход к списку обращений.
  after(async () => {
    const fresh = await getInquiry(inquiryId);
    if (fresh) await notifyUserAboutAnswer(fresh);
  });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath("/profile");
  revalidatePath(`/profile/inquiries/${inquiryId}`);
  redirect("/admin/inquiries");
}

/**
 * Отправить письмо по обращению ещё раз.
 *
 * Нужно в двух случаях: письмо потерялось (попало в спам, почта лежала) и
 * при переходе на новую схему — старые обращения писем ещё не получали.
 */
export async function resendInquiryEmailAction(inquiryId: string) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/admin/inquiries");

  const inquiry = await getInquiry(inquiryId);
  if (!inquiry) throw new Error("Обращение не найдено");

  after(() => notifyStaffAboutInquiry(inquiry));

  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirect(`/admin/inquiries/${inquiryId}?sent=1`);
}

/** Разослать письма по всем неотвеченным обращениям — разом. */
export async function resendAllNewInquiriesAction() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/admin/inquiries");

  const all = await listAllInquiries();
  const pending = all.filter((i) => i.status === "new");

  after(async () => {
    for (const inquiry of pending) {
      await notifyStaffAboutInquiry(inquiry);
    }
  });

  revalidatePath("/admin/inquiries");
  redirect(`/admin/inquiries?sent=${pending.length}`);
}
