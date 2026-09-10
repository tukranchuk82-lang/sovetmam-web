"use client";

import { Landmark, ChevronRight } from "lucide-react";
import type { RegionalRepresentative } from "@/lib/representatives";
import { RepresentativeDetails } from "@/components/representative-details";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Строка внизу карточки меры: «Обратиться в …» — вне <Link> карточки
 * (клик не должен уводить на страницу меры), открывает контакты
 * представителя всплывающим окном.
 */
export function RepresentativeContactLine({
  representative,
}: {
  representative: RegionalRepresentative;
}) {
  return (
    <Dialog>
      <DialogTrigger className="flex w-full items-center gap-1.5 rounded-b-xl border border-t-0 border-[#E5E0D6] bg-[#8E1D2C]/[0.04] px-4 py-2.5 text-left text-[12.5px] font-medium text-[#8E1D2C] transition-colors hover:bg-[#8E1D2C]/[0.08]">
        <Landmark className="size-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">
          Обратиться в {representative.name}
        </span>
        <ChevronRight className="size-3.5 shrink-0" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle
          className="pr-6 text-[19px] font-normal leading-tight text-[#15234A]"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          {representative.name}
        </DialogTitle>
        <div className="mt-3">
          <RepresentativeDetails representative={representative} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
