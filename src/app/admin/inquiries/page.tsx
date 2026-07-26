import { INQUIRY_TYPE_LABEL } from "@/lib/inquiries";
import Link from "next/link";
import { Clock, CheckCircle2, ChevronRight, MapPin, MessageSquare, Mail } from "lucide-react";
import { listAllInquiries } from "@/lib/inquiries-db";
import { resendAllNewInquiriesAction } from "./actions";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/page-header";

export const metadata = { title: "Обращения" };
export const dynamic = "force-dynamic";

const CHANNEL_LABELS = {
  telegram: "TG",
  vk: "VK",
  max: "MAX",
} as const;

const CHANNEL_COLORS = {
  telegram: "#229ED9",
  vk: "#0077FF",
  max: "#7C3AED",
} as const;

const DEFAULT_AVATAR_COLOR = "#1B3A6B";

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  const inquiries = await listAllInquiries();
  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<MessageSquare />}
        title="Обращения"
        description={
          <>
            Всего: {inquiries.length}
            {newCount > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-amber-600">
                  новых: {newCount}
                </span>
              </>
            )}
          </>
        }
      />

      {sent && (
        <p className="mt-3 rounded-xl border border-emerald-300/60 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800">
          Письма поставлены в отправку: {sent}. Дойдут в течение минуты.
        </p>
      )}

      {newCount > 0 && (
        <form action={resendAllNewInquiriesAction} className="mt-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Mail className="size-3.5" />
            Отправить письмом все новые ({newCount})
          </button>
        </form>
      )}

      {inquiries.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed bg-muted/40 px-4 py-10 text-center">
          <p className="text-sm font-medium">Пока обращений нет</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Когда пользователь оставит вопрос или предложение — он появится
            здесь
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {inquiries.map((inq) => (
            <Link
              key={inq.id}
              href={`/admin/inquiries/${inq.id}`}
              className="block rounded-2xl border bg-card p-3 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start gap-3">
                <Avatar
                  name={inq.userName}
                  color={
                    inq.userChannel
                      ? CHANNEL_COLORS[inq.userChannel]
                      : DEFAULT_AVATAR_COLOR
                  }
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {inq.status === "new" ? (
                      <Badge
                        variant="outline"
                        className="gap-1 text-amber-600"
                      >
                        <Clock className="size-3" /> новое
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                        <CheckCircle2 className="size-3" /> отвечено
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px]">
                      {INQUIRY_TYPE_LABEL[inq.type]}
                    </Badge>
                    {inq.region && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground">
                        <MapPin className="size-3" />
                        {inq.region}
                      </span>
                    )}
                    {inq.userChannel && (
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: CHANNEL_COLORS[inq.userChannel] }}
                      >
                        {CHANNEL_LABELS[inq.userChannel]}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 font-semibold leading-snug">
                    {inq.subject}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {inq.userName} · {inq.body}
                  </p>
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
