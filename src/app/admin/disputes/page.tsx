import Link from "next/link";
import {
  HelpCircle,
  ExternalLink,
  AlertTriangle,
  Link2Off,
  CheckCircle2,
  RotateCcw,
  Send,
  UserRound,
} from "lucide-react";
import { listDisputes, type DisputeSource, type MeasureDispute } from "@/lib/measure-disputes";
import { addDisputeNoteAction, resolveDisputeAction, reopenDisputeAction } from "./actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentAdminOrAnalyst, isReadOnlyViewer } from "@/lib/user-session";
import { listByRole } from "@/lib/staff-db";
import { REGIONS } from "@/lib/measures";
import { ReadOnlyZone } from "@/components/admin/ui/read-only-zone";

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
      className="flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs hover:bg-muted"
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

type RegionCoordinator = { id: string; name: string };

/** Регион спора: у меры — её регион, иначе — из начала названия («Нижегородская область: …»). */
function regionOfDispute(d: MeasureDispute): string | null {
  if (d.measureRegion) return d.measureRegion;
  const m = /^([^:]{3,60}):/.exec(d.title);
  return m && (REGIONS as readonly string[]).includes(m[1]) ? m[1] : null;
}

function DisputeCard({
  dispute,
  readOnly,
  region,
  coordinators,
  canOpenCoordinator,
}: {
  dispute: MeasureDispute;
  readOnly: boolean;
  region: string | null;
  coordinators: RegionCoordinator[];
  canOpenCoordinator: boolean;
}) {
  return (
    <div className="light-surface rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {dispute.measureSlug ? (
            <Link
              href={`/admin/measures/${dispute.measureSlug}`}
              className="font-semibold leading-snug hover:text-primary hover:underline"
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

        {readOnly ? null : dispute.status === "open" ? (
          <form action={resolveDisputeAction} className="shrink-0">
            <input type="hidden" name="disputeId" value={dispute.id} />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
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
              className="inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="size-3.5" />
              Вернуть в спорные
            </button>
          </form>
        )}
      </div>

      {region && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px]">
          <span className="text-muted-foreground">{region} ·</span>
          {coordinators.length === 0 ? (
            <span className="text-muted-foreground">координатора в регионе нет</span>
          ) : (
            <>
              <span className="text-muted-foreground">
                {coordinators.length > 1 ? "координаторы:" : "координатор:"}
              </span>
              {coordinators.map((c) =>
                canOpenCoordinator ? (
                  <Link
                    key={c.id}
                    href={`/admin/coordinators/${c.id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-[#E4EBF7] px-2.5 py-0.5 font-semibold text-[#1B3A6B] hover:bg-[#D3DFF3]"
                  >
                    <UserRound className="size-3" />
                    {c.name}
                  </Link>
                ) : (
                  <span key={c.id} className="font-semibold">
                    {c.name}
                  </span>
                ),
              )}
            </>
          )}
        </p>
      )}

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

      {dispute.status === "open" && !readOnly && (
        <form action={addDisputeNoteAction} className="mt-3 space-y-2">
          <input type="hidden" name="disputeId" value={dispute.id} />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Пришлите правильный текст, цитату из закона или ссылку на актуальный нормативный акт — увидят все админы"
            className="w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-1.5 border-[#1B3A6B]/40 bg-white text-xs text-[#1B3A6B] hover:bg-[#E4EBF7]")}
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
  const readOnly = await isReadOnlyViewer();
  // Отчёт по координатору открывают владелец, техспец и аналитик.
  const canOpenCoordinator = Boolean(await getCurrentAdminOrAnalyst());
  const coordinatorsByRegion = new Map<string, RegionCoordinator[]>();
  for (const c of await listByRole("coordinator")) {
    if (!c.region) continue;
    const list = coordinatorsByRegion.get(c.region) ?? [];
    list.push({ id: c.id, name: `${c.firstName} ${c.lastName}`.trim() || c.email });
    coordinatorsByRegion.set(c.region, list);
  }

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
            !showResolved ? "border-primary bg-primary/10 text-primary" : "bg-white hover:bg-muted",
          )}
        >
          Открытые{openCount !== null ? ` (${openCount})` : ""}
        </Link>
        <Link
          href="/admin/disputes?show=resolved"
          className={cn(
            "rounded-lg border px-3 py-1.5 text-xs font-medium",
            showResolved ? "border-primary bg-primary/10 text-primary" : "bg-white hover:bg-muted",
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
            <ReadOnlyZone key={d.id} readOnly={readOnly}>
              <DisputeCard
                dispute={d}
                readOnly={readOnly}
                region={regionOfDispute(d)}
                coordinators={coordinatorsByRegion.get(regionOfDispute(d) ?? "") ?? []}
                canOpenCoordinator={canOpenCoordinator}
              />
            </ReadOnlyZone>
          ))}
        </div>
      )}
    </div>
  );
}
