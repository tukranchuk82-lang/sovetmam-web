"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { recordShareAction } from "@/app/share-actions";
import { SHARE_SOURCE } from "@/lib/share-source";
import { cn } from "@/lib/utils";

/**
 * Кнопка «Поделиться».
 *
 * На телефоне открывает родное окно выбора — оттуда ссылка уходит в тот же
 * WhatsApp или Telegram в два касания. На компьютере такого окна нет, поэтому
 * просто копируем ссылку в буфер и говорим об этом.
 *
 * В ссылку добавляем метку utm_source=share: по ней в админке видно, сколько
 * людей пришло из пересылок, а не из поиска или бота. Метка та же, которой
 * размечены рассылки, поэтому она заодно попадает в профиль при регистрации.
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

export function ShareButton({
  path,
  title,
  text,
  variant = "button",
  className,
}: Props) {
  const [done, setDone] = useState<null | "sent" | "copied">(null);

  async function share() {
    // Ссылку строим здесь, а не на сервере: адрес приложения известен
    // браузеру, а лишний запрос ради одной строки ни к чему.
    const url = new URL(path, window.location.origin);
    url.searchParams.set("utm_source", SHARE_SOURCE);
    const link = url.toString();

    // Родное окно выбора есть на телефонах, а в Windows — ещё и в Edge с
    // Chrome. Но открывается оно не всегда: браузер вправе отказать, и тогда
    // нельзя оставлять человека с кнопкой, по которой ничего не происходит.
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: link });
        setDone("sent");
        void recordShareAction({ path, channel: "through" });
        return;
      } catch (e) {
        // Человек сам закрыл окно выбора — это не ошибка, ничего не делаем и
        // тем более не считаем, что поделились.
        if ((e as Error).name === "AbortError") return;
        // Любой другой отказ — молча переходим к копированию ссылки.
      }
    }

    try {
      await navigator.clipboard.writeText(link);
      setDone("copied");
      void recordShareAction({ path, channel: "copy" });
    } catch {
      // Буфер обмена закрыт настройками браузера — показываем ссылку, чтобы
      // человек скопировал её сам.
      window.prompt("Скопируйте ссылку", link);
    }

    window.setTimeout(() => setDone(null), 4000);
  }

  const label =
    done === "sent"
      ? "Отправлено"
      : done === "copied"
        ? "Ссылка скопирована"
        : "Поделиться";

  if (variant === "wide") {
    return (
      <button
        type="button"
        onClick={share}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#22457B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1B3762]",
          className,
        )}
      >
        {done ? <Check className="size-4" /> : <Share2 className="size-4" />}
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={share}
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
}
