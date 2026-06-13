"use client";

import { useEffect, useState } from "react";
import {
  Download,
  X,
  Share,
  Plus,
  MoreVertical,
  MonitorDown,
  AppWindow,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallWindow = Window & {
  __deferredInstallPrompt?: BeforeInstallPromptEvent | null;
};

type Platform = "ios" | "android" | "desktop" | "unknown";
type Browser = "chromium" | "safari" | "firefox" | "other";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  // iPadOS 13+ выдаёт себя за Mac — ловим по тач-экрану
  const isTouchMac =
    /macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (/ipad|iphone|ipod/.test(ua) || isTouchMac) return "ios";
  if (/android/.test(ua)) return "android";
  if (/windows|mac|linux|cros/.test(ua)) return "desktop";
  return "unknown";
}

function detectBrowser(): Browser {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (/firefox|fxios/.test(ua)) return "firefox";
  // Chrome/Edge/Opera/Brave — все на Chromium и поддерживают установку
  if (/edg|chrome|chromium|crios|opr/.test(ua)) return "chromium";
  if (/safari/.test(ua)) return "safari";
  return "other";
}

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [browser, setBrowser] = useState<Browser>("other");

  useEffect(() => {
    setPlatform(detectPlatform());
    setBrowser(detectBrowser());

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Событие могло прийти ещё до монтирования — ранний скрипт в layout
    // сохранил его в window.__deferredInstallPrompt.
    const w = window as InstallWindow;
    if (w.__deferredInstallPrompt) {
      setInstallPrompt(w.__deferredInstallPrompt);
    }

    const captured = () => {
      const ev = (window as InstallWindow).__deferredInstallPrompt;
      if (ev) setInstallPrompt(ev);
    };
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("pwa-installable", captured);
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("pwa-installable", captured);
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (isInstalled) return null;

  async function handleClick() {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        await installPrompt.userChoice;
      } catch {
        // Событие одноразовое: при повторном prompt() браузер кинет ошибку —
        // безопасно игнорируем.
      }
      // Событие израсходовано в любом случае (установил/отклонил).
      setInstallPrompt(null);
      (window as InstallWindow).__deferredInstallPrompt = null;
    } else {
      setShowInstructions(true);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/20 bg-brand/5 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/10",
        )}
      >
        <Download className="size-4" />
        Установить приложение
      </button>

      {showInstructions && (
        <InstructionsModal
          platform={platform}
          browser={browser}
          onClose={() => setShowInstructions(false)}
        />
      )}
    </>
  );
}

const SUBTITLE: Record<Platform, string> = {
  ios: "Иконка появится на главном экране телефона",
  android: "Иконка появится на главном экране телефона",
  desktop: "Ярлык появится на рабочем столе компьютера",
  unknown: "Иконка появится на вашем устройстве",
};

function InstructionsModal({
  platform,
  browser,
  onClose,
}: {
  platform: Platform;
  browser: Browser;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 pt-16 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-stone-100"
        >
          <X className="size-4" />
        </button>

        <h2 className="pr-8 text-lg font-extrabold">Установить приложение</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {SUBTITLE[platform]}
        </p>

        <div className="mt-4 space-y-3">
          {platform === "ios" ? (
            <IosGuide />
          ) : platform === "android" ? (
            <AndroidSteps />
          ) : platform === "desktop" ? (
            <DesktopSteps browser={browser} />
          ) : (
            <>
              <IosSteps />
              <div className="my-2 border-t" />
              <AndroidSteps />
              <div className="my-2 border-t" />
              <DesktopSteps browser={browser} />
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white shadow-[0_4px_14px_-4px_rgba(15,138,106,0.5)] hover:bg-brand/90"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}

/**
 * Наглядный гид для iPhone/iPad. На iOS установку нельзя запустить из кода
 * (ограничение Apple) — поэтому делаем шаги максимально простыми и крупными.
 */
function IosGuide() {
  return (
    <div className="space-y-3">
      <p className="text-center text-xs font-medium text-muted-foreground">
        Займёт 10 секунд — всего два шага
      </p>

      <NumberedStep
        n={1}
        text={
          <>
            Нажмите кнопку{" "}
            <span className="inline-flex translate-y-0.5 items-center rounded-md bg-[#229ED9]/10 px-1.5 py-0.5 font-semibold text-[#229ED9]">
              <Share className="size-3.5" />
            </span>{" "}
            «Поделиться» — она внизу экрана по центру
          </>
        }
      />
      <NumberedStep
        n={2}
        text={
          <>
            Пролистайте список и выберите{" "}
            <span className="font-semibold">«На экран „Домой“»</span>, затем
            «Добавить»
          </>
        }
      />

      {/* Подсказка-стрелка к реальной кнопке «Поделиться» внизу Safari */}
      <div className="flex flex-col items-center pt-1 text-brand">
        <span className="text-xs font-semibold">
          Кнопка «Поделиться» — внизу
        </span>
        <ArrowDown className="size-5 animate-bounce" />
      </div>
    </div>
  );
}

function NumberedStep({ n, text }: { n: number; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-stone-50 p-3.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-[0_4px_10px_-3px_rgba(15,138,106,0.6)]">
        {n}
      </span>
      <span className="flex-1 pt-0.5 text-sm leading-snug">{text}</span>
    </div>
  );
}

function IosSteps() {
  return (
    <Steps title="iPhone / iPad (Safari)">
      <Step
        icon={<Share className="size-4" />}
        text="Нажмите кнопку «Поделиться» внизу экрана"
      />
      <Step
        icon={<Plus className="size-4" />}
        text="Выберите «На экран „Домой“» и подтвердите"
      />
    </Steps>
  );
}

function AndroidSteps() {
  return (
    <Steps title="Android (Chrome)">
      <Step
        icon={<MoreVertical className="size-4" />}
        text="Откройте меню ⋮ в правом верхнем углу"
      />
      <Step
        icon={<Plus className="size-4" />}
        text="Нажмите «Установить приложение»"
      />
    </Steps>
  );
}

function DesktopSteps({ browser }: { browser: Browser }) {
  if (browser === "safari") {
    return (
      <Steps title="Mac (Safari)">
        <Step
          icon={<Share className="size-4" />}
          text="Нажмите «Поделиться» в панели браузера"
        />
        <Step
          icon={<Plus className="size-4" />}
          text="Выберите «Добавить в Dock»"
        />
      </Steps>
    );
  }

  if (browser === "firefox") {
    return (
      <Steps title="Компьютер (Firefox)">
        <Step
          icon={<AppWindow className="size-4" />}
          text="Firefox не умеет устанавливать приложения напрямую"
        />
        <Step
          icon={<MonitorDown className="size-4" />}
          text="Откройте сайт в Chrome, Edge или Safari и нажмите «Установить»"
        />
      </Steps>
    );
  }

  // Chromium (Chrome, Edge, Opera, Brave) и всё остальное
  return (
    <Steps title="Компьютер (Chrome / Edge)">
      <Step
        icon={<MonitorDown className="size-4" />}
        text="Нажмите значок установки ⊕ в правой части адресной строки"
      />
      <Step
        icon={<Plus className="size-4" />}
        text="Подтвердите «Установить» — ярлык появится на рабочем столе"
      />
    </Steps>
  );
}

function Steps({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-stone-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="mt-2 space-y-2">{children}</ul>
    </div>
  );
}

function Step({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand ring-1 ring-stone-200">
        {icon}
      </span>
      <span className="flex-1">{text}</span>
    </li>
  );
}
