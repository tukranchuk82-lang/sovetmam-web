import Link from "next/link";
import { Sparkles, MessageSquareHeart, ChevronRight } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { MotionFadeIn, MotionStagger } from "@/components/motion";
import { OrgName } from "@/components/org-name";

export const metadata = { title: "Своя жизненная ситуация" };

/**
 * Развилка для «Своя жизненная ситуация» из каталога: пользователь выбирает —
 * пройти анкету (система подберёт меры) или написать обращение в Совет матерей.
 */
export default function OwnSituationPage() {
  return (
    <div className="px-4 py-5">
      <MotionFadeIn>
        <BackLink href="/" label="На главную" />
        <h1 className="mt-4 text-xl font-extrabold tracking-tight">
          Своя жизненная ситуация
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Не нашли подходящую ситуацию в каталоге? Выберите, как вам удобнее:
          пусть система сама подберёт меры по анкете — или напишите обращение,
          и мы поможем разобраться.
        </p>
      </MotionFadeIn>

      <MotionStagger className="mt-6 space-y-3" initialDelay={0.1} stagger={0.08}>
        <Link
          href="/podbor"
          className="flex items-center gap-3.5 rounded-3xl bg-brand p-5 text-brand-foreground shadow-[0_14px_30px_-12px_rgba(142,29,44,0.55)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Sparkles className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold leading-tight">
              Подобрать меры по анкете
            </p>
            <p className="mt-1 text-sm text-white/85">
              Ответьте на несколько вопросов — система найдёт всё, что положено
              вашей семье
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0" />
        </Link>

        <Link
          href="/profile/inquiries/new"
          className="flex items-center gap-3.5 rounded-3xl bg-white p-5 ring-1 ring-black/5 transition-all hover:scale-[1.01] hover:ring-brand/30 active:scale-[0.99]"
        >
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <MessageSquareHeart className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-extrabold leading-tight text-foreground">
              Написать обращение
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Опишите свою ситуацию — специалисты <OrgName genitive /> ответят и
              подскажут
            </p>
          </div>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
      </MotionStagger>
    </div>
  );
}
