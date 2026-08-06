import { INQUIRY_TYPE_LABEL } from "@/lib/inquiries";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, ExternalLink, Send } from "lucide-react";
import { getInquiry } from "@/lib/inquiries-db";
import { getThread, markThreadRead } from "@/lib/inquiry-thread";
import { getMeasureBySlug } from "@/lib/measures-db";
import { replyInquiryAction } from "@/app/admin/inquiries/actions";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CHANNEL_LABELS = {
  telegram: "Telegram",
  vk: "ВКонтакте",
  max: "MAX",
} as const;

const CHANNEL_COLORS = {
  telegram: "#229ED9",
  vk: "#0077FF",
  max: "#7C3AED",
} as const;

export default async function AdminInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inquiry = await getInquiry(id);
  if (!inquiry) notFound();

  // Открыли обращение — сообщения человека считаем прочитанными.
  const messages = await getThread(inquiry.id);
  await markThreadRead(inquiry.id, "staff");
  const waitingForUs = messages.at(-1)?.author === "user";

  const measure = inquiry.measureSlug
    ? await getMeasureBySlug(inquiry.measureSlug)
    : null;
  const reply = replyInquiryAction.bind(null, inquiry.id);

  return (
    <article className="px-4 py-5">
      <Link
        href="/admin/inquiries"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← К списку обращений
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {inquiry.status === "new" ? (
          <Badge variant="outline" className="gap-1 text-amber-600">
            <Clock className="size-3" /> новое
          </Badge>
        ) : (
          <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
            <CheckCircle2 className="size-3" /> отвечено
          </Badge>
        )}
        <Badge variant="secondary">
          {INQUIRY_TYPE_LABEL[inquiry.type]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          · {new Date(inquiry.createdAt).toLocaleString("ru-RU")}
        </span>
      </div>

      <h1 className="mt-3 text-xl font-extrabold leading-tight tracking-tight">
        {inquiry.subject}
      </h1>

      <div className="mt-3 flex items-center gap-2.5 rounded-xl border bg-muted/30 p-2.5">
        <Avatar
          name={inquiry.userName}
          color={
            inquiry.userChannel
              ? CHANNEL_COLORS[inquiry.userChannel]
              : "#1B3A6B"
          }
          size={36}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{inquiry.userName}</p>
          <p className="truncate text-xs font-medium text-muted-foreground">
            {inquiry.region ?? "Регион не указан"}
            {inquiry.userChannel
              ? ` · ${CHANNEL_LABELS[inquiry.userChannel]}`
              : ""}
          </p>
        </div>
      </div>

      {measure && (
        <Link
          href={`/admin/measures/${measure.slug}`}
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Привязано к мере: {measure.title} <ExternalLink className="size-3" />
        </Link>
      )}

      {/* Переписка целиком: вопрос, ответы и уточнения человека подряд. */}
      <section className="mt-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.author === "staff" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[86%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                m.author === "staff"
                  ? "bg-[#1B3A6B] text-white"
                  : "border bg-card text-foreground",
              )}
            >
              <p
                className={cn(
                  "mb-1 text-[11px]",
                  m.author === "staff" ? "text-white/70" : "text-muted-foreground",
                )}
              >
                {m.author === "staff" ? (m.authorName ?? "Мы") : inquiry.userName} ·{" "}
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
      </section>

      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {waitingForUs ? "Ответить" : "Написать ещё"}
      </h2>

      <form action={reply} className="mt-2 space-y-3">
        <textarea
          name="response"
          required
          rows={6}
          placeholder="Напишите ответ. Он придёт человеку в личный кабинет, на почту и в его бот."
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="submit"
          className={cn(buttonVariants(), "h-11 w-full gap-2 text-base")}
        >
          <Send className="size-4" />
          Отправить ответ
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Человек сможет ответить в этой же переписке
        </p>
      </form>
    </article>
  );
}
