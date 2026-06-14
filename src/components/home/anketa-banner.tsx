import Link from "next/link";
import { ClipboardList, ArrowRight } from "lucide-react";

/**
 * Баннер-призыв: главное целевое действие — заполнить анкету и получить
 * персональную подборку мер. Navy с тонким красным акцентом сверху.
 */
export function AnketaBanner() {
  return (
    <Link
      href="/podbor"
      className="sm-cta group block overflow-hidden rounded-2xl border-t-4 border-accent-red bg-brand text-brand-foreground shadow-[0_14px_30px_-14px_rgba(27,58,107,0.7)] transition-transform duration-200 ease-out hover:scale-[1.01] active:scale-[0.99]"
    >
      <div className="relative flex items-center gap-3.5 p-5">
        <div
          aria-hidden
          className="absolute -right-8 -top-10 size-32 rounded-full bg-white/5"
        />
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <ClipboardList className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold leading-tight">
            Подберём меры для вашей семьи
          </p>
          <p className="mt-1 text-sm text-white/80">
            Заполните анкету — система найдёт всё, что вам положено
          </p>
        </div>
        <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
