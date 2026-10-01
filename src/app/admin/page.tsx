import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutGrid,
  Users,
  MessageSquare,
  CalendarCheck,
  ChevronRight,
  Gauge,
  Heart,
  HelpCircle,
  Inbox,
} from "lucide-react";
import { listMeasuresIndexForAdmin } from "@/lib/measures-admin";
import { getAudienceOverview } from "@/lib/analytics/audience";
import { parsePeriod } from "@/lib/analytics/period";
import { countNewInquiries } from "@/lib/inquiries-db";
import { countNewBotHelpRequests } from "@/lib/bot-help";
import { countOpenDisputes } from "@/lib/measure-disputes";
import { countSurveyFillersByRegion, countMeasuresByRegion } from "@/lib/region-insights";
import { planFor } from "@/lib/verification";
import { getCurrentStaff } from "@/lib/user-session";
import { effectiveAdminScope, getViewMode } from "@/lib/view-mode";
import { resolveRegion } from "@/lib/preview-region";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { StatCard } from "@/components/admin/ui/primitives";
import { PeriodTabs } from "@/components/admin/ui/period-tabs";
import { AreaChart, BarList } from "@/components/admin/ui/charts";
import { cn } from "@/lib/utils";

export const metadata = { title: "Сводка" };
export const dynamic = "force-dynamic";

/** Сверка считается устаревшей, если её не было больше 40 дней (цикл — месяц). */
function isStale(iso: string | null): boolean {
  if (!iso) return true;
  return (Date.now() - new Date(iso).getTime()) / 86_400_000 > 40;
}

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?next=/admin");
  const scope = effectiveAdminScope(staff.role, await getViewMode(staff.role));

  if (scope === "coordinator") {
    return <CoordinatorHome region={await resolveRegion(staff, scope)} />;
  }

  const period = parsePeriod((await searchParams).period);

  const [audience, measures, newInquiries, newRequests, openDisputes] = await Promise.all([
    getAudienceOverview(period),
    listMeasuresIndexForAdmin(),
    countNewInquiries(),
    countNewBotHelpRequests(),
    countOpenDisputes(),
  ]);

  // Порция сверки на сегодня — тот же график, что и в разделе «Сверка».
  const today = new Date().getDate();
  const plan = planFor(today);
  const portion = measures.filter(
    (m) =>
      m.isPublished &&
      (plan.kind === "federal"
        ? m.level === "federal"
        : plan.kind === "regions"
          ? m.region != null && plan.regions.includes(m.region)
          : false),
  );
  const portionDone = portion.filter((m) => !isStale(m.verifiedAt)).length;

  const pct = (n: number) => (audience.totalPeople ? Math.round((n / audience.totalPeople) * 100) : 0);

  return (
    <AdminPage
      icon={<Gauge />}
      title="Обзор аудитории"
      description="Сколько людей приходит в приложение, откуда и из каких регионов. Данные за выбранный период, стрелки — к предыдущему такому же."
      actions={<PeriodTabs value={period.key} basePath="/admin" />}
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Новые люди"
          value={audience.newPeople.value}
          delta={period.days ? audience.newPeople.delta : undefined}
          tone="accent"
          hint={`Всего в базе: ${audience.totalPeople}`}
        />
        <StatCard
          label="Активные (заходили)"
          value={audience.activePeople.value}
          delta={period.days ? audience.activePeople.delta : undefined}
        />
        <StatCard
          label="Заполнили анкету"
          value={audience.surveyed.value}
          delta={period.days ? audience.surveyed.delta : undefined}
        />
        <StatCard
          label="Установили приложение"
          value={audience.installs.value}
          delta={period.days ? audience.installs.delta : undefined}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Panel title="Регистрации по дням" className="lg:col-span-3">
          <AreaChart data={audience.registrations} unit=" чел." />
        </Panel>
        <Panel title="Кто они" className="lg:col-span-2">
          <FactRow label="Всего людей" value={audience.totalPeople} />
          <FactRow label="Подтвердили почту" value={audience.verified} share={pct(audience.verified)} />
          <FactRow label="Подключили мессенджер" value={audience.withMessenger} share={pct(audience.withMessenger)} />
          <FactRow label="Заполнили анкету за период" value={audience.surveyed.value} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Откуда пришли" action={<PanelLink href="/admin/share">Подробнее</PanelLink>}>
          <BarList items={audience.sources} max={7} emptyText="За этот период новых людей нет" />
        </Panel>
        <Panel title="Регионы: люди и обращения" action={<PanelLink href="/admin/regions">Все регионы</PanelLink>}>
          <BarList
            items={audience.regions.map((r) => ({
              label: r.label,
              value: r.value,
              hint: r.inquiries ? `· ${r.inquiries} обр.` : undefined,
            }))}
            max={8}
            tone="navy"
            emptyText="За этот период новых людей нет"
          />
        </Panel>
      </div>

      <section className="mt-4 rounded-2xl border bg-card p-1.5 shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
        <h2 className="px-3 pb-1 pt-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
          Что сделать сегодня
        </h2>
        <div className="grid md:grid-cols-2">
          <TaskRow
            href="/admin/inquiries"
            icon={<MessageSquare />}
            title="Новые обращения"
            hint={newInquiries > 0 ? "Ждут ответа" : "Всё разобрано"}
            count={newInquiries}
          />
          <TaskRow
            href="/admin/requests"
            icon={<Inbox />}
            title="Заявки на кабинет"
            hint={newRequests > 0 ? "Просят завести кабинет" : "Нет новых заявок"}
            count={newRequests}
          />
          <TaskRow
            href="/admin/disputes"
            icon={<HelpCircle />}
            title="Спорные меры"
            hint={openDisputes > 0 ? "Нужно решение" : "Открытых споров нет"}
            count={openDisputes}
          />
          <TaskRow
            href="/admin/verification"
            icon={<CalendarCheck />}
            title="Сверка на сегодня"
            hint={
              plan.kind === "reserve"
                ? "Резервный день"
                : `${plan.title} · проверено ${portionDone} из ${portion.length}`
            }
            count={plan.kind === "reserve" ? 0 : Math.max(0, portion.length - portionDone)}
            countLabel="осталось"
          />
        </div>
      </section>
    </AdminPage>
  );
}

function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)]", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-primary hover:underline">
      {children} <ChevronRight className="size-3.5" />
    </Link>
  );
}

function FactRow({ label, value, share }: { label: string; value: number; share?: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/70 py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">
        <b className="font-semibold">{value}</b>
        {share !== undefined && <span className="ml-1.5 text-[12px] text-muted-foreground">{share}%</span>}
      </span>
    </div>
  );
}

/** Строка очереди дел: иконка, что делать, подсказка и число справа. */
function TaskRow({
  href,
  icon,
  title,
  hint,
  count,
  countLabel,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
  count: number;
  countLabel?: string;
}) {
  const hot = count > 0;
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/70"
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg [&>svg]:size-[18px]",
          hot ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">{title}</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">{hint}</span>
      </span>
      {hot && (
        <span className="inline-flex h-6 min-w-6 items-center justify-center gap-1 rounded-full bg-primary px-2 text-[12px] font-bold tabular-nums text-primary-foreground">
          {count}
          {countLabel && <span className="text-[10.5px] font-medium opacity-80">{countLabel}</span>}
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function SectionLink({
  href,
  icon,
  title,
  hint,
  alert,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border bg-card p-3.5 shadow-[0_1px_2px_rgba(32,36,44,0.04)] transition-colors hover:border-primary/40"
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl [&>svg]:size-5",
          alert ? "bg-amber-100 text-amber-700" : "bg-muted text-primary",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{title}</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Сводка координатора — только его регион (или все регионы разом, если это владелец/техспец смотрят «на себе»). */
async function CoordinatorHome({ region }: { region: string | null }) {
  const [newInquiries, surveyCount, measuresCount] = await Promise.all([
    countNewInquiries(region ?? undefined),
    countSurveyFillersByRegion(region),
    countMeasuresByRegion(region),
  ]);

  return (
    <AdminPage
      icon={<Gauge />}
      title="Сводка"
      description={
        region
          ? `Ваш регион — «${region}»: обращения, пользователи и меры ниже.`
          : "Вы видите эту сводку по своему региону. Выберите регион справа сверху, чтобы посмотреть его вживую, — пока показаны данные по всем регионам разом."
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Новых обращений" value={newInquiries} tone={newInquiries > 0 ? "accent" : "default"} />
        <StatCard label="Заполнили анкету" value={surveyCount} />
        <StatCard label="Мер в регионе" value={measuresCount} className="col-span-2 sm:col-span-1" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <SectionLink
          href="/admin/inquiries"
          icon={<MessageSquare />}
          title="Обращения"
          hint={newInquiries > 0 ? `${newInquiries} новых — ждут ответа` : "Новых обращений нет"}
          alert={newInquiries > 0}
        />
        <SectionLink
          href="/admin/measures"
          icon={<LayoutGrid />}
          title="Меры региона"
          hint={`${measuresCount} мер — можно поправить содержание`}
        />
        <SectionLink
          href="/admin/region-survey"
          icon={<Users />}
          title="Пользователи региона"
          hint={`${surveyCount} человек заполнили анкету`}
        />
        <SectionLink
          href="/admin/region-saved"
          icon={<Heart />}
          title="Избранное региона"
          hint="Какие меры сохраняют себе люди из региона"
        />
      </div>
    </AdminPage>
  );
}
