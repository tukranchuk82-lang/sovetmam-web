import { NextResponse } from "next/server";
import { consumeLoginLink } from "@/lib/login-links";
import { setUserSession } from "@/lib/user-session";
import { recordLogin } from "@/lib/login-events";
import { appUrl } from "@/lib/inquiry-token";

/**
 * Вход по одноразовой ссылке из бота.
 *
 * Ссылку выдают вручную тем, кому не дошёл код на почту. Она живёт сутки и
 * гаснет при первом переходе.
 *
 * Если ссылка просрочена или уже использована, человека не встречает ошибка:
 * мы просто открываем приложение с меткой bot. Он увидит обычный вход и
 * сможет запросить код заново — это полезнее, чем страница «ссылка
 * недействительна», из которой ничего не следует.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ token: string }> },
): Promise<Response> {
  const { token } = await ctx.params;
  const res = await consumeLoginLink(token);

  if (!res.ok) {
    return NextResponse.redirect(`${appUrl()}/?utm_source=bot`, 302);
  }

  await setUserSession(res.userId);
  await recordLogin(res.userId, "login");
  // Метку оставляем и при удачном входе: так в отчёте «Откуда приходят»
  // видно, что человек пришёл из бота.
  return NextResponse.redirect(`${appUrl()}/?utm_source=bot`, 302);
}
