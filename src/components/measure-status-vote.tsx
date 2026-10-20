"use client";

import { Check, CircleSlash, Hourglass } from "lucide-react";
import { useMeasureStatus } from "@/components/measure-status-provider";
import { MEASURE_STATUS_LABEL, type MeasureStatus } from "@/lib/measure-status-labels";
import { cn } from "@/lib/utils";

const OPTIONS: { key: MeasureStatus; icon: React.ReactNode; on: string }[] = [
  { key: "using", icon: <Check className="size-3.5" />, on: "border-emerald-600 bg-emerald-600 text-white" },
  { key: "not_applied", icon: <Hourglass className="size-3.5" />, on: "border-[#1B3A6B] bg-[#1B3A6B] text-white" },
  { key: "refused", icon: <CircleSlash className="size-3.5" />, on: "border-[#8E1D2C] bg-[#8E1D2C] text-white" },
];

/**
 * «Вы уже оформляли эту меру?» — три ответа рядом с мерой в подборке. Нужны,
 * чтобы понимать, дошло ли дело до оформления: сколько людей пользуются мерой,
 * сколько не подавали, а где отказывают. Повторное нажатие снимает ответ.
 */
export function MeasureStatusVote({ slug }: { slug: string }) {
  const { statusOf, choose } = useMeasureStatus();
  const current = statusOf(slug);
  return (
    <div className="mt-2 rounded-xl bg-[#F4F1EA] px-3 py-2.5">
      <p className="text-[11.5px] font-semibold text-[#5d6470]">Вы уже оформляли эту меру?</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Статус меры">
        {OPTIONS.map((o) => {
          const active = current === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => choose(slug, o.key)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors active:scale-95",
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
