"use client";

import { useState, useTransition } from "react";
import { Send, MessageCircle, Lightbulb, FileEdit } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { FEDERAL_REGION, type InquiryType } from "@/lib/inquiries";

export function NewInquiryForm({
  action,
  initialType,
  measureSlug,
  measureTitle,
  regions,
  defaultRegion,
}: {
  action: (fd: FormData) => Promise<void>;
  initialType: InquiryType;
  measureSlug: string | null;
  measureTitle: string | null;
  regions: readonly string[];
  defaultRegion: string;
}) {
  const [type, setType] = useState<InquiryType>(initialType);
  const [pending, startTransition] = useTransition();

  const isClarification = type === "clarification";

  return (
    <form
      action={(fd) => startTransition(() => action(fd))}
      className="space-y-4"
    >
      <input type="hidden" name="type" value={type} />
      {measureSlug && (
        <input type="hidden" name="measureSlug" value={measureSlug} />
      )}

      <div className="grid grid-cols-3 gap-2">
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
          title="Идея"
          hint="внедрить меру"
        />
        <TypeChip
          active={isClarification}
          onClick={() => setType("clarification")}
          icon={<FileEdit className="size-5" />}
          title="Уточнение"
          hint="по мере поддержки"
        />
      </div>

      {measureTitle && (
        <div className="rounded-xl border bg-muted/40 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Привязано к мере:</span>{" "}
          <span className="font-medium">{measureTitle}</span>
        </div>
      )}

      {/* Уточнение всегда о конкретной мере: если пришли не со страницы меры,
          спрашиваем её название первым делом. */}
      {isClarification && !measureTitle && (
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            О какой мере поддержки <span className="text-brand">*</span>
          </span>
          <input
            name="subject"
            required
            maxLength={160}
            placeholder="например: «Единое пособие на детей до 17 лет»"
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
      )}

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">
          {isClarification ? "Регион меры" : "Регион"}{" "}
          <span className="text-brand">*</span>
        </span>
        <select
          name="region"
          required
          defaultValue={defaultRegion}
          className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="" disabled>
            Выберите регион
          </option>
          {/* Уточнение может касаться федеральной меры — тогда региона у неё нет. */}
          {isClarification && (
            <option value={FEDERAL_REGION}>{FEDERAL_REGION} (действует по всей стране)</option>
          )}
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      {/* У уточнения роль «темы» играет название меры — второй раз не спрашиваем. */}
      {!(isClarification && !measureTitle) && (
        <label className="block">
          <span className="text-xs font-medium text-muted-foreground">
            {type === "question"
              ? "Кратко о вашей ситуации"
              : isClarification
                ? "Кратко о чём уточнение"
                : "Название идеи"}
          </span>
          <input
            name="subject"
            required
            maxLength={160}
            defaultValue={isClarification && measureTitle ? measureTitle : undefined}
            placeholder={
              type === "question"
                ? "например: «многодетная семья, переезд в Москву»"
                : isClarification
                  ? "например: «изменилась сумма выплаты»"
                  : "например: «компенсация за детский лагерь»"
            }
            className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
      )}

      <label className="block">
        <span className="text-xs font-medium text-muted-foreground">
          {type === "question"
            ? "Подробнее"
            : isClarification
              ? "Ваши уточнения"
              : "Описание"}{" "}
          <span className="text-brand">*</span>
        </span>
        <textarea
          name="body"
          required
          rows={6}
          placeholder={
            type === "question"
              ? "Опишите ситуацию: возраст детей, регион, чем нужна помощь…"
              : isClarification
                ? "Что не так с мерой: устарела сумма, изменились условия, неверная ссылка? Если знаете источник — приложите ссылку."
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
        "flex flex-col gap-1.5 rounded-xl border p-2.5 text-left transition-colors",
        active ? "border-primary bg-primary/10" : "bg-background hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-tight">
          {title}
        </span>
        <span className="text-[11px] leading-tight text-muted-foreground">
          {hint}
        </span>
      </span>
    </button>
  );
}
