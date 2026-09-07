import "server-only";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Журнал входов.
 *
 * Раньше аналитика умела считать только устройства — анонимный номер из
 * cookie, — и только у тех, кто пришёл по размеченной ссылке. Поэтому
 * «пришло людей» и «людей в базе» показывали разное, и было непонятно,
 * сколько человек на самом деле пользуется приложением.
 *
 * Запись входа отвечает на это: людей считаем по учётным записям, устройства —
 * по cookie, и видно, что один человек заходит с телефона и с компьютера.
 *
 * Чего здесь нет: IP-адреса и геолокации. Для наших вопросов они не нужны, а
 * хранить их — брать на себя лишнюю ответственность.
 */

/** Как человек оказался внутри. */
export type LoginKind =
  /** Ввёл код из письма. */
  | "login"
  /** Вернулся с живой cookie-сессией — просто открыл приложение. */
  | "return";

const VISITOR_COOKIE = "vid";

/**
 * Пишем вход. Никогда не бросает исключение: журнал не та вещь, ради которой
 * стоит показывать человеку ошибку на входе.
 */
export async function recordLogin(
  userId: string,
  kind: LoginKind = "login",
  opts: { standalone?: boolean | null } = {},
): Promise<void> {
  try {
    const [h, jar] = await Promise.all([headers(), cookies()]);
    const sb = createSupabaseAdminClient();
    const { error } = await sb.from("login_events").insert({
      user_id: userId,
      kind,
      visitor: jar.get(VISITOR_COOKIE)?.value ?? null,
      user_agent: h.get("user-agent")?.slice(0, 300) ?? null,
      standalone: opts.standalone ?? null,
    });
    if (error) console.log(`[журнал входов] не записал: ${error.message}`);
  } catch (e) {
    console.log(`[журнал входов] не записал: ${(e as Error).message}`);
  }
}

/** Платформа человеческим языком — для отчёта, а не для точной статистики. */
export function platformOf(userAgent: string | null): string {
  if (!userAgent) return "неизвестно";
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "iPhone или iPad";
  if (/android/.test(ua)) return "Android";
  if (/windows/.test(ua)) return "Компьютер, Windows";
  if (/macintosh|mac os/.test(ua)) return "Компьютер, Mac";
  if (/linux/.test(ua)) return "Компьютер, Linux";
  return "другое";
}
