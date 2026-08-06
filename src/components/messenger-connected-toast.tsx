"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

/**
 * «Мессенджер подключён» — сообщение после перехода из бота.
 *
 * Раньше о подключении сообщал сам бот, и человек узнавал об этом, вернувшись
 * в переписку. Теперь подключение происходит молча в момент перехода, поэтому
 * сказать об этом должно приложение — иначе непонятно, случилось ли что-нибудь.
 *
 * Метку `mc=1` из адреса убираем сразу: незачем оставлять её в истории и в
 * ссылке, которой человек может поделиться.
 */
export function MessengerConnectedToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // Показываем ровно пока в адресе есть метка и её не закрыли руками.
  const flagged = params.get("mc") === "1";
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!flagged) return;

    // Через двадцать секунд прячем сообщение и заодно убираем метку из адреса.
    // Убирать её сразу нельзя: сообщение исчезло бы вместе с ней.
    const timer = window.setTimeout(() => {
      setHidden(true);
      const rest = new URLSearchParams(params.toString());
      rest.delete("mc");
      const query = rest.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 20_000);

    return () => window.clearTimeout(timer);
  }, [flagged, params, pathname, router]);

  if (!flagged || hidden) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-3 pb-2">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-emerald-700 px-3.5 py-3 text-white shadow-[0_16px_34px_-12px_rgba(6,78,59,0.7)]">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <CheckCircle2 className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold leading-tight">
            Мессенджер подключён
          </span>
          <span className="mt-0.5 block text-[12px] leading-snug text-white/85">
            Будем присылать туда ответы и подобранные меры
          </span>
        </span>
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Закрыть"
          className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
