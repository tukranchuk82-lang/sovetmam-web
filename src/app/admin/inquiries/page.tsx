import Link from "next/link";
import { Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { listAllInquiries } from "@/lib/inquiries-db";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";

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

export default async function AdminInquiriesPage() {
  const inquiries = await listAllInquiries();
  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <div className="px-4 py-5">
      <h1 className="text-xl font-extrabold tracking-tight">Обращения</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Всего: {inquiries.length}
        {newCount > 0 && (
          <>
            {" · "}
            <span className="font-semibold text-amber-600">
              новых: {newCount}
            </span>
          </>
        )}
      </p>

      {inquiries.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed bg-muted/40 px-4 py-10 text-center">
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
              className="block rounded-xl border bg-card p-3 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start gap-3">
                <Avatar name={inq.userName} color={CHANNEL_COLORS[inq.userChannel]} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
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
                      {inq.type === "question" ? "Вопрос" : "Идея"}
                    </Badge>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: CHANNEL_COLORS[inq.userChannel] }}
                    >
                      {CHANNEL_LABELS[inq.userChannel]}
                    </span>
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
