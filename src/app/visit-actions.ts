"use server";

import { cookies } from "next/headers";
import { recordShareEvent } from "@/lib/share";
import { recordLogin } from "@/lib/login-events";
import { getCurrentAppUser } from "@/lib/user-session";

/**
 * Отметки о заходе и об установке приложения.
 *
 * Раньше мы видели только тех, кто пришёл по размеченной ссылке, — значит, не
 * знали ни сколько устройств заходит вообще, ни сколько человек возвращается.
 * Теперь приложение при открытии присылает одну короткую отметку.
 *
 * Чтобы не писать по строке на каждую страницу, отметка ставится раз в сутки
 * на устройство: браузер запоминает дату в cookie, сервер её проверяет.
 * Cookie — не для точности, а для тишины: несколько лишних записей в день
 * ничего не испортят, а тысячи — засорят журнал.
 */

const SEEN_COOKIE = "sm_seen";
const DAY = 60 * 60 * 24;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function pingOpen(input: { standalone: boolean }): Promise<void> {
  const jar = await cookies();
  if (jar.get(SEEN_COOKIE)?.value === today()) return;
  jar.set(SEEN_COOKIE, today(), {
    maxAge: DAY,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });

  await recordShareEvent({
    kind: "open",
    path: input.standalone ? "standalone" : "browser",
  });

  // Тот же заход, но со стороны человека: если он вошёл в приложение,
  // отмечаем возвращение. Так «людей» можно считать по учётным записям,
  // а не по браузерам.
  const user = await getCurrentAppUser();
  if (user) await recordLogin(user.id, "return", { standalone: input.standalone });
}

/**
 * Приложение установили на устройство. Событие приходит один раз: браузер
 * присылает appinstalled, а на iPhone — при первом запуске с домашнего
 * экрана (там appinstalled не поддерживается).
 */
export async function recordInstall(): Promise<void> {
  await recordShareEvent({ kind: "install", path: "/" });
}
