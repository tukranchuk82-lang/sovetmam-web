"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { Drawer } from "@/components/admin/ui/drawer";
import { dismissChatNotifyAction } from "@/app/(app)/profile/coordinator-chat/actions";

/**
 * Кнопка «Уведомления» над перепиской. Сама панель настроек готовится на
 * сервере и приходит как children — здесь только открытие и закрытие.
 *
 * Пока человека не спрашивали про уведомления, это заметная зелёная плашка с
 * крестиком: крестик закрывает её насовсем (запоминается в профиле), и остаётся
 * тихая строка «Уведомления» без заливки — настройки по-прежнему под рукой.
 */
export function ChatNotifyDrawer({
  highlight,
  title = "Уведомления",
  subtitle = "О новых вопросах в чате",
  children,
}: {
  highlight: boolean;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function dismiss() {
    startTransition(async () => {
      await dismissChatNotifyAction();
      router.refresh();
    });
  }

  return (
    <>
      {highlight ? (
        <div className="flex items-stretch overflow-hidden rounded-xl bg-[#2FA36B] text-white shadow-[0_6px_16px_-8px_rgba(47,163,107,0.9)]">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold transition-colors hover:bg-[#28915E]"
          >
            <Bell className="size-4 shrink-0" />
            <span className="min-w-0 flex-1">Включить уведомления</span>
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Закрыть"
            title="Закрыть"
            className="grid w-10 shrink-0 place-items-center text-white/85 transition-colors hover:bg-[#28915E] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12.5px] font-medium text-white/60 transition-colors hover:bg-white/[0.07] hover:text-white"
        >
          <Bell className="size-3.5 shrink-0" />
          Уведомления
        </button>
      )}
      <Drawer open={open} onClose={() => setOpen(false)} title={title} subtitle={subtitle}>
        {children}
      </Drawer>
    </>
  );
}
