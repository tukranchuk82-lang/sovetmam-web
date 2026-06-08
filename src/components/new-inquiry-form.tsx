"use client";

import { useState, useTransition } from "react";
import { Send, MessageCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type InquiryType = "question" | "proposal";

export function NewInquiryForm({
  action,
  initialType,
  measureSlug,
  measureTitle,
}: {
  action: (fd: FormData) => Promise<void>;
  initialType: InquiryType;
  measureSlug: string | null;
  measureTitle: string | null;
}) {
  const [type, setType] = useState<InquiryType>(initialType);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(fd) => startTransition(() => action(fd))}
      className="space-y-4"
    >
      <input type="hidden" name="type" value={type} />
      {measureSlug && (
        <input type="hidden" name="measureSlug" value={measureSlug} />
      )}

      <div className="grid grid-cols-2 gap-2">
        <TypeChip
          active={type === "question"}
          onClick={() => setType("question")}
          icon={<MessageCircle className="size-5" />}
          title="Вопрос"
          hint="про мою ситуацию"
        />
        <TypeChip
          active={type === "proposal"}
          onClick={() => setType("proposal")}
          icon={<Lightbulb className="size-5" />}
          title="Предложение"
          hint="внедрить меру"
        />
      </div>

      {measureTitle && (
        <div className="rounded-xl border bg-muted/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Привязано к мере:</span>{" "}
          <span className="font-medium">{measureTitle}</span>
        </div>
      )}

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">
          {type === "question" ? "Кратко о вашей ситуации" : "Название идеи"}
        </span>
        <input
          name="subject"
          required
          maxLength={120}
          placeholder={
            type === "question"
              ? "например: «многодетная семья, переезд в Москву»"
              : "например: «компенсация за детский лагерь»"
          }
          className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">
          {type === "question" ? "Подробнее" : "Описание"}
        </span>
        <textarea
          name="body"
          required
          rows={6}
          placeholder={
            type === "question"
              ? "Опишите ситуацию: возраст детей, регион, чем нужна помощь…"
              : "Какая мера поддержки была бы полезна? Кому она нужна?"
          }
          className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className={cn(
          buttonVariants(),
          "h-12 w-full gap-2 text-base disabled:opacity-60",
        )}
      >
        <Send className="size-4" />
        {pending ? "Отправка…" : "Отправить обращение"}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Ответ обычно приходит в течение 1–3 рабочих дней
      </p>
    </form>
  );
}

function TypeChip({
  active,
  onClick,
  icon,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors",
        active
          ? "border-primary bg-primary/10"
          : "bg-background hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight">
          {title}
        </span>
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
