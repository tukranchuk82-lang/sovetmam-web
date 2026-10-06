"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Запасная страница при сбое в приложении: с кнопками, чтобы из неё можно было
 * выйти (в установленном приложении иначе остаётся только закрыть его).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Приложение] сбой:", error);
  }, [error]);

  return (
    <div className="mx-auto grid min-h-dvh max-w-[480px] place-items-center bg-white px-6 text-center">
      <div>
        <h1 className="mt-3 text-xl font-bold text-[#1A1A1A]">Что-то пошло не так</h1>
        <p className="mt-2 text-sm text-[#6b7078]">Страница не открылась. Попробуйте ещё раз или вернитесь на главную.</p>
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={reset}
            className="h-12 rounded-2xl bg-[#1B3A6B] px-5 text-sm font-semibold text-white"
          >
            Попробовать снова
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="h-12 rounded-2xl border border-black/10 px-5 text-sm font-semibold text-[#1A1A1A]"
          >
            Назад
          </button>
          <Link
            href="/"
            className="grid h-12 place-items-center rounded-2xl border border-black/10 px-5 text-sm font-semibold text-[#1A1A1A]"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
