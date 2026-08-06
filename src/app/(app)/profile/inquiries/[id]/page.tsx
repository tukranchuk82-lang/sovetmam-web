import { INQUIRY_TYPE_LABEL } from "@/lib/inquiries";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { getCurrentAppUser } from "@/lib/user-session";
import { getInquiry } from "@/lib/inquiries-db";
import { getThread, markThreadRead } from "@/lib/inquiry-thread";
import { InquiryThread } from "@/components/inquiry-thread";
import { getMeasureBySlug } from "@/lib/measures-db";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentAppUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const inquiry = await getInquiry(id);
  if (!inquiry || inquiry.userId !== user.id) notFound();

  // Человек открыл переписку — значит ответы прочитаны: гасим счётчик.
  const messages = await getThread(inquiry.id);
  await markThreadRead(inquiry.id, "user");

  const measure = inquiry.measureSlug
    ? await getMeasureBySlug(inquiry.measureSlug)
    : null;

  return (
    <article className="px-4 py-5">

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {inquiry.status === "new" ? (
          <Badge variant="outline" className="gap-1 text-amber-600">
            <Clock className="size-3" /> ждёт ответа
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
          · {new Date(inquiry.createdAt).toLocaleDateString("ru-RU")}
        </span>
      </div>

      <h1 className="mt-3 text-xl font-extrabold leading-tight tracking-tight">
        {inquiry.subject}
      </h1>

      {measure && (
        <Link
          href={`/catalog/${measure.slug}`}
          className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {measure.title} <ExternalLink className="size-3" />
        </Link>
      )}

      {/* Всё содержимое обращения теперь живёт в ленте: первый вопрос —
          такое же сообщение, как и остальные. */}
      <InquiryThread inquiryId={inquiry.id} messages={messages} />

      {messages.length === 1 && (
        <p className="mt-4 rounded-xl border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
          Обращение получено. Ответ придёт сюда, в личный кабинет
          {inquiry.userChannel === "telegram"
            ? ", а также в Telegram"
            : inquiry.userChannel === "vk"
              ? ", а также во ВКонтакте"
              : inquiry.userChannel === "max"
                ? ", а также в MAX"
                : ""}
          .
        </p>
      )}

    </article>
  );
}
