"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  upsertUserForRequest,
  issueOtp,
  verifyOtp,
  getAppUserByEmail,
  setMessengerChoice,
  channelConnected,
  disconnectMessengerChannel,
  saveSurvey,
  uploadAvatarFile,
  setAvatarImage,
  setAvatarEmoji,
  clearAvatar,
  type Utm,
  type MessengerChannel,
} from "@/lib/onboarding-db";
import { setUserSession, clearUserSession, getCurrentAppUser } from "@/lib/user-session";
import { sendOtpEmail } from "@/lib/notify/email";
import { buildSalebotProxyLink } from "@/lib/salebot";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UTM_COOKIE = "sm_utm";

async function readUtm(): Promise<Utm> {
  const c = await cookies();
  const raw = c.get(UTM_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Utm;
  } catch {
    return {};
  }
}

export type CheckEmailResult =
  | { ok: true; exists: boolean }
  | { ok: false; error: string };

/** Есть ли пользователь с таким email в базе (email-first развилка входа). */
export async function checkEmail(emailRaw: string): Promise<CheckEmailResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Проверьте адрес email." };
  const user = await getAppUserByEmail(email);
  return { ok: true, exists: Boolean(user) };
}

export type RequestCodeResult =
  | { ok: true; devCode?: string }
  | { ok: false; error: string };

/** Код для входа существующего пользователя (имя не запрашиваем). */
export async function sendLoginCode(emailRaw: string): Promise<RequestCodeResult> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Проверьте адрес email." };
  const user = await getAppUserByEmail(email);
  if (!user)
    return { ok: false, error: "Аккаунт с этой почтой не найден." };
  const code = await issueOtp(email);
  await sendOtpEmail(email, code);
  const devCode = process.env.NODE_ENV !== "production" ? code : undefined;
  return { ok: true, devCode };
}

export async function requestCode(input: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<RequestCodeResult> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();

  if (firstName.length < 2) return { ok: false, error: "Укажите имя." };
  if (lastName.length < 2) return { ok: false, error: "Укажите фамилию." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Проверьте адрес email." };

  const utm = await readUtm();
  await upsertUserForRequest(email, firstName, lastName, utm);
  const code = await issueOtp(email);
  await sendOtpEmail(email, code);

  // В dev показываем код на экране, чтобы поток можно было протестировать без
  // настроенной почты. В проде devCode не возвращаем.
  const devCode = process.env.NODE_ENV !== "production" ? code : undefined;
  return { ok: true, devCode };
}

export type VerifyCodeResult = { ok: true } | { ok: false; error: string };

export async function verifyCode(input: {
  email: string;
  code: string;
}): Promise<VerifyCodeResult> {
  const email = input.email.trim().toLowerCase();
  const code = input.code.trim();
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "Код состоит из 6 цифр." };

  const res = await verifyOtp(email, code);
  if (!res.ok) {
    const msg =
      res.reason === "expired"
        ? "Код истёк. Запросите новый."
        : res.reason === "too_many"
          ? "Слишком много попыток. Запросите новый код."
          : "Неверный код.";
    return { ok: false, error: msg };
  }

  const user = await getAppUserByEmail(email);
  if (!user) return { ok: false, error: "Пользователь не найден." };
  await setUserSession(user.id);
  return { ok: true };
}

/** Выбор мессенджера: сохраняем канал и отдаём прокси-ссылку Salebot. */
export async function chooseMessenger(
  channel: MessengerChannel,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await getCurrentAppUser();
  if (!user) return { ok: false, error: "Сессия не найдена. Войдите заново." };
  await setMessengerChoice(user.id, channel);
  const url = buildSalebotProxyLink(channel, {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  });
  return { ok: true, url };
}

/** Статус подключения мессенджеров текущего пользователя (для опроса). */
export async function messengerStatus(): Promise<{
  connected: boolean;
  channels: { telegram: boolean; vk: boolean; max: boolean };
}> {
  const user = await getCurrentAppUser();
  const on = (c: MessengerChannel) => (user ? channelConnected(user, c) : false);
  return {
    connected: Boolean(user?.messengerConnected),
    channels: { telegram: on("telegram"), vk: on("vk"), max: on("max") },
  };
}

/** Отключение канала мессенджера в личном кабинете. */
export async function disconnectMessengerAction(
  channel: MessengerChannel,
): Promise<{ ok: boolean }> {
  const user = await getCurrentAppUser();
  if (!user) return { ok: false };
  await disconnectMessengerChannel(user.id, channel);
  revalidatePath("/profile");
  return { ok: true };
}

/** Сохраняет ответы анкеты в профиль (только для залогиненного пользователя). */
export async function saveSurveyAction(
  survey: Record<string, unknown>,
): Promise<void> {
  const user = await getCurrentAppUser();
  if (!user) return;
  await saveSurvey(user.id, survey);
}

// ---- Аватар ----

export type AvatarResult = { ok: true } | { ok: false; error: string };

export async function uploadAvatarAction(formData: FormData): Promise<AvatarResult> {
  const user = await getCurrentAppUser();
  if (!user) return { ok: false, error: "Сессия не найдена." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Файл не выбран." };
  if (!file.type.startsWith("image/"))
    return { ok: false, error: "Нужен файл-изображение." };
  if (file.size > 5 * 1024 * 1024)
    return { ok: false, error: "Файл больше 5 МБ." };

  const ext = (file.type.split("/")[1] || "png").replace("jpeg", "jpg");
  const buf = Buffer.from(await file.arrayBuffer());
  const url = await uploadAvatarFile(user.id, buf, ext, file.type);
  await setAvatarImage(user.id, url);
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setEmojiAvatarAction(
  emoji: string,
  bg: string,
): Promise<AvatarResult> {
  const user = await getCurrentAppUser();
  if (!user) return { ok: false, error: "Сессия не найдена." };
  await setAvatarEmoji(user.id, emoji, bg);
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatarAction(): Promise<AvatarResult> {
  const user = await getCurrentAppUser();
  if (!user) return { ok: false, error: "Сессия не найдена." };
  await clearAvatar(user.id);
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function logout(): Promise<void> {
  await clearUserSession();
  redirect("/login");
}
