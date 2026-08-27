import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { recordShareEvent } from "@/lib/share";
import { getCurrentAppUser } from "@/lib/user-session";
import { COURSE_URL } from "@/lib/course";

/**
 * Переход в приложение курса.
 *
 * Плашка курса на главной ведёт не напрямую на kurs.sovetmam.ru, а сюда: мы
 * отмечаем переход у себя и только потом отправляем человека дальше. Так счёт
 * не зависит ни от скриптов в браузере, ни от того, успеет ли запрос уйти до
 * ухода со страницы, — переход считается ровно тогда, когда он состоялся.
 *
 * Что записываем: kind = exit («ушёл по нашей ссылке»), channel = kurs (куда),
 * path = страница, с которой нажали. Персональных данных нет, человека мы не
 * узнаём — только анонимный номер устройства, общий со счётчиком «Поделиться».
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Откуда пришли. Принимаем только внутренние адреса: параметр в ссылке
  // правит кто угодно, а нам нужен путь по своему сайту, а не чужая ссылка.
  const raw = new URL(request.url).searchParams.get("from") ?? "/";
  const from = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  const user = await getCurrentAppUser();
  const ua = (await headers()).get("user-agent");
  await recordShareEvent({
    kind: "exit",
    path: from,
    channel: "kurs",
    userId: user?.id ?? null,
    userAgent: ua,
  });

  // 302, а не 301: адрес курса может смениться, и браузеры не должны
  // запоминать переход навсегда.
  return NextResponse.redirect(COURSE_URL, 302);
}
