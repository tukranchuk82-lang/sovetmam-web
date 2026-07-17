"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAppUser } from "@/lib/user-session";
import {
  listSavedSlugs,
  toggleSaved,
} from "@/lib/saved-measures-db";

// Сохранять меры может только авторизованный пользователь с подтверждённой
// почтой (как и обращения). Гостю клиент сам предложит войти — сюда он не дойдёт.

/** Слаги избранного текущего пользователя (пусто, если не авторизован). */
export async function getMySavedSlugs(): Promise<string[]> {
  const user = await getCurrentAppUser();
  if (!user) return [];
  return listSavedSlugs(user.id);
}

/**
 * Переключить сохранение меры. Возвращает { authed, saved }:
 * authed=false — пользователь не вошёл (клиент отправит на /login);
 * saved — новое состояние (true — теперь в избранном).
 */
export async function toggleSavedAction(
  slug: string,
): Promise<{ authed: boolean; saved: boolean }> {
  const user = await getCurrentAppUser();
  if (!user || !user.emailVerifiedAt) {
    return { authed: false, saved: false };
  }
  const saved = await toggleSaved(user.id, slug);
  revalidatePath("/saved");
  revalidatePath("/profile");
  return { authed: true, saved };
}
