import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Видимая кнопка «назад» для экранов, в которые проваливаются с главной или из
 * каталога. Семантическая ссылка (а не history.back) — в приложение часто
 * заходят по прямым ссылкам из ботов, где «назад» увёл бы вообще из приложения.
 *
 * Кнопка липкая: уезжая наверх, она пряталась под шапку, и человек тянулся к
 * системной кнопке «назад» смартфона — а та уводила не туда, куда мы обещали.
 * Прилипает точно под шапку: её высота лежит в --hdr-h (см. app-shell.tsx),
 * шапка плавает над прокруткой, поэтому просто top:0 не годится.
 *
 * Под кнопкой — полоса фона с размытием: без неё текст проезжал бы прямо под
 * кнопкой и мешал её читать. Отрицательные поля гасят горизонтальные паддинги
 * страницы, чтобы полоса шла от края до края.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <div
      className="sticky z-20 -mx-4 -mt-2 mb-1 bg-background/80 px-4 py-2 backdrop-blur-sm"
      style={{ top: "var(--hdr-h, 76px)" }}
    >
      <Link
        href={href}
        className="inline-flex items-center gap-1 rounded-full bg-stone-100 py-1.5 pl-2 pr-3.5 text-sm font-medium text-foreground shadow-sm ring-1 ring-stone-200 transition-all hover:bg-stone-200 active:scale-95"
      >
        <ChevronLeft className="size-4 text-brand" />
        {label}
      </Link>
    </div>
  );
}
