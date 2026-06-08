"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentDemoUser } from "@/lib/demo-auth";
import { createInquiry, type InquiryType } from "@/lib/inquiries-db";

export async function createInquiryAction(fd: FormData) {
  const user = await getCurrentDemoUser();
  if (!user) {
    redirect("/login");
  }

  const type = String(fd.get("type") ?? "question") as InquiryType;
  const subject = String(fd.get("subject") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  const measureSlug = (fd.get("measureSlug") as string | null) || null;

  if (!subject || !body) {
    throw new Error("Заполните тему и текст обращения");
  }

  await createInquiry({
    userId: user.id,
    userName: user.name,
    userChannel: user.channel,
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
