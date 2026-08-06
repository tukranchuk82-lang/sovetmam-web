"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { X, Download, PartyPopper } from "lucide-react";
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
// Отметка «поздравление уже показывали»: иначе оно всплывало бы при каждом
// запуске установленного приложения.
const WELCOMED_KEY = "sm_install_welcomed";

// Отказ от плашки живёт в localStorage — это внешнее хранилище, и читаем мы
// его как внешнее: через подписку. Раньше значение затягивалось эффектом сразу
// после отрисовки, то есть лишним кругом рендера, на что справедливо ругался
// React.
const flagListeners = new Set<() => void>();

function subscribeFlags(onChange: () => void): () => void {
  flagListeners.add(onChange);
  return () => {
    flagListeners.delete(onChange);
  };
}

function rememberFlag(key: string): void {
  localStorage.setItem(key, "1");
  flagListeners.forEach((notify) => notify());
}

export function InstallBanner() {
  const { available, trigger, platform, browser, showInstructions, closeInstructions } =
    useInstallApp();
  const [installed, setInstalled] = useState(false);

  const dismissed = useSyncExternalStore(
    subscribeFlags,
    () => localStorage.getItem(DISMISSED_KEY) === "1",
    // На сервере про отказ ничего не знаем: считаем, что плашку не показываем,
    // иначе она мигнёт и исчезнет у тех, кто её уже закрыл.
    () => true,
  );

  /**
   * Сообщение «приложение установлено».
   *
   * Ловим двумя путями, потому что установка бывает разной. В Chrome и Edge
   * браузер присылает событие appinstalled — поздравляем сразу. На iPhone
   * такого события нет вовсе: человек добавляет приложение через «Поделиться»,
   * и узнать об этом можно лишь при следующем запуске — по признаку, что
   * страница открыта уже как приложение. Поэтому второй путь: первый запуск в
   * режиме приложения. Отметку храним, чтобы поздравить один раз.
   */
  useEffect(() => {
    const alreadyWelcomed = localStorage.getItem(WELCOMED_KEY) === "1";

    const celebrate = () => {
      if (localStorage.getItem(WELCOMED_KEY) === "1") return;
      rememberFlag(WELCOMED_KEY);
      setInstalled(true);
      // Сообщение живёт полминуты: успеть прочитать, но не мешать.
      window.setTimeout(() => setInstalled(false), 30_000);
    };

    window.addEventListener("appinstalled", celebrate);

    // Открыто как установленное приложение и мы ещё не поздравляли — значит
    // человек только что его поставил.
    if (!alreadyWelcomed && window.matchMedia("(display-mode: standalone)").matches) {
      celebrate();
    }

    return () => window.removeEventListener("appinstalled", celebrate);
  }, []);

  function dismiss() {
    rememberFlag(DISMISSED_KEY);
  }

  if (installed) {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pb-2">
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-emerald-700 px-3.5 py-3 text-white shadow-[0_16px_34px_-12px_rgba(6,78,59,0.7)]">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <PartyPopper className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold leading-tight">
              Приложение установлено
            </span>
            <span className="mt-0.5 block text-[12px] leading-snug text-white/85">
              {platform === "desktop"
                ? "Ярлык появился на рабочем столе — открывайте оттуда"
                : "Значок появился на главном экране — открывайте оттуда"}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setInstalled(false)}
            aria-label="Закрыть"
            className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
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
