import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { categoryMeta } from "@/lib/category-meta";

// Карточке достаточно этих полей — принимаем и полную меру, и «облегчённую»
// (например, из клиентского каталога). category держим как string, чтобы
// подходили оба варианта (в SupportMeasure это узкий union Category).
type MeasureCardData = {
  slug: string;
  title: string;
  shortDescription: string;
  level: "federal" | "regional";
  category: string;
  amount?: string | null;
  region?: string | null;
};

/**
 * Карточка меры — строгая, но тёплая: кремовый тон, засечный заголовок (как в
 * заголовках приложения), сдержанная палитра (navy + бордовый акцент), тонкие
 * линии и чёткая иерархия — «государственная серьёзность» помогающего проекта.
 * Категория — единым navy-цветом (иконка+подпись), без пёстрых плиток.
 */
export function MeasureCard({ measure }: { measure: MeasureCardData }) {
  const isFederal = measure.level === "federal";
  const cat = categoryMeta(measure.category);
  return (
    <Link
      href={`/catalog/${measure.slug}`}
      className="group block rounded-xl border border-[#E5E0D6] bg-[#FCFBF9] p-4 shadow-[0_1px_2px_rgba(30,30,40,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1B3A6B]/30 hover:shadow-[0_12px_26px_-16px_rgba(27,58,107,0.3)] active:scale-[0.995]"
    >
      {/* Мета: категория (navy) · уровень (бордовый) */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#1B3A6B]">
          <cat.icon className="size-3.5" strokeWidth={2} />
          {measure.category}
        </span>
        <span className="text-[#CFC8BA]">|</span>
        <span className="font-semibold text-[#8E1D2C]">
          {isFederal ? "Федеральная" : (measure.region ?? "Региональная")}
        </span>
      </div>

      {/* Название — засечный, как заголовки приложения */}
      <h3
        className="mt-2 text-[17px] leading-snug text-[#1E2A3A]"
        style={{ fontFamily: "var(--font-playfair), serif" }}
      >
        {measure.title}
      </h3>

      {/* Описание */}
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-[#82796c]">
        {measure.shortDescription}
      </p>

      {/* Подвал: сумма и «Подробнее» — через тонкую линию */}
      <div className="mt-3 flex items-center justify-between border-t border-[#ECE7DD] pt-2.5">
        <span className="min-w-0 flex-1 truncate pr-3 text-[13px] font-semibold text-[#1B3A6B]">
          {measure.amount ?? " "}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[#8E1D2C]">
          Подробнее
          <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
