"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";
import { PodborForm } from "@/components/podbor-form";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { SupportMeasure } from "@/lib/measures";

/**
 * Анкету без входа заполнить можно — предупреждаем заранее, что подборка не
 * сохранится, и даём выбор: авторизоваться сразу или продолжить гостем.
 * Выбор «продолжить без входа» живёт только в состоянии этого компонента —
 * возврат на /podbor (например, по «Назад») снова спросит.
 */
export function PodborGate({
  authed,
  measures,
  savedSurvey,
}: {
  authed: boolean;
  measures: SupportMeasure[];
  savedSurvey: Record<string, unknown> | null;
}) {
  const [asGuest, setAsGuest] = useState(false);

  if (!authed && !asGuest) {
    return <AuthWarning onContinueAsGuest={() => setAsGuest(true)} />;
  }

  return (
    <PodborForm measures={measures} savedSurvey={savedSurvey} authed={authed} />
  );
}

function AuthWarning({ onContinueAsGuest }: { onContinueAsGuest: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_-8px_rgba(142,29,44,0.55)]">
        <Sparkles className="size-8" />
      </div>
      <h1
        className="mt-5 text-[22px] font-normal leading-tight text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-playfair), serif" }}
      >
        Подбор без входа
      </h1>
      <p className="mt-2.5 max-w-[320px] rounded-xl border border-[#8E1D2C]/20 bg-[#8E1D2C]/[0.05] px-4 py-3 text-sm font-medium leading-relaxed text-[#8E1D2C]">
        Без авторизации подборка не сохранится — при следующем входе анкету
        придётся заполнять заново.
      </p>
      <div className="mt-6 flex w-full max-w-[300px] flex-col gap-2.5">
        <Link
          href="/login?next=/podbor"
          className={cn(buttonVariants(), "h-11 gap-2")}
        >
          <LogIn className="size-4" />
          Авторизоваться
        </Link>
        <button
          type="button"
          onClick={onContinueAsGuest}
          className={cn(buttonVariants({ variant: "outline" }), "h-11 gap-2")}
        >
          Продолжить без авторизации
        </button>
      </div>
      <Link
        href="/catalog"
        className="mt-4 text-sm text-muted-foreground hover:text-foreground"
      >
        Сначала посмотреть каталог →
      </Link>
    </div>
  );
}
