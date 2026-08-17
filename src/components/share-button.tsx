"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Share2, Check, Copy, X, MoreHorizontal } from "lucide-react";
import { recordShareAction, type ShareChannel } from "@/app/share-actions";
import { SHARE_SOURCE } from "@/lib/share-source";
import { cn } from "@/lib/utils";

/**
 * Кнопка «Поделиться» с выбором мессенджера.
 *
 * Раньше кнопка сразу открывала родное окно выбора приложений. На телефоне оно
 * есть, но показывает не то: системный список зависит от того, какие приложения
 * зарегистрировали себя как «принимающие текст», и Telegram с MAX в нём часто не
 * оказывается. На компьютере окна нет вовсе, и оставалось только копирование
 * ссылки. Поэтому предлагаем мессенджеры сами, прямым переходом (правка
 * заказчика 17.08.2026).
 *
 * В ссылку добавляем метку utm_source=share: по ней в админке видно, сколько
 * людей пришло из пересылок, а не из поиска или бота. В базу пишем ещё и то,
 * каким способом поделились, — чтобы знать, куда родители носят ссылки.
 */

type Props = {
  /** Путь внутри приложения: "/" или "/catalog/<мера>". */
  path: string;
  /** Что увидит человек в окне «Поделиться». */
  title: string;
  text?: string;
  variant?: "button" | "wide";
  className?: string;
};

/**
 * Адреса пересылки.
 *
 * Telegram и «ВКонтакте» принимают ссылку и подпись отдельными параметрами и
 * сами собирают карточку. MAX умеет только текст (`:share?text=`, документация
 * dev.max.ru/help/deeplinks), поэтому ссылку вклеиваем в текст. WhatsApp
 * устроен так же.
 */
const TARGETS: {
  key: ShareChannel;
  label: string;
  /** Цвет кружка — узнаваемый цвет мессенджера. */
  color: string;
  glyph: React.ReactNode;
  href: (link: string, caption: string) => string;
}[] = [
  {
    key: "telegram",
    label: "Telegram",
    color: "#2AABEE",
    glyph: <PlaneGlyph />,
    href: (link, caption) =>
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(caption)}`,
  },
  {
    key: "max",
    label: "MAX",
    color: "#7A5CFF",
    glyph: <span className="text-[17px] font-bold leading-none">M</span>,
    href: (link, caption) =>
      `https://max.ru/:share?text=${encodeURIComponent(`${caption}\n${link}`)}`,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    glyph: <ChatGlyph />,
    href: (link, caption) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${caption}\n${link}`)}`,
  },
  {
    key: "vk",
    label: "ВКонтакте",
    color: "#0077FF",
    glyph: <span className="text-[13px] font-bold leading-none">VK</span>,
    href: (link, caption) =>
      `https://vk.com/share.php?url=${encodeURIComponent(link)}&title=${encodeURIComponent(caption)}`,
  },
];

export function ShareButton({
  path,
  title,
  text,
  variant = "button",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<null | "sent" | "copied">(null);

  // Ссылку строим в браузере: адрес приложения ему известен, а лишний запрос
  // ради одной строки ни к чему.
  function buildLink(): string {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("utm_source", SHARE_SOURCE);
    return url.toString();
  }

  const caption = text ?? title;

  function note(channel: ShareChannel) {
    void recordShareAction({ path, channel });
  }

  function flash(state: "sent" | "copied") {
    setDone(state);
    window.setTimeout(() => setDone(null), 4000);
  }

  async function copyLink() {
    const link = buildLink();
    try {
      await navigator.clipboard.writeText(link);
      note("copy");
      setOpen(false);
      flash("copied");
    } catch {
      // Буфер обмена закрыт настройками браузера — показываем ссылку, чтобы
      // человек скопировал её сам.
      window.prompt("Скопируйте ссылку", link);
    }
  }

  async function nativeShare() {
    const link = buildLink();
    try {
      await navigator.share({ title, text, url: link });
      note("through");
      setOpen(false);
      flash("sent");
    } catch (e) {
      // Человек сам закрыл окно выбора — это не ошибка, и делиться он не стал.
      if ((e as Error).name === "AbortError") return;
      await copyLink();
    }
  }

  const label =
    done === "sent"
      ? "Отправлено"
      : done === "copied"
        ? "Ссылка скопирована"
        : "Поделиться";

  const trigger =
    variant === "wide" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#22457B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1B3762]",
          className,
        )}
      >
        {done ? <Check className="size-4" /> : <Share2 className="size-4" />}
        {label}
      </button>
    ) : (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#D9D2C6] bg-white px-5 text-sm font-semibold text-[#3A4D63] transition-colors hover:bg-[#F7F4EE]",
          className,
        )}
      >
        {done ? (
          <Check className="size-4 text-emerald-700" />
        ) : (
          <Share2 className="size-4" />
        )}
        {label}
      </button>
    );

  return (
    <>
      {trigger}
      {/* Окно рисуем в конце страницы, а не рядом с кнопкой. Кнопка стоит в
          столбике кнопок с общим отступом между ними (space-y), и этот отступ
          доставался окну тоже: его нижний край поднимался на десять точек, и
          из-под него выглядывала полоса нижнего меню. Заодно окно перестаёт
          зависеть от того, что происходит с вёрсткой вокруг кнопки. */}
      {open &&
        createPortal(
          <ShareSheet
            caption={caption}
            buildLink={buildLink}
            // «Отправлено» здесь не пишем: ссылка ушла в мессенджер, а отправил
            // человек её или передумал в чужом окне — нам не видно. Врать
            // подписью хуже, чем промолчать: открывшийся Telegram и так виден.
            onPick={(channel) => {
              note(channel);
              setOpen(false);
            }}
            onCopy={copyLink}
            onNative={nativeShare}
            onClose={() => setOpen(false)}
          />,
          document.body,
        )}
    </>
  );
}

function ShareSheet({
  caption,
  buildLink,
  onPick,
  onCopy,
  onNative,
  onClose,
}: {
  caption: string;
  buildLink: () => string;
  onPick: (channel: ShareChannel) => void;
  onCopy: () => void;
  onNative: () => void;
  onClose: () => void;
}) {
  // Ссылку считаем один раз при открытии: в разметке она попадает в href, и
  // пересчитывать её на каждой отрисовке незачем.
  const [link] = useState(buildLink);

  // Родное окно выбора приложений оставляем как «другие приложения»: кому-то
  // нужна почта, заметки или мессенджер, которого нет в нашем списке. На
  // компьютере такого окна обычно нет — тогда и строку не показываем.
  // Проверяем прямо при отрисовке: окно появляется только после нажатия, на
  // сервере эта разметка не строится, и рассинхрона с ней быть не может.
  const hasNative = typeof navigator.share === "function";

  // Закрытие по Escape — на компьютере это первое, что пробуют.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Поделиться ссылкой"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[480px] rounded-t-3xl bg-white pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-3xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="text-lg font-extrabold">Поделиться</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Выберите, куда отправить ссылку
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-stone-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 px-3">
          {TARGETS.map((t) => (
            <a
              key={t.key}
              href={t.href(link, caption)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onPick(t.key)}
              className="flex flex-col items-center gap-1.5 rounded-2xl px-1 py-3 transition-colors hover:bg-stone-50 active:bg-stone-100"
            >
              <span
                className="flex size-11 items-center justify-center rounded-full text-white"
                style={{ background: t.color }}
              >
                {t.glyph}
              </span>
              <span className="text-[11px] font-medium leading-tight text-[#3A4D63]">
                {t.label}
              </span>
            </a>
          ))}
        </div>

        <div className="mt-2 space-y-2 px-5">
          <button
            type="button"
            onClick={onCopy}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#D9D2C6] bg-white text-sm font-semibold text-[#3A4D63] transition-colors hover:bg-[#F7F4EE]"
          >
            <Copy className="size-4" /> Скопировать ссылку
          </button>
          {hasNative && (
            <button
              type="button"
              onClick={onNative}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-[#22457B] transition-colors hover:bg-[#F2F5FA]"
            >
              <MoreHorizontal className="size-4" /> Другие приложения
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Бумажный самолётик — Telegram. */
function PlaneGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M21.6 4.2 3.1 11.1c-.9.3-.9 1.6.1 1.9l4.4 1.3 1.7 5.1c.3.8 1.3 1 1.8.3l2.2-2.6 4.3 3.1c.7.5 1.6.1 1.8-.7l3.2-14c.2-.9-.7-1.6-1.5-1.3zM9.5 14.2l8.2-6.4-6.6 7.6-.1 3-1.5-4.2z" />
    </svg>
  );
}

/** Облачко сообщения — WhatsApp. */
function ChatGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M12 2.8c-5 0-9.1 4-9.1 9 0 1.6.4 3.1 1.2 4.4L2.8 21l5-1.3c1.3.7 2.7 1 4.2 1 5 0 9.1-4 9.1-9s-4.1-8.9-9.1-8.9zm4.8 12.4c-.2.6-1.2 1.1-1.7 1.2-.4 0-1 0-1.7-.3-1.9-.8-3.4-2.3-4.3-4-.4-.7-.6-1.4-.6-1.9 0-.6.3-1.4.8-1.7.2-.1.4-.2.6-.1h.4c.2 0 .3.1.4.4l.6 1.4c.1.2 0 .4-.1.5l-.3.4c-.1.1-.2.3-.1.5.4.8 1.4 1.8 2.2 2.2.2.1.4 0 .5-.1l.4-.4c.1-.2.3-.2.5-.1l1.4.7c.2.1.3.2.3.4.1.3 0 .6-.1.8z" />
    </svg>
  );
}
