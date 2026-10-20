"use client";

import { Check, CircleSlash, Hourglass } from "lucide-react";
import { useMeasureStatus } from "@/components/measure-status-provider";
import { MEASURE_STATUS_LABEL, type MeasureStatus } from "@/lib/measure-status-labels";
import { cn } from "@/lib/utils";

const SHORT_LABEL: Record<MeasureStatus, string> = {
  using: "Пользуюсь",
  not_applied: "Не подавал",
  refused: "Отказали",
};

const OPTIONS: { key: MeasureStatus; icon: React.ReactNode; on: string }[] = [
  { key: "using", icon: <Check className="size-3" />, on: "border-emerald-600 bg-emerald-600 text-white" },
  { key: "not_applied", icon: <Hourglass className="size-3" />, on: "border-[#1B3A6B] bg-[#1B3A6B] text-white" },
  { key: "refused", icon: <CircleSlash className="size-3" />, on: "border-[#8E1D2C] bg-[#8E1D2C] text-white" },
];

/**
 * «Оформляли эту меру?» — три ответа внутри самой карточки меры, под её
 * подвалом: так сразу понятно, к какой мере относится вопрос. Нужны, чтобы
 * понимать, дошло ли дело до оформления: пользуются, не подавали или получили
 * отказ. Повторное нажатие снимает ответ.
 */
export function MeasureStatusVote({ slug }: { slug: string }) {
  const { statusOf, choose } = useMeasureStatus();
  const current = statusOf(slug);
  return (
    <div className="@container">
      <p className="text-[11.5px] font-semibold text-[#82796c]">Оформляли эту меру?</p>
      {/* Три кнопки всегда в одну строку, поровну по ширине; шрифт и значки
          подстраиваются под ширину карточки: на узком экране мельче, а совсем
          узко значки прячутся, чтобы подписи не переносились. */}
      <div className="mt-1.5 grid grid-cols-3 gap-1.5" role="group" aria-label="Статус этой меры">
        {OPTIONS.map((o) => {
          const active = current === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => choose(slug, o.key)}
              aria-pressed={active}
              className={cn(
                "inline-flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-1.5 py-1.5 text-[10px] font-semibold leading-none transition-colors active:scale-95 @[19rem]:px-2.5 @[19rem]:text-[11.5px] @[22rem]:text-[12px]",
                active ? o.on : "border-[#D9D2C6] bg-white text-[#3A4D63] hover:bg-[#FBF8F3]",
              )}
            >
              <span className="hidden shrink-0 @[20rem]:inline-flex">{o.icon}</span>
              {/* На самой узкой карточке подпись короче — «Не подавал(а)» иначе не помещается. */}
              <span className="truncate @[17rem]:hidden">{SHORT_LABEL[o.key]}</span>
              <span className="hidden truncate @[17rem]:inline">{MEASURE_STATUS_LABEL[o.key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
