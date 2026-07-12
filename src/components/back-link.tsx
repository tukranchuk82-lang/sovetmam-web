"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * Кнопка «назад» для экранов, в которые проваливаются из списков.
 *
 * Если человек пришёл сюда изнутри приложения — возвращаем его по истории
 * (router.back), и он попадает ровно туда, где был: тот же список, тот же
 * фильтр, то же место прокрутки (её восстанавливает AppShell). Раньше это была
 * обычная ссылка на раздел — она открывала список заново, сбрасывая и регион, и
 * прокрутку, и человеку приходилось искать меру, на которой он остановился.
 *
 * Если же в приложение зашли по прямой ссылке (из бота, из поиска) — истории
 * нет, и «назад» увёл бы вообще из приложения. В этом случае работает обычная
 * ссылка на href.
 *
 * Кнопка липкая: уезжая наверх, она пряталась под шапку, и человек тянулся к
 * системной кнопке «назад» смартфона. Прилипает точно под шапку: её высота
 * лежит в --hdr-h (см. app-shell.tsx), шапка плавает над прокруткой, поэтому
 * просто top:0 не годится. Под кнопкой — полоса фона с размытием, чтобы текст
 * проезжал под ней, не мешая читать.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    // История своя (в приложение не по прямой ссылке зашли) — можно возвращаться.
    setCanGoBack(window.history.length > 1);
  }, []);

  return (
    <div
      className="sticky z-20 -mx-4 -mt-2 mb-1 bg-background/80 px-4 py-2 backdrop-blur-sm"
      style={{ top: "var(--hdr-h, 76px)" }}
    >
      <Link
        href={href}
        onClick={(e) => {
          if (!canGoBack) return;
          e.preventDefault();
          router.back();
        }}
        className="inline-flex items-center gap-1 rounded-full bg-stone-100 py-1.5 pl-2 pr-3.5 text-sm font-medium text-foreground shadow-sm ring-1 ring-stone-200 transition-all hover:bg-stone-200 active:scale-95"
      >
        <ChevronLeft className="size-4 text-brand" />
        {label}
      </Link>
    </div>
  );
}
