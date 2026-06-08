import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SupportMeasure } from "@/lib/measures";

/**
 * Карточка меры — белая с мягкой тенью, в стиле deli-app карточек.
 */
export function MeasureCard({ measure }: { measure: SupportMeasure }) {
  return (
    <Link
      href={`/catalog/${measure.slug}`}
      className="block rounded-2xl border border-stone-200 bg-stone-50 p-4 text-foreground transition-all duration-200 ease-out hover:scale-[1.02] hover:border-stone-300 hover:bg-white hover:shadow-[0_10px_24px_-10px_rgba(0,0,0,0.2)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              className={
                measure.level === "federal"
                  ? "bg-[#c9002f] text-white hover:bg-[#a3002a]"
                  : "bg-stone-100 text-foreground hover:bg-stone-200"
              }
            >
              {measure.level === "federal"
                ? "Федеральная"
                : (measure.region ?? "Региональная")}
            </Badge>
            <Badge variant="outline">{measure.category}</Badge>
          </div>
          <h3 className="mt-2 font-semibold leading-snug">{measure.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {measure.shortDescription}
          </p>
          {measure.amount ? (
            <p className="mt-2 text-sm font-semibold text-[#c9002f]">
              {measure.amount}
            </p>
          ) : null}
        </div>
        <ChevronRight className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  );
}
