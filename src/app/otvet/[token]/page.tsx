import { CheckCircle2, Clock, MapPin, AlertTriangle } from "lucide-react";
import { INQUIRY_TYPE_LABEL } from "@/lib/inquiries";
import { getInquiry } from "@/lib/inquiries-db";
import { verifyReplyToken } from "@/lib/inquiry-token";
import { getMeasureBySlug } from "@/lib/measures-db";
import { OrgName } from "@/components/org-name";
import { Badge } from "@/components/ui/badge";
import { replyByTokenAction } from "./actions";

export const metadata = {
  title: "Ответ на обращение",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Форма ответа по ссылке из письма. Открывается без входа в приложение —
 * право отвечать даёт подписанный токен в адресе.
 */
export default async function ReplyByTokenPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { token } = await params;
  const { sent } = await searchParams;

  const check = verifyReplyToken(token);
  if (!check.ok) {
    return (
      <Shell>
        <Notice
          icon={<AlertTriangle className="size-5 text-amber-600" />}
          title={
            check.reason === "expired"
              ? "Срок действия ссылки истёк"
              : "Ссылка недействительна"
          }
          text={
            check.reason === "expired"
              ? "Ссылка из письма действует 14 дней. Ответить на обращение можно в админ-панели приложения."
              : "Похоже, ссылка повреждена при копировании. Откройте её из письма целиком или ответьте в админ-панели."
          }
        />
      </Shell>
    );
  }

  const inquiry = await getInquiry(check.inquiryId);
  if (!inquiry) {
    return (
      <Shell>
        <Notice
          icon={<AlertTriangle className="size-5 text-amber-600" />}
          title="Обращение не найдено"
          text="Возможно, его удалили."
        />
      </Shell>
    );
  }

  const measure = inquiry.measureSlug
    ? await getMeasureBySlug(inquiry.measureSlug).catch(() => null)
    : null;

  // Уже отвечено — показываем ответ, а не пустую форму: по ссылке из письма
  // легко зайти второй раз и продублировать ответ.
  if (inquiry.status === "answered" || sent) {
    return (
      <Shell>
        <Notice
          icon={<CheckCircle2 className="size-5 text-emerald-600" />}
          title="Ответ отправлен"
          text="Человек уже видит его в приложении. Уведомления ушли на почту и в мессенджер, если он подключён."
        />
        <div className="mt-4 rounded-2xl border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Обращение
          </p>
          <p className="mt-1 font-semibold leading-snug">{inquiry.subject}</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">
            {inquiry.body}
          </p>
          {inquiry.response && (
            <>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ваш ответ
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{inquiry.response}</p>
            </>
          )}
        </div>
      </Shell>
    );
  }

  const action = replyByTokenAction.bind(null, token);

  return (
    <Shell>
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="gap-1 text-amber-600">
            <Clock className="size-3" /> ждёт ответа
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {INQUIRY_TYPE_LABEL[inquiry.type]}
          </Badge>
          {inquiry.region && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
              <MapPin className="size-3" />
              {inquiry.region}
            </span>
          )}
        </div>

        <h1 className="mt-2 text-lg font-extrabold leading-snug">
          {inquiry.subject}
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          {inquiry.userName}
          {measure ? ` · о мере «${measure.title}»` : ""}
        </p>

        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
          {inquiry.body}
        </p>
      </div>

      <form action={action} className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="response"
            className="text-sm font-bold uppercase tracking-wide text-muted-foreground"
          >
            Ваш ответ
          </label>
          <textarea
            id="response"
            name="response"
            required
            rows={8}
            autoFocus
            placeholder="Напишите ответ простыми словами — человек увидит его в приложении"
            className="mt-2 w-full rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div>
          <label htmlFor="author" className="text-xs text-muted-foreground">
            Кто отвечает
          </label>
          <input
            id="author"
            name="author"
            type="text"
            placeholder="Например: Татьяна Буцкая"
            className="mt-1 h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <button
          type="submit"
          className="h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Отправить ответ
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Ответ появится в приложении, человеку придут уведомления на почту
          и в мессенджер.
        </p>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col bg-background px-4 py-6">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Ответ на обращение
      </p>
      <p className="mb-4 font-bold leading-none">
        <OrgName />
      </p>
      {children}
    </div>
  );
}

function Notice({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="font-semibold leading-snug">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
