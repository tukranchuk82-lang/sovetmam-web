import "server-only";
import { cookies } from "next/headers";

/**
 * Режим просмотра для владельца и техспеца.
 *
 * У админа две разные задачи: вести каталог и смотреть на приложение глазами
 * обычной мамы. Раньше это смешивалось в одном экране — в личном кабинете
 * висели и подбор с избранным, и ссылки в панель управления.
 *
 * Теперь режим хранится в cookie и переключается вручную:
 *   admin — личный кабинет превращается в панель управления;
 *   user  — кабинет выглядит ровно так же, как у обычного пользователя.
 *
 * На обычных пользователей режим не влияет вовсе: у них всегда «user».
 */
export type ViewMode = "user" | "admin";

const COOKIE = "sm_view";
const MAX_AGE = 60 * 60 * 24 * 180; // полгода — переключать каждый заход не нужно

/** Режим из cookie. По умолчанию «admin»: админ заходит работать. */
export async function getViewMode(): Promise<ViewMode> {
  const c = await cookies();
  return c.get(COOKIE)?.value === "user" ? "user" : "admin";
}

export async function setViewMode(mode: ViewMode): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}
