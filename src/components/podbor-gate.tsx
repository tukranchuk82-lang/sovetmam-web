"use client";

import { useState } from "react";
import Link from "next/link";
import { LogIn, Sparkles } from "lucide-react";
import { PodborForm } from "@/components/podbor-form";
import { PodborTeaser } from "@/components/podbor-teaser";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { SupportMeasure } from "@/lib/measures";
import type { RegionalRepresentative } from "@/lib/representatives";

/**
 * Индивидуальный подбор — только для авторизованных: список слишком зависит
 * от анкеты, чтобы отдавать его без сохранения. Гостю вместо отказа
 * предлагаем короткий квиз (см. PodborTeaser) — оценку без входа, а точный
 * список показываем только после «Войти».
 */
export function PodborGate({
  authed,
  measures,
  savedSurvey,
  representatives,
}: {
  authed: boolean;
  measures: SupportMeasure[];
  savedSurvey: Record<string, unknown> | null;
  representatives: RegionalRepresentative[];
}) {
  const [showTeaser, setShowTeaser] = useState(false);

  if (!authed) {
    return showTeaser ? (
      <PodborTeaser measures={measures} />
    ) : (
      <AuthGate onTryQuiz={() => setShowTeaser(true)} />
    );
  }

  return (
    <PodborForm
      measures={measures}
      savedSurvey={savedSurvey}
      representatives={representatives}
    />
  );
}

function AuthGate({ onTryQuiz }: { onTryQuiz: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_10px_24px_-8px_rgba(142,29,44,0.55)]">
        <Sparkles className="size-8" />
      </div>
      <h1
        className="mt-5 text-[22px] font-normal leading-tight text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-playfair), serif" }}
      >
        Доступно только авторизованным пользователям
      </h1>
      <p className="mt-2.5 max-w-[300px] text-sm leading-relaxed text-muted-foreground">
        Чтобы мы могли подобрать все доступные меры под вашу индивидуальную
        жизненную ситуацию, авторизуйтесь или пройдите регистрацию.
      </p>
      <Link
        href="/login?next=/podbor"
        className={cn(buttonVariants(), "mt-6 h-11 gap-2 px-6")}
      >
        <LogIn className="size-4" />
        Войти
      </Link>
      <button
        type="button"
        onClick={onTryQuiz}
        className="mt-3 text-sm font-semibold text-[#1B3A6B] hover:underline"
      >
        А пока — короткий квиз без входа →
      </button>
      <Link
        href="/catalog"
        className="mt-3 text-sm text-muted-foreground hover:text-foreground"
      >
        Сначала посмотреть каталог →
      </Link>
    </div>
  );
}
