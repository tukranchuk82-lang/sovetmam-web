"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { respondToInquiry } from "@/lib/inquiries-db";

export async function replyInquiryAction(inquiryId: string, fd: FormData) {
  const admin = await getCurrentDemoUser();
  const respondedByName = admin?.name ?? "Заказчик";

  const response = String(fd.get("response") ?? "").trim();
  if (!response) throw new Error("Ответ не может быть пустым");

  await respondToInquiry(inquiryId, response, respondedByName);

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath("/profile");
  revalidatePath(`/profile/inquiries/${inquiryId}`);
  redirect("/admin/inquiries");
}
