"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatAuthor, ChatMessage } from "@/lib/coordinator-chat-db";

export type ChatSendState = { error: string | null; ok: boolean };
const INITIAL: ChatSendState = { error: null, ok: false };

/**
 * Лента внутреннего чата с координатором — общая для обеих сторон.
 *
 * Диалоговое окно — светлая, почти белая панель (лежит либо на тёмном фоне
 * страницы пользователя, либо на светлом фоне админки — само по себе не
 * зависит от того, что вокруг). Сообщения оформлены как в Telegram: обе
 * стороны на светлых бабблах, разница только в тонком оттенке — тёмным
 * фоном реплики не выделяем, это был явный запрос клиента.
 *
 * В отличие от «Обращений» это непрерывная переписка без «отправлено,
 * дальше только на почту»: после отправки поле просто очищается и остаётся
 * готовым к следующему сообщению, как в мессенджере.
 */
export function CoordinatorChatThread({
  messages,
  viewer,
  counterpartName,
  sendAction,
}: {
  messages: ChatMessage[];
  viewer: ChatAuthor;
  counterpartName: string;
  sendAction: (prev: ChatSendState, fd: FormData) => Promise<ChatSendState>;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(sendAction, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <section className="rounded-3xl bg-[#F7F6F3] p-3 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.45)]">
      <div className="min-h-[120px] space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageCircle className="size-6 text-[#1B3A6B]/25" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground/70">
              Переписки пока нет — напишите первое сообщение ниже.
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.author === viewer ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                m.author === viewer
                  ? "bg-[#DCEBFF] text-[#12213F]"
                  : "border border-black/[0.06] bg-white text-[#2b2f36]",
              )}
            >
              <p
                className={cn(
                  "mb-1 text-[11px]",
                  m.author === viewer ? "text-[#1B3A6B]/60" : "text-muted-foreground",
                )}
              >
                {m.author === viewer ? "Вы" : counterpartName} ·{" "}
                {new Date(m.createdAt).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {m.body}
            </div>
          </div>
        ))}
      </div>

      {/* Строка ввода — единственное место на экране, где нужно действовать
          прямо сейчас: рамка, тень и цветная кнопка отправки делают её
          заметной с первого взгляда, без чтения подписей. */}
      <form
        ref={formRef}
        action={action}
        className="mt-3 flex items-end gap-2 rounded-2xl border border-black/[0.06] bg-white p-2 shadow-[0_6px_18px_-8px_rgba(27,58,107,0.25)] transition-shadow focus-within:border-[#1B3A6B]/40 focus-within:shadow-[0_6px_18px_-6px_rgba(27,58,107,0.35)]"
      >
        <textarea
          name="body"
          rows={2}
          required
          placeholder="Написать сообщение…"
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Отправить"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-[#1B3A6B] text-white shadow-[0_4px_12px_-4px_rgba(27,58,107,0.6)] transition-transform active:scale-95 disabled:opacity-60"
        >
          <Send className="size-4" />
        </button>
      </form>

      {state.error && (
        <p className="mt-2 px-1 text-sm font-medium text-red-600">{state.error}</p>
      )}
    </section>
  );
}
