import Link from "next/link";
import {
  LayoutGrid,
  Users,
  MessageSquare,
  CalendarCheck,
  Plus,
  ChevronRight,
  AlertTriangle,
  Gauge,
} from "lucide-react";
import {
  listMeasuresIndexForAdmin,
  computeMeasuresStats,
} from "@/lib/measures-admin";
import { listAppUsersForAdmin, computeUsersStats } from "@/lib/users-admin";
import { countNewInquiries } from "@/lib/inquiries-db";
import { REGIONS } from "@/lib/measures";
import { planFor } from "@/lib/verification";
import { AdminPageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Сводка" };
export const dynamic = "force-dynamic";

/** Сверка считается устаревшей, если её не было больше 40 дней (цикл — месяц). */
function isStale(iso: string | null): boolean {
  if (!iso) return true;
  return (Date.now() - new Date(iso).getTime()) / 86_400_000 > 40;
}

export default async function AdminHome() {
  const [measures, users, newInquiries] = await Promise.all([
    listMeasuresIndexForAdmin(),
    listAppUsersForAdmin(),
    countNewInquiries(),
  ]);

  const stats = computeMeasuresStats(measures, REGIONS);
  const userStats = computeUsersStats(users);

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

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<Gauge />}
        title="Сводка"
        description="Что сейчас в базе, кто пришёл в приложение и что стоит сделать сегодня."
      />

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Мер опубликовано" value={stats.published} accent />
        <Stat label="Черновиков" value={stats.drafts} />
        <Stat label="Пользователей" value={userStats.total} />
        <Stat label="Регистраций за 7 дней" value={userStats.last7days} accent />
      </div>

      {/* Пробелы в покрытии — самое полезное, что видно из сводки: регион без
          мер выглядит для семьи так, будто поддержки у неё нет вовсе. */}
      <div className="mt-2 rounded-2xl border bg-card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Покрытие регионов
          </p>
          <p className="text-sm font-semibold">
            {stats.regionsCovered} из {REGIONS.length}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand"
            style={{
              width: `${Math.round((stats.regionsCovered / REGIONS.length) * 100)}%`,
            }}
          />
        </div>
        {stats.emptyRegions.length > 0 ? (
          <p className="mt-2.5 flex items-start gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="mt-px size-3.5 shrink-0" />
            <span>
              Без опубликованных мер: {stats.emptyRegions.join(", ")}
            </span>
          </p>
        ) : (
          <p className="mt-2.5 text-xs text-muted-foreground">
            Во всех регионах есть хотя бы одна опубликованная мера.
          </p>
        )}
      </div>

      <div className="mt-2 rounded-2xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Сверка на сегодня
        </p>
        <p className="mt-1 font-semibold leading-snug">{plan.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {plan.kind === "reserve"
            ? "Резервный день: спорные меры и обращения пользователей."
            : `Проверено ${portionDone} из ${portion.length}.`}
        </p>
        <Link
          href="/admin/verification"
          className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
        >
          Перейти к сверке <ChevronRight className="size-3.5" />
        </Link>
      </div>

      <Link
        href="/admin/measures/new"
        className={cn(buttonVariants(), "mt-4 h-11 w-full gap-2 px-4 text-sm")}
      >
        <Plus className="size-4" /> Добавить меру
      </Link>

      <div className="mt-2 space-y-2">
        <SectionLink
          href="/admin/measures"
          icon={<LayoutGrid className="size-5" />}
          title="Каталог мер"
          hint={`${stats.total} мер · федеральных ${stats.federal}, региональных ${stats.regional}`}
        />
        <SectionLink
          href="/admin/users"
          icon={<Users className="size-5" />}
          title="Пользователи"
          hint={`${userStats.total} зарегистрировано · с анкетой ${userStats.withSurvey}`}
        />
        <SectionLink
          href="/admin/inquiries"
          icon={<MessageSquare className="size-5" />}
          title="Обращения"
          hint={
            newInquiries > 0
              ? `${newInquiries} новых — ждут ответа`
              : "Новых обращений нет"
          }
          alert={newInquiries > 0}
        />
        <SectionLink
          href="/admin/verification"
          icon={<CalendarCheck className="size-5" />}
          title="Сверка"
          hint={
            stats.neverVerified > 0
              ? `${stats.neverVerified} мер ещё ни разу не сверялись`
              : "Все меры проходили сверку"
          }
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-card px-3 py-2.5">
      <p
        className={cn(
          "text-2xl font-extrabold leading-none",
          accent && "text-brand",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
        {label}
      </p>
    </div>
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
      className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition-colors hover:border-primary/50"
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          alert ? "bg-amber-100 text-amber-700" : "bg-muted text-brand",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {hint}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
