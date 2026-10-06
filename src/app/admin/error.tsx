"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Home, RotateCcw } from "lucide-react";

/**
 * Запасная страница на случай сбоя в админке. Раньше при любой ошибке
 * показывалась голая страница без кнопок, а в установленном приложении из неё
 * не выйти — оставалось закрывать приложение. Теперь есть куда вернуться.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Админка] сбой:", error);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-6 py-12">
      <div className="max-w-md text-center">
        <h1 className="mt-3 text-xl font-bold">Что-то пошло не так</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Страница не открылась. Ваши данные не пострадали — можно вернуться назад или попробовать ещё раз.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold hover:bg-white/20"
          >
            <ArrowLeft className="size-4" /> Назад
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-sm font-semibold hover:bg-white/20"
          >
            <RotateCcw className="size-4" /> Попробовать снова
          </button>
          <Link
            href="/admin"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#2FA36B] px-4 text-sm font-semibold text-white hover:bg-[#28915E]"
          >
            <Home className="size-4" /> На сводку
          </Link>
        </div>
      </div>
    </div>
  );
}
