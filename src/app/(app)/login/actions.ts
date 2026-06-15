"use server";

import { redirect } from "next/navigation";
import {
  setDemoUserCookie,
  clearDemoUserCookie,
  type Channel,
  type Role,
} from "@/lib/demo-auth";

export async function loginAsDemoUser(
  channel: Channel,
  role: Role,
  next?: string,
) {
  await setDemoUserCookie(`${channel}:${role}`);
  // Возвращаем туда, откуда пришёл пользователь (например, форма обращения),
  // но только если это локальный путь — защита от open-redirect.
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/profile";
  redirect(safeNext);
}

export async function logoutDemoUser() {
  await clearDemoUserCookie();
  redirect("/");
}
