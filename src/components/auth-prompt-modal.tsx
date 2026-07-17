"use client";

import { useEffect } from "react";
import { Heart, X } from "lucide-react";

/**
 * Мягкое приглашение войти, когда гость пытается сохранить меру. Не уводим сразу
 * на авторизацию: показываем окно с кнопкой «Войти», а крестиком/«Не сейчас»
 * его можно закрыть и продолжить смотреть шпаргалку.
 */
export function AuthPromptModal({
  open,
  onLogin,
  onClose,
}: {
  open: boolean;
  onLogin: () => void;
  onClose: () => void;
}) {
  // Esc закрывает; на время показа блокируем прокрутку фона.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-prompt-title"
    >
      {/* Затемнение — клик закрывает */}
      <button
        type="button"
        aria-label="Закрыть"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
      />

      {/* Карточка */}
      <div className="sm-pop relative z-10 m-3 w-full max-w-[360px] rounded-3xl bg-[#FCFBF9] p-6 shadow-[0_24px_60px_-16px_rgba(23,42,75,0.5)] ring-1 ring-[#E5E0D6]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3.5 top-3.5 inline-flex size-8 items-center justify-center rounded-full text-[#82796c] transition-colors hover:bg-[#EFEAE0]"
        >
          <X className="size-5" />
        </button>

        <div className="flex size-12 items-center justify-center rounded-2xl bg-[#8E1D2C]/10 text-[#8E1D2C]">
          <Heart className="size-6 fill-current" />
        </div>

        <h2
          id="auth-prompt-title"
          className="mt-4 text-xl leading-snug text-[#1E2A3A]"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          Сохранение — для своих
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#82796c]">
          Добавлять меры в избранное могут только вошедшие пользователи. Войдите —
          и всё, что отметите, будет ждать вас в разделе «Избранное».
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#8E1D2C] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#7A1826]"
          >
            Войти
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold text-[#3A4D63] transition-colors hover:bg-[#EFEAE0]"
          >
            Не сейчас
          </button>
        </div>
      </div>
    </div>
  );
}
