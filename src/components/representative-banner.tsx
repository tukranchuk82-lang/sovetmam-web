import { Landmark } from "lucide-react";
import type { RegionalRepresentative } from "@/lib/representatives";
import { findRepresentative } from "@/lib/representatives";
import { RepresentativeDetails } from "@/components/representative-details";

const SERIF = { fontFamily: "var(--font-playfair), serif" } as const;

/**
 * Карточка представителя над списком мер в подборке — видна сразу, без
 * клика: заказчик хотел, чтобы человек узнал о представительстве до того,
 * как начнёт листать меры, а не наткнулся на него случайно внутри карточки.
 */
export function RepresentativeBanner({
  representatives,
  region,
}: {
  representatives: RegionalRepresentative[];
  region: string | null | undefined;
}) {
  const representative = findRepresentative(representatives, region);
  if (!representative) return null;

  return (
    <section className="mt-5 rounded-3xl border border-[#8E1D2C]/15 bg-white p-4 shadow-[0_16px_36px_-28px_rgba(26,26,26,0.7)]">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8E1D2C]/[0.08] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#8E1D2C]">
        <Landmark className="size-3" aria-hidden />
        Есть представитель в вашем регионе
      </span>
      <h2
        className="mt-2 text-[19px] font-normal leading-tight text-[#15234A]"
        style={SERIF}
      >
        {representative.name}
      </h2>
      <div className="mt-2">
        <RepresentativeDetails representative={representative} />
      </div>
      <p className="mt-3 text-xs leading-snug text-muted-foreground">
        Аккредитованная организация может ответить на вопросы по региональным
        мерам и помочь с обращениями.
      </p>
    </section>
  );
}
