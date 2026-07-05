"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/user-session";
import { respondToInquiry } from "@/lib/inquiries-db";

export async function replyInquiryAction(inquiryId: string, fd: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/admin/inquiries");
  const respondedByName = `${admin.firstName} ${admin.lastName}`.trim();

  const response = String(fd.get("response") ?? "").trim();
  if (!response) throw new Error("Ответ не может быть пустым");

  await respondToInquiry(inquiryId, response, respondedByName);

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath("/profile");
  revalidatePath(`/profile/inquiries/${inquiryId}`);
  redirect("/admin/inquiries");
}
