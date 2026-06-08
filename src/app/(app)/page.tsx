import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { SEGMENTS, pluralMeasures } from "@/lib/measures";
import { getMeasureCountsBySegment } from "@/lib/measures-db";
import { SEGMENT_ICONS } from "@/components/segment-icon";
import { MotionFadeIn, MotionStagger } from "@/components/motion";
import { InstallAppButton } from "@/components/install-app-button";

export default async function Home() {
  const counts = await getMeasureCountsBySegment();

  return (
    <div className="px-4 py-5">
      <MotionFadeIn>
        {/* Подбор по анкете — featured-карточка в тёмном графите (акцент на главное действие) */}
        <Link
          href="/podbor"
          className="block rounded-2xl bg-[#2d2d2d] p-4 text-white shadow-[0_12px_28px_-10px_rgba(0,0,0,0.4)] transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_16px_32px_-10px_rgba(0,0,0,0.5)] active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9002f] to-rose-700 text-white shadow-[0_6px_16px_-6px_rgba(201,0,47,0.6)]">
              <Sparkles className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">
                Подобрать меры под вашу семью
              </p>
              <p className="text-sm text-white/70">
                Ответьте на несколько вопросов
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-white/60" />
          </div>
        </Link>
      </MotionFadeIn>

      {/* Сегменты — белые карточки с мягкой тенью */}
      <MotionFadeIn delay={0.1}>
        <h2 className="mt-6 text-base font-bold uppercase tracking-wide text-muted-foreground">
          Выберите вашу ситуацию
        </h2>
      </MotionFadeIn>
      <MotionStagger
        className="mt-3 space-y-2.5"
        initialDelay={0.15}
        stagger={0.05}
      >
        {SEGMENTS.map((s) => {
          const Icon = SEGMENT_ICONS[s.id];
          const count = counts[s.id] ?? 0;
          return (
            <Link
              key={s.id}
              href={`/segment/${s.id}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 text-foreground shadow-[0_8px_22px_-10px_rgba(0,0,0,0.18)] ring-1 ring-stone-100 transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_12px_26px_-8px_rgba(0,0,0,0.25)]"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#c9002f] to-rose-700 text-white shadow-[0_6px_16px_-6px_rgba(201,0,47,0.5)]">
                <Icon className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{s.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {pluralMeasures(count)}
                </p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </MotionStagger>

      <MotionFadeIn delay={0.55}>
        <Link
          href="/catalog"
          className="mt-4 flex items-center justify-center gap-1 rounded-2xl border border-stone-200 bg-stone-50 py-3 text-sm font-medium text-foreground transition-colors hover:bg-stone-100"
        >
          Открыть весь каталог <ChevronRight className="size-4" />
        </Link>
        <InstallAppButton />
      </MotionFadeIn>
    </div>
  );
}
