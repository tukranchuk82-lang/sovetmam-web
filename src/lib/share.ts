import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { absoluteUrl } from "@/lib/site";
import { SHARE_SOURCE } from "@/lib/share-source";

/**
 * Учёт кнопки «Поделиться».
 *
 * Считаем две вещи: сколько раз нажали «Поделиться» и сколько людей пришло по
 * таким ссылкам. Первое показывает, что приложением хочется делиться, второе —
 * доходит ли это до новых семей.
 *
 * Никакой внешней аналитики: считаем у себя, в своей базе. Счётчики чужих
 * сервисов пришлось бы объяснять людям в согласии на обработку данных, а нам
 * нужны всего два числа.
 */

export { SHARE_SOURCE };

/** Как долго помним устройство — чтобы считать людей, а не заходы. */
const VISITOR_COOKIE = "vid";
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365;

export type ShareKind = "share" | "visit" | "exit";

/**
 * Ссылка, которой делятся. Метка нужна, чтобы отличить переход по ней от
 * обычного захода: без неё мы бы видели просто «кто-то пришёл».
 */
export function shareUrl(path: string): string {
  const url = new URL(absoluteUrl(path));
  url.searchParams.set("utm_source", SHARE_SOURCE);
  return url.toString();
}

/**
 * Номер устройства из cookie. Ставим свой, если его ещё нет.
 *
 * Это случайное число и ничего больше: по нему нельзя узнать человека, только
 * понять, что заходы сделаны с одного устройства.
 */
async function visitorId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(VISITOR_COOKIE)?.value;
  if (existing) return existing;

  const fresh = randomUUID();
  jar.set(VISITOR_COOKIE, fresh, {
    maxAge: VISITOR_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return fresh;
}

export async function recordShareEvent(input: {
  kind: ShareKind;
  path: string;
  ref?: string | null;
  channel?: string | null;
  userId?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const sb = createSupabaseAdminClient();
  const visitor = await visitorId();

  const { error } = await sb.from("share_events").insert({
    kind: input.kind,
    // Метку и адрес обрезаем: в базе им незачем быть длиннее, а прийти может
    // что угодно — параметры в ссылке правит кто угодно.
    path: input.path.slice(0, 300),
    ref: input.ref ? input.ref.slice(0, 60) : null,
    channel: input.channel ?? null,
    user_id: input.userId ?? null,
    visitor,
    user_agent: input.userAgent ? input.userAgent.slice(0, 300) : null,
  });

  // Счётчик — не то, ради чего стоит показывать человеку ошибку: он нажал
  // «Поделиться», ссылка ушла, всё остальное наши заботы.
  if (error) {
    console.log(`[Поделиться] не записал событие: ${error.message}`);
  }
}
