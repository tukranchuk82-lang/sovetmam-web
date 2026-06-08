import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Видимая кнопка «назад» для экранов, в которые проваливаются с главной или из
 * каталога. Семантическая ссылка (а не history.back) — в приложение часто
 * заходят по прямым ссылкам из ботов, где «назад» увёл бы вообще из приложения.
 */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full bg-stone-100 py-1.5 pl-2 pr-3.5 text-sm font-medium text-foreground shadow-sm ring-1 ring-stone-200 transition-all hover:bg-stone-200 active:scale-95"
    >
      <ChevronLeft className="size-4 text-[#c9002f]" />
      {label}
    </Link>
  );
}
