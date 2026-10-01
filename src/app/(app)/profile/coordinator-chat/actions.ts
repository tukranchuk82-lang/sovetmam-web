"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getCurrentAppUser } from "@/lib/user-session";
import { addMessage } from "@/lib/coordinator-chat-db";
import { notifyCoordinatorsAboutUserMessage } from "@/lib/coordinator-notify";
import { setCoordinatorChatNotifyChannel, type MessengerChannel } from "@/lib/onboarding-db";
import type { ChatSendState } from "@/components/coordinator-chat-thread";

export async function sendCoordinatorChatMessageAction(
  _prev: ChatSendState,
  fd: FormData,
): Promise<ChatSendState> {
  const user = await getCurrentAppUser();
  if (!user) return { error: "Войдите, чтобы написать координатору", ok: false };

  const region = typeof user.survey?.region === "string" ? user.survey.region : null;
  if (!region) return { error: "Сначала укажите регион в анкете", ok: false };

  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 2) return { error: "Напишите сообщение", ok: false };

  const message = await addMessage({ userId: user.id, region, author: "user", body });
  if (!message) return { error: "Не получилось отправить сообщение", ok: false };

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  after(() => notifyCoordinatorsAboutUserMessage(region, fullName, body));

  revalidatePath("/profile/coordinator-chat");
  revalidatePath("/profile");
  revalidatePath("/admin/region-chat");
  return { error: null, ok: true };
}

/** Один канал уведомлений о новом ответе координатора — null выключает их. */
export async function setCoordinatorChatNotifyChannelAction(
  channel: MessengerChannel | "email" | null,
): Promise<void> {
  const user = await getCurrentAppUser();
  if (!user) return;
  await setCoordinatorChatNotifyChannel(user.id, channel);
  revalidatePath("/profile");
}
