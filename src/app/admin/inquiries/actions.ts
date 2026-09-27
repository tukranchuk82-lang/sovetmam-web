"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getCurrentStaff } from "@/lib/user-session";
import type { AppUser } from "@/lib/onboarding-db";
import {
  getInquiry,
  listAllInquiries,
  respondToInquiry,
} from "@/lib/inquiries-db";
import {
  notifyStaffAboutInquiry,
  notifyUserAboutAnswer,
} from "@/lib/inquiry-notify";

/**
 * Координатор — только обращения своего региона; владелец/техспец — любые.
 * Бросает, если координатор пытается дотянуться до чужого региона (прямым
 * запросом, минуя интерфейс, где такого обращения ему просто не покажут).
 */
async function authorizeInquiry(inquiryId: string): Promise<{
  staff: AppUser;
  inquiryRegion: string | null;
}> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/inquiries");

  const inquiry = await getInquiry(inquiryId);
  if (!inquiry) throw new Error("Обращение не найдено");

  if (staff.role === "coordinator" && inquiry.region !== staff.region) {
    throw new Error("Это обращение не из вашего региона");
  }

  return { staff, inquiryRegion: inquiry.region };
}

export async function replyInquiryAction(inquiryId: string, fd: FormData) {
  const { staff } = await authorizeInquiry(inquiryId);
  const respondedByName = `${staff.firstName} ${staff.lastName}`.trim();

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
  await authorizeInquiry(inquiryId);

  const inquiry = await getInquiry(inquiryId);
  if (!inquiry) throw new Error("Обращение не найдено");

  after(() => notifyStaffAboutInquiry(inquiry));

  revalidatePath(`/admin/inquiries/${inquiryId}`);
  redirect(`/admin/inquiries/${inquiryId}?sent=1`);
}

/** Разослать письма по всем неотвеченным обращениям — разом (координатору — только по своему региону). */
export async function resendAllNewInquiriesAction() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/inquiries");

  const all = await listAllInquiries(
    staff.role === "coordinator" ? (staff.region ?? undefined) : undefined,
  );
  const pending = all.filter((i) => i.status === "new");

  after(async () => {
    for (const inquiry of pending) {
      await notifyStaffAboutInquiry(inquiry);
    }
  });

  revalidatePath("/admin/inquiries");
  redirect(`/admin/inquiries?sent=${pending.length}`);
}
