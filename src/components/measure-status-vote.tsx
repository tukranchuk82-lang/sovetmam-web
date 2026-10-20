"use client";

import { Check, CircleSlash, Hourglass } from "lucide-react";
import { useMeasureStatus } from "@/components/measure-status-provider";
import { MEASURE_STATUS_LABEL, type MeasureStatus } from "@/lib/measure-status-labels";
import { cn } from "@/lib/utils";

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
    <div>
      <p className="text-[11.5px] font-semibold text-[#82796c]">Оформляли эту меру?</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Статус этой меры">
        {OPTIONS.map((o) => {
          const active = current === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => choose(slug, o.key)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-semibold transition-colors active:scale-95",
                active ? o.on : "border-[#D9D2C6] bg-white text-[#3A4D63] hover:bg-[#FBF8F3]",
              )}
            >
              {o.icon}
              {MEASURE_STATUS_LABEL[o.key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
