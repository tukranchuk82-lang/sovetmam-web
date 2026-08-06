"use client";

import { useActionState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { replyToInquiryAction, type ReplyState } from "@/app/(app)/profile/inquiries/actions";
import type { ThreadMessage } from "@/lib/inquiry-thread";

const INITIAL: ReplyState = { error: null, ok: false };

/**
 * Переписка по обращению глазами человека: лента сообщений и окно ответа.
 *
 * Свои сообщения — справа, ответы «Совета матерей» — слева: так с одного
 * взгляда видно, за кем последнее слово.
 */
export function InquiryThread({
  inquiryId,
  messages,
}: {
  inquiryId: string;
  messages: ThreadMessage[];
}) {
  const [state, action, pending] = useActionState(
    replyToInquiryAction.bind(null, inquiryId),
    INITIAL,
  );

  return (
    <section className="mt-5">
      <h2 className="text-sm font-bold text-muted-foreground">Переписка</h2>

      <div className="mt-3 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.author === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                m.author === "user"
                  ? "bg-[#1B3A6B] text-white"
                  : "border bg-white text-[#2b2f36]",
              )}
            >
              <p
                className={cn(
                  "mb-1 text-[11px]",
                  m.author === "user" ? "text-white/70" : "text-muted-foreground",
                )}
              >
                {m.author === "user" ? "Вы" : (m.authorName ?? "«Совет матерей»")} ·{" "}
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

      {state.ok ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          Сообщение отправлено. Ответ придёт сюда же — и на почту.
        </p>
      ) : (
        <form action={action} className="mt-4">
          <label className="block text-sm font-medium" htmlFor="reply-body">
            Написать ещё
          </label>
          <textarea
            id="reply-body"
            name="body"
            rows={3}
            placeholder="Уточните вопрос или добавьте подробности"
            className="mt-1.5 w-full rounded-xl border border-black/[0.08] bg-white px-3 py-2.5 text-sm shadow-sm focus:border-[#1B3A6B]/40 focus:outline-none"
          />

          {state.error && (
            <p className="mt-2 text-sm font-medium text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B3A6B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Send className="size-4" />
            {pending ? "Отправляем…" : "Отправить"}
          </button>
        </form>
      )}
    </section>
  );
}
