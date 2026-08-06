import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/user-session";
import { botIdentityCookie, connectFromBot, readBotIdentity } from "@/lib/from-bot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Вход в приложение по ссылке из бота.
 *
 * Страницы человек не видит: маршрут молча подключает мессенджер и уводит
 * дальше. Если человек ещё не вошёл, личность придерживаем в cookie и
 * подключим сразу после входа — иначе пришлось бы просить его повторить путь
 * из бота.
 *
 * Ссылка для Salebot:
 *   https://app.sovetmam.ru/iz-bota?ch=telegram&cid=<client_id>&mid=<tg_id>&k=<ключ>
 * Необязательный `to` ведёт не на главную, а куда нужно: /podbor, /catalog и
 * так далее.
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const origin = new URL(request.url).origin;

  const identity = readBotIdentity({
    k: sp.get("k") ?? undefined,
    ch: sp.get("ch") ?? undefined,
    cid: sp.get("cid") ?? undefined,
    mid: sp.get("mid") ?? undefined,
    avatar: sp.get("avatar") ?? undefined,
    photo: sp.get("photo") ?? undefined,
  });

  // Ведём только на свои страницы: чужой адрес в параметре — чужой сайт.
  const raw = sp.get("to") ?? "/";
  const to = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  if (!identity) return NextResponse.redirect(new URL(to, origin));

  const user = await getCurrentAppUser();
  if (!user) {
    const res = NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(to)}`, origin),
    );
    const cookie = botIdentityCookie(identity);
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  }

  await connectFromBot(user.id, identity);
  // Метка, по которой приложение покажет «мессенджер подключён».
  const target = new URL(to, origin);
  target.searchParams.set("mc", "1");
  return NextResponse.redirect(target);
}
