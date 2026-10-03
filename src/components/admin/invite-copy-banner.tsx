"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Link2, UserPlus } from "lucide-react";

/**
 * Приглашение на сводке: светлая полоса вместо тёмной карточки — это не раздел
 * для просмотра, а действие. Ссылка спрятана под значком: нажали — она в
 * буфере обмена, и появилась подпись «Ссылка скопирована».
 */
export function InviteCopyBanner({
  link,
  invited,
  sample,
}: {
  link: string;
  invited: number;
  /** Образец вместо личной ссылки — для владельца и техспеца, смотрящих «на себе». */
  sample: boolean;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2600);
    return () => window.clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Буфер закрыт настройками браузера — запасной способ через скрытое поле.
      const ta = document.createElement("textarea");
      ta.value = link;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        window.prompt("Скопируйте ссылку", link);
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-[#F6EDE8] p-4 text-[#2b2f36] sm:px-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#8E1D2C] text-white">
          <UserPlus className="size-5" />
        </span>
        <div className="min-w-0 flex-1 basis-[200px]">
          <p className="text-[15px] font-bold leading-snug">Пригласить пользователя</p>
          <p className="text-[13px] text-[#6b5a55]">
            {sample ? "Образец ссылки: у координатора она личная" : `Пришли по вашей ссылке: ${invited}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={copy}
            aria-label="Скопировать пригласительную ссылку"
            title="Скопировать ссылку"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#8E1D2C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#74111F] active:scale-[0.98]"
          >
            {copied ? <Check className="size-[18px]" /> : <Link2 className="size-[18px]" />}
            {copied ? "Скопировано" : "Ссылка"}
          </button>
          <Link
            href="/admin/invite"
            className="hidden h-11 items-center rounded-xl px-3 text-[13px] font-semibold text-[#8E1D2C] hover:underline sm:inline-flex"
          >
            Поделиться
          </Link>
        </div>
      </div>

      {/* Всплывающее подтверждение. */}
      <div
        role="status"
        aria-live="polite"
        className={
          "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-200 " +
          (copied ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")
        }
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#2b2f36] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)]">
          <Check className="size-4 text-emerald-600" />
          Ссылка скопирована
        </span>
      </div>
    </>
  );
}
