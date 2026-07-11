"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/user-session";
import { createInquiry, type InquiryType } from "@/lib/inquiries-db";

export async function createInquiryAction(fd: FormData) {
  const user = await getCurrentAppUser();
  // Обращения оставляют только авторизованные пользователи с подтверждённой почтой.
  if (!user || !user.emailVerifiedAt) {
    redirect("/login?next=/profile/inquiries/new");
  }

  const type = String(fd.get("type") ?? "question") as InquiryType;
  const subject = String(fd.get("subject") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  const region = String(fd.get("region") ?? "").trim();
  const measureSlug = (fd.get("measureSlug") as string | null) || null;

  if (!subject || !body) {
    throw new Error("Заполните тему и текст обращения");
  }
  if (!region) {
    throw new Error("Укажите регион");
  }
  // У уточнения тема — это и есть мера, о которой речь: без неё обращение
  // бесполезно, разбирать будет нечего.
  if (type === "clarification" && !subject) {
    throw new Error("Укажите, о какой мере поддержки идёт речь");
  }

  await createInquiry({
    userId: user.id,
    userName: `${user.firstName} ${user.lastName}`.trim(),
    userChannel: user.messengerChoice, // канал для уведомления, если подключён
    region,
    type,
    subject,
    body,
    measureSlug: measureSlug || null,
  });

  revalidatePath("/profile");
  revalidatePath("/profile/inquiries");
  revalidatePath("/admin/inquiries");
  redirect("/profile");
}
