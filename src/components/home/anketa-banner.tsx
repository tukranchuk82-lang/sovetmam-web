import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

/**
 * Баннер-призыв: главное целевое действие — заполнить анкету и получить
 * персональную подборку мер.
 */
export function AnketaBanner() {
  return (
    <Link
      href="/podbor"
      className="group block overflow-hidden rounded-3xl bg-brand text-brand-foreground shadow-[0_14px_30px_-12px_rgba(15,138,106,0.55)] transition-transform duration-200 ease-out hover:scale-[1.01] active:scale-[0.99]"
    >
      <div className="relative flex items-center gap-3 p-5">
        {/* Декоративный круг */}
        <div
          aria-hidden
          className="absolute -right-8 -top-10 size-32 rounded-full bg-white/10"
        />
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <Sparkles className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold leading-tight">
            Подберём меры для вашей семьи
          </p>
          <p className="mt-1 text-sm text-white/85">
            Заполните анкету — система найдёт всё, что вам положено
          </p>
        </div>
        <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
