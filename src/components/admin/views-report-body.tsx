import { BookOpen, Clock, Eye, Info, ListChecks, MousePointerClick, Users } from "lucide-react";
import type { ViewsReport } from "@/lib/analytics/views";
import { AreaChart, BarList } from "@/components/admin/ui/charts";
import { EmptyState, StatCard } from "@/components/admin/ui/primitives";
import { MeasureViewsTable } from "@/components/admin/measure-views-table";

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function fmtSeconds(s: number | null): string {
  if (s == null) return "—";
  if (s < 60) return `${s} с`;
  return `${Math.floor(s / 60)} мин ${String(s % 60).padStart(2, "0")} с`;
}

const fmtPct = (p: number | null) => (p == null ? "—" : `${p}%`);

/**
 * Тело отчёта «Что смотрят» — общее для владельца/техспеца (все регионы, с
 * выбором региона) и для координатора (только его регион).
 */
export function ViewsReportBody({
  r,
  showDelta,
}: {
  r: ViewsReport;
  /** Дельта к прошлому периоду есть только у периодов с границами (не «всё время»). */
  showDelta: boolean;
}) {
  if (r.views.value === 0 && !r.since) {
    return (
      <div className="light-surface rounded-2xl border bg-card">
        <EmptyState icon={<Eye />} title="Пока нет ни одного просмотра">
          Учёт включён: как только люди начнут открывать карточки мер, здесь появятся цифры. Историю до сегодняшнего дня
          восстановить нельзя.
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      {r.since && (
        <p className="mb-3 inline-flex items-start gap-1.5 rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-[12.5px] text-white/75">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>Просмотры считаются с {fmtDate(r.since)}.</span>
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Открыли карточки"
          value={r.views.value}
          delta={showDelta ? r.views.delta : undefined}
          icon={<Eye />}
          color="rose"
        />
        <StatCard
          label="Разных людей"
          value={r.people.value}
          delta={showDelta ? r.people.delta : undefined}
          icon={<Users />}
          color="blue"
        />
        <StatCard label="Среднее время на странице" value={fmtSeconds(r.avgSeconds)} icon={<Clock />} color="sky" />
        <StatCard label="Дочитали до конца" value={fmtPct(r.readPct)} icon={<BookOpen />} color="green" />
        <StatCard label="Дошли до «Как оформить»" value={fmtPct(r.howtoPct)} icon={<ListChecks />} color="blue" />
        <StatCard
          label="Нажали ссылку или спросили"
          value={fmtPct(r.actionPct)}
          icon={<MousePointerClick />}
          color="rose"
        />
      </div>

      <section className="light-surface mt-4 rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
        <h2 className="mb-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
          Открытия карточек по дням
        </h2>
        <AreaChart data={r.perDay} unit=" просм." />
      </section>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        <section className="light-surface rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
          <h2 className="mb-3 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            Откуда открывают меру
          </h2>
          <BarList items={r.sources} emptyText="Пока нет данных" />
        </section>
        <section className="light-surface rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
          <h2 className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            До чего доходят в карточке
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">Доля просмотров, в которых человек дошёл до раздела.</p>
          <BarList tone="navy" total={r.tracked} items={r.sections} emptyText="Пока нет данных" />
        </section>
      </div>

      <h2 className="mb-2 mt-6 text-[11.5px] font-semibold uppercase tracking-wide text-white/60">
        Какие меры смотрят
      </h2>
      <MeasureViewsTable rows={r.top} />
    </>
  );
}
