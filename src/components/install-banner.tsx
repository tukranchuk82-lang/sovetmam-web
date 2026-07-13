"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { useInstallApp, InstructionsModal } from "@/components/install-app-button";

// Плашка «установите приложение». Висит над нижним меню и не уезжает при
// прокрутке — поэтому живёт в каркасе (app-shell), а не внутри страницы.
//
// Показываем, только если приложение ещё не установлено и его есть куда
// устанавливать (готов родной запрос браузера либо это iOS, где ставят через
// «Поделиться»). Закрыли крестиком — больше не надоедаем: отказ храним в
// localStorage, а не в состоянии, чтобы плашка не возвращалась при каждом
// переходе.
const DISMISSED_KEY = "sm_install_dismissed";

export function InstallBanner() {
  const { available, trigger, platform, browser, showInstructions, closeInstructions } =
    useInstallApp();
  const [dismissed, setDismissed] = useState(true); // до чтения localStorage не мигаем

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "1");
  }, []);

  function dismiss() {
    setDismissed(true);
    localStorage.setItem(DISMISSED_KEY, "1");
  }

  if (!available || dismissed) {
    // Инструкцию для iOS показываем, даже если плашку закрыли: её могли открыть
    // кнопкой «Установить» из нижнего меню.
    return showInstructions ? (
      <InstructionsModal platform={platform} browser={browser} onClose={closeInstructions} />
    ) : null;
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pb-2">
        <div
          className="pointer-events-auto flex items-center gap-3 rounded-2xl px-3.5 py-3 text-white shadow-[0_16px_34px_-12px_rgba(23,42,75,0.7)]"
          style={{
            background:
              "linear-gradient(135deg, #274A7E 0%, #1B3A6B 55%, #101D38 100%)",
          }}
        >
          <button
            type="button"
            onClick={trigger}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Download className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold leading-tight">
                Установите приложение
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-white/80">
                Чтобы «Шпаргалка» всегда была под рукой
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Не устанавливать"
            className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {showInstructions && (
        <InstructionsModal platform={platform} browser={browser} onClose={closeInstructions} />
      )}
    </>
  );
}
