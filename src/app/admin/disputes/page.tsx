import Link from "next/link";
import {
  HelpCircle,
  ExternalLink,
  AlertTriangle,
  Link2Off,
  CheckCircle2,
  RotateCcw,
  Send,
} from "lucide-react";
import { listDisputes, type DisputeSource, type MeasureDispute } from "@/lib/measure-disputes";
import { addDisputeNoteAction, resolveDisputeAction, reopenDisputeAction } from "./actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Спорные меры" };
export const dynamic = "force-dynamic";

const PROBLEM_LABEL: Record<DisputeSource["problem"], string> = {
  contradicts: "источники противоречат друг другу",
  unreachable: "не открылся",
  note: "",
};

function SourceLink({ source }: { source: DisputeSource }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs hover:bg-muted"
    >
      {source.problem === "contradicts" && (
        <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
      )}
      {source.problem === "unreachable" && (
        <Link2Off className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      {source.problem === "note" && (
        <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate">{source.label}</span>
      {PROBLEM_LABEL[source.problem] && (
        <span className="shrink-0 text-muted-foreground">
          · {PROBLEM_LABEL[source.problem]}
        </span>
      )}
    </a>
  );
}

function DisputeCard({ dispute }: { dispute: MeasureDispute }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {dispute.measureSlug ? (
            <Link
              href={`/admin/measures/${dispute.measureSlug}`}
              className="font-semibold leading-snug hover:text-brand hover:underline"
            >
              {dispute.measureTitle ?? dispute.title}
            </Link>
          ) : (
            <p className="font-semibold leading-snug">{dispute.title}</p>
          )}
          {dispute.measureSlug && dispute.measureTitle && dispute.title !== dispute.measureTitle && (
            <p className="text-xs text-muted-foreground">{dispute.title}</p>
          )}
        </div>

        {dispute.status === "open" ? (
          <form action={resolveDisputeAction} className="shrink-0">
            <input type="hidden" name="disputeId" value={dispute.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <CheckCircle2 className="size-3.5" />
              Отметить решённой
            </button>
          </form>
        ) : (
          <form action={reopenDisputeAction} className="shrink-0">
            <input type="hidden" name="disputeId" value={dispute.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="size-3.5" />
              Вернуть в спорные
            </button>
          </form>
        )}
      </div>

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
        {dispute.reason}
      </p>

      {dispute.sources.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {dispute.sources.map((s, i) => (
            <SourceLink key={i} source={s} />
          ))}
        </div>
      )}

      {dispute.status === "resolved" && dispute.resolvedBy && (
        <p className="mt-3 text-xs text-emerald-700">
          Решено{dispute.resolvedAt ? `, ${new Date(dispute.resolvedAt).toLocaleDateString("ru-RU")}` : ""}
          {` — ${dispute.resolvedBy}`}
        </p>
      )}

      {dispute.notes.length > 0 && (
        <div className="mt-3 space-y-2 border-t pt-3">
          {dispute.notes.map((n) => (
            <div key={n.id} className="rounded-xl bg-muted/40 px-3 py-2">
              <p className="mb-1 text-[11px] text-muted-foreground">
                {n.authorName} ·{" "}
                {new Date(n.createdAt).toLocaleString("ru-RU", {
                  day: "2-digit",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{n.body}</p>
            </div>
          ))}
        </div>
      )}

      {dispute.status === "open" && (
        <form action={addDisputeNoteAction} className="mt-3 space-y-2">
          <input type="hidden" name="disputeId" value={dispute.id} />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Пришлите правильный текст, цитату из закона или ссылку на актуальный нормативный акт — увидят все админы"
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-1.5 text-xs")}
          >
            <Send className="size-3.5" />
            Отправить уточнение
          </button>
        </form>
      )}
    </div>
  );
}

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const sp = await searchParams;
  const showResolved = sp.show === "resolved";
  const disputes = await listDisputes(showResolved ? "resolved" : "open");
  const openCount = showResolved ? null : disputes.length;

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<HelpCircle />}
        title="Спорные меры"
        description="Меры, по которым официальные источники расходятся, устарели или не открываются при автоматической проверке. Пока спор не решён, в каталоге остаётся прежний текст."
      />

      <div className="mt-4 flex gap-1.5">
        <Link
          href="/admin/disputes"
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium",
            !showResolved ? "border-primary bg-primary/10 text-primary" : "bg-background hover:bg-muted",
          )}
        >
          Открытые{openCount !== null ? ` (${openCount})` : ""}
        </Link>
        <Link
          href="/admin/disputes?show=resolved"
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium",
            showResolved ? "border-primary bg-primary/10 text-primary" : "bg-background hover:bg-muted",
          )}
        >
          Решённые
        </Link>
      </div>

      {disputes.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed bg-muted/30 p-6 text-center">
          <p className="font-semibold">
            {showResolved ? "Решённых споров пока нет" : "Спорных мер сейчас нет"}
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {disputes.map((d) => (
            <DisputeCard key={d.id} dispute={d} />
          ))}
        </div>
      )}
    </div>
  );
}
