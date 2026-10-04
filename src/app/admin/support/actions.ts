"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getCurrentStaff } from "@/lib/user-session";
import { addSupportMessage, markLastCoordinatorMessageUnread } from "@/lib/support-chat-db";
import { notifyTechAboutSupportMessage, notifyCoordinatorAboutSupportReply } from "@/lib/support-notify";
import type { ChatSendState } from "@/components/coordinator-chat-thread";

function refresh(coordinatorId: string) {
  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${coordinatorId}`);
}

/** Координатор пишет в техподдержку — только от своего имени. */
export async function sendSupportMessageAction(_prev: ChatSendState, fd: FormData): Promise<ChatSendState> {
  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "coordinator") return { error: "Писать в техподдержку могут координаторы", ok: false };

  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 2) return { error: "Напишите сообщение", ok: false };

  const saved = await addSupportMessage({ coordinatorId: staff.id, author: "coordinator", authorId: staff.id, body });
  if (!saved) return { error: "Не получилось отправить сообщение", ok: false };

  const name = `${staff.firstName} ${staff.lastName}`.trim() || staff.email;
  after(() => notifyTechAboutSupportMessage(staff.id, name, staff.region, body));
  refresh(staff.id);
  return { error: null, ok: true };
}

/** Техспец или владелец отвечает координатору. */
export async function sendSupportReplyAction(
  coordinatorId: string,
  _prev: ChatSendState,
  fd: FormData,
): Promise<ChatSendState> {
  const staff = await getCurrentStaff();
  if (!staff || (staff.role !== "tech" && staff.role !== "owner")) {
    return { error: "Отвечать могут техспец и владелец", ok: false };
  }

  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 2) return { error: "Напишите сообщение", ok: false };

  const saved = await addSupportMessage({ coordinatorId, author: "tech", authorId: staff.id, body });
  if (!saved) return { error: "Не получилось отправить сообщение", ok: false };

  after(() => notifyCoordinatorAboutSupportReply(coordinatorId, body));
  refresh(coordinatorId);
  return { error: null, ok: true };
}

/** Техспец возвращает обращение в непрочитанные и уходит к списку. */
export async function markSupportUnreadAction(coordinatorId: string): Promise<void> {
  const staff = await getCurrentStaff();
  if (!staff || (staff.role !== "tech" && staff.role !== "owner")) return;
  await markLastCoordinatorMessageUnread(coordinatorId);
  revalidatePath("/admin/support");
  revalidatePath("/admin/support/[coordinatorId]", "page");
  redirect("/admin/support");
}
