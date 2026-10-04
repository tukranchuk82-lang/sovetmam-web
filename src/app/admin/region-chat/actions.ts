"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getCurrentStaff } from "@/lib/user-session";
import { getAppUserById } from "@/lib/onboarding-db";
import { getThreadRegion } from "@/lib/chat-region";
import { addMessage, markLastUserMessageUnread } from "@/lib/coordinator-chat-db";
import { notifyUserAboutCoordinatorReply } from "@/lib/coordinator-notify";
import type { ChatSendState } from "@/components/coordinator-chat-thread";

/** Координатор — только беседы своего региона; владелец/техспец — любые. */
async function authorize(targetUserId: string): Promise<{ region: string }> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin/region-chat");

  const target = await getAppUserById(targetUserId);
  const region = await getThreadRegion(targetUserId, target);
  if (!region) throw new Error("У этого человека не указан регион");

  if (staff.role === "coordinator" && region !== staff.region) {
    throw new Error("Эта беседа не из вашего региона");
  }
  return { region };
}

export async function sendCoordinatorReplyAction(
  targetUserId: string,
  _prev: ChatSendState,
  fd: FormData,
): Promise<ChatSendState> {
  const { region } = await authorize(targetUserId);

  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 2) return { error: "Напишите сообщение", ok: false };

  const message = await addMessage({ userId: targetUserId, region, author: "coordinator", body });
  if (!message) return { error: "Не получилось отправить сообщение", ok: false };

  after(() => notifyUserAboutCoordinatorReply(targetUserId, region, body));

  revalidatePath(`/admin/region-chat/${targetUserId}`);
  revalidatePath("/admin/region-chat");
  revalidatePath("/profile/coordinator-chat");
  revalidatePath("/profile");
  return { error: null, ok: true };
}

/** Вернуть беседу в непрочитанные и уйти к списку — чтобы вернуться к ней позже. */
export async function markConversationUnreadAction(targetUserId: string): Promise<void> {
  await authorize(targetUserId);
  await markLastUserMessageUnread(targetUserId);
  revalidatePath("/admin/region-chat");
  revalidatePath("/admin/region-chat/[userId]", "page");
  redirect("/admin/region-chat");
}
