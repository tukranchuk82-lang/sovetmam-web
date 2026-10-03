"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { REGIONS } from "@/lib/measures";
import { REGION_COOKIE, REGION_COOKIE_MAX_AGE } from "@/lib/region";
import { getUserChatRegion } from "@/lib/chat-region";
import { after } from "next/server";
import { getCurrentAppUser } from "@/lib/user-session";
import { addMessage } from "@/lib/coordinator-chat-db";
import { notifyCoordinatorsAboutUserMessage } from "@/lib/coordinator-notify";
import {
  setCoordinatorChatNotifyChannel,
  setChatNotifyEmail,
  setChatNotifyMessenger,
  markChatNotifyAsked,
  type MessengerChannel,
} from "@/lib/onboarding-db";
import type { ChatSendState } from "@/components/coordinator-chat-thread";

export async function sendCoordinatorChatMessageAction(
  _prev: ChatSendState,
  fd: FormData,
): Promise<ChatSendState> {
  const user = await getCurrentAppUser();
  if (!user) return { error: "Войдите, чтобы написать координатору", ok: false };

  const region = await getUserChatRegion(user);
  if (!region) return { error: "Сначала выберите регион", ok: false };

  const body = String(fd.get("body") ?? "").trim();
  if (body.length < 2) return { error: "Напишите сообщение", ok: false };

  const message = await addMessage({ userId: user.id, region, author: "user", body });
  if (!message) return { error: "Не получилось отправить сообщение", ok: false };

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  after(() => notifyCoordinatorsAboutUserMessage(region, user.id, fullName, body));

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

function refreshChatPages() {
  revalidatePath("/profile/coordinator-chat");
  revalidatePath("/profile");
  revalidatePath("/admin/region-chat");
  revalidatePath("/admin/region-chat/[userId]", "page");
}

/** Письма о сообщениях чата — включить или выключить. */
export async function setChatNotifyEmailAction(on: boolean): Promise<void> {
  const user = await getCurrentAppUser();
  if (!user) return;
  await setChatNotifyEmail(user.id, on);
  refreshChatPages();
}

/** Сообщения от бота о сообщениях чата — включить или выключить. */
export async function setChatNotifyMessengerAction(on: boolean): Promise<void> {
  const user = await getCurrentAppUser();
  if (!user) return;
  await setChatNotifyMessenger(user.id, on);
  refreshChatPages();
}

/** «Не сейчас»: закрыть предложение про уведомления, не включая ничего. */
export async function dismissChatNotifyAction(): Promise<void> {
  const user = await getCurrentAppUser();
  if (!user) return;
  await markChatNotifyAsked(user.id);
  refreshChatPages();
}

/** Запоминает регион, выбранный человеком, и ведёт дальше. */
export async function chooseChatRegionAction(fd: FormData): Promise<void> {
  const region = String(fd.get("region") ?? "");
  const rawNext = String(fd.get("next") ?? "");
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/profile/coordinator-chat";
  if ((REGIONS as readonly string[]).includes(region)) {
    const c = await cookies();
    c.set(REGION_COOKIE, region, { maxAge: REGION_COOKIE_MAX_AGE, path: "/", sameSite: "lax" });
  }
  redirect(next);
}
