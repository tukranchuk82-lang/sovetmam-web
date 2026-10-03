import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutGrid,
  Users,
  MessageSquare,
  CalendarCheck,
  ChevronRight,
  Gauge,
  HelpCircle,
  Inbox,
} from "lucide-react";
import { listMeasuresIndexForAdmin } from "@/lib/measures-admin";
import { getAudienceOverview } from "@/lib/analytics/audience";
import { parsePeriod } from "@/lib/analytics/period";
import { countNewInquiries } from "@/lib/inquiries-db";
import { InviteCopyBanner } from "@/components/admin/invite-copy-banner";
import { absoluteUrl } from "@/lib/site";
import { getChatInquiryCounts, countInvited, inviteCode, buildInviteParams } from "@/lib/coordinator-insights";
import { regionDative } from "@/lib/region-case";
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
    return <CoordinatorHome staff={staff} region={await resolveRegion(staff, scope)} />;
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

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-5">
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

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
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

      <section className="mt-4 light-surface rounded-2xl border bg-card p-1.5 shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
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
    <section className={cn("light-surface rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)]", className)}>
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
          hot ? "bg-[#F6EDE8] text-[#8E1D2C]" : "bg-muted text-muted-foreground",
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

/** Крупная карточка раздела на сводке координатора. */
function BigCard({
  href,
  icon,
  title,
  value,
  caption,
  note,
  badge,
  className,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  value: number;
  caption: string;
  note?: string;
  /** Красный кружок с числом в углу: «тут что-то ждёт вас». */
  badge?: number;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[128px] flex-col rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)] transition-colors hover:border-primary/40",
        className,
      )}
    >
      {badge != null && badge > 0 && (
        <span
          aria-label={`Не отвечено: ${badge}`}
          className="absolute right-3.5 top-3.5 grid min-w-7 place-items-center rounded-full bg-[#C2334A] px-2 py-1 text-[13px] font-bold leading-none text-white"
        >
          {badge}
        </span>
      )}
      <span className="flex items-center gap-3 pr-10">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F6EDE8] text-[#8E1D2C] [&>svg]:size-5">{icon}</span>
        <span className="min-w-0 truncate text-[15px] font-semibold leading-snug">{title}</span>
      </span>
      <span className="mt-3 flex items-baseline gap-2">
        <span className="text-[32px] font-bold leading-none tabular-nums">{value}</span>
        <span className="text-[13px] text-muted-foreground">{caption}</span>
      </span>
      {note && <span className="mt-auto pt-2 pr-5 text-[12.5px] leading-snug text-muted-foreground">{note}</span>}
      <ChevronRight className="absolute bottom-4 right-4 size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Сводка координатора — только его регион (или все регионы разом, если это владелец/техспец смотрят «на себе»). */
async function CoordinatorHome({
  staff,
  region,
}: {
  staff: { id: string; role: string };
  region: string | null;
}) {
  // Ссылку-приглашение и счётчик считаем только у настоящего координатора:
  // у владельца в просмотре «на себе» своей ссылки нет.
  const code = staff.role === "coordinator" ? inviteCode(staff.id) : null;
  const [chatCounts, surveyCount, measuresCount, invited] = await Promise.all([
    getChatInquiryCounts(region),
    countSurveyFillersByRegion(region),
    countMeasuresByRegion(region),
    code ? countInvited(code) : Promise.resolve(0),
  ]);

  const inviteUrl = new URL(absoluteUrl("/"));
  for (const [k, v] of Object.entries(buildInviteParams(code ? staff.id : null, region))) {
    inviteUrl.searchParams.set(k, v);
  }
  const inviteLink = inviteUrl.toString();

  return (
    <AdminPage
      icon={<Gauge />}
      title={region ? `Сводка по ${regionDative(region)}` : "Сводка по всем регионам"}
      description={
        region
          ? "Обращения, меры и люди вашего региона."
          : "Так выглядит сводка координатора. Здесь показаны данные по всем регионам разом."
      }
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BigCard
          href="/admin/region-chat"
          icon={<MessageSquare />}
          title="Обращения"
          value={chatCounts.total}
          caption="всего"
          note={chatCounts.waiting > 0 ? `Не отвечено: ${chatCounts.waiting}` : "Все обращения отвечены"}
          badge={chatCounts.waiting}
        />
        <BigCard
          href="/admin/measures"
          icon={<LayoutGrid />}
          title="Меры региона"
          value={measuresCount}
          caption="мер"
          note="Все меры поддержки вашего региона: выплаты, льготы, услуги."
        />
        <BigCard
          href="/admin/region-survey"
          icon={<Users />}
          title="Пользователи региона"
          value={surveyCount}
          caption="заполнили анкету"
          note="Сводка: избранное, мессенджеры, составы семей."
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      <div className="mt-4">
        <InviteCopyBanner link={inviteLink} invited={invited} sample={!code} />
      </div>
    </AdminPage>
  );
}
