"use client";

import { Heart } from "lucide-react";
import { useSaved } from "@/components/saved-provider";
import { cn } from "@/lib/utils";

/**
 * Кнопка «в избранное». Два вида:
 *  - "icon"  — компактное сердечко в углу карточки меры (лежит поверх ссылки);
 *  - "button" — крупная кнопка на детальной странице меры.
 * Состояние берём из общего стора избранного (SavedProvider).
 */
export function SaveHeart({
  slug,
  variant = "icon",
  className,
}: {
  slug: string;
  variant?: "icon" | "button";
  className?: string;
}) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(slug);

  const handle = (e: React.MouseEvent) => {
    // На карточке кнопка лежит поверх ссылки — гасим переход/всплытие.
    e.preventDefault();
    e.stopPropagation();
    toggle(slug);
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handle}
        aria-pressed={saved}
        aria-label={saved ? "Убрать из избранного" : "Сохранить в избранное"}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition-colors",
          saved
            ? "border-[#8E1D2C]/30 bg-[#8E1D2C]/8 text-[#8E1D2C]"
            : "border-[#D9D2C6] bg-white text-[#3A4D63] hover:bg-[#F7F4EE]",
          className,
        )}
      >
        <Heart
          className={cn("size-4", saved && "fill-[#8E1D2C]")}
          strokeWidth={2}
        />
        {saved ? "В избранном" : "Сохранить меру"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={saved}
      aria-label={saved ? "Убрать из избранного" : "Сохранить в избранное"}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full bg-white/85 text-[#8E1D2C] shadow-[0_2px_6px_rgba(30,30,40,0.12)] backdrop-blur-sm transition-transform active:scale-90 hover:bg-white",
        className,
      )}
    >
      <Heart
        className={cn("size-[18px]", saved ? "fill-[#8E1D2C]" : "fill-none")}
        strokeWidth={2}
      />
    </button>
  );
}
