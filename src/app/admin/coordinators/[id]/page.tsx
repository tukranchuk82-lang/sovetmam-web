import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Info, LogIn, MessageCircle, UserPlus, UserRound } from "lucide-react";
import { getCurrentAdminOrAnalyst } from "@/lib/user-session";
import { getCoordinatorReport, SECTION_LABELS } from "@/lib/analytics/coordinator-report";
import { parsePeriod } from "@/lib/analytics/period";
import { AdminPage } from "@/components/admin/ui/admin-page";
import { PeriodTabs } from "@/components/admin/ui/period-tabs";
import { StatCard } from "@/components/admin/ui/primitives";
import { BarList } from "@/components/admin/ui/charts";
import { cn } from "@/lib/utils";

export const metadata = { title: "Отчёт по координатору" };
export const dynamic = "force-dynamic";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function ago(iso: string | null): string {
  if (!iso) return "ни разу";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "сегодня";
  if (days === 1) return "вчера";
  return `${days} дн. назад`;
}

/** Минуты — по-человечески: «25 мин», «3 ч», «2 дн.». */
function span(min: number | null): string {
  if (min === null) return "—";
  if (min < 60) return `${min} мин`;
  if (min < 60 * 48) return `${Math.round(min / 60)} ч`;
  return `${Math.round(min / 60 / 24)} дн.`;
}

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="light-surface rounded-2xl border bg-card p-4 shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
      <h2 className="text-[15px] font-bold leading-tight">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-black/[0.05] py-1.5 text-[13.5px] last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("shrink-0 text-right tabular-nums", strong && "font-bold")}>{value}</span>
    </div>
  );
}

export default async function CoordinatorReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { id } = await params;
  // Отчёт — только для владельца, техспеца и аналитика (только просмотр).
  const viewer = await getCurrentAdminOrAnalyst();
  if (!viewer) redirect("/admin");

  const period = parsePeriod((await searchParams).period);
  const r = await getCoordinatorReport(id, period);
  if (!r) notFound();
  const p = period.label.toLowerCase();

  const sections = r.cabinet.sections.map((s) => ({
    label: SECTION_LABELS[s.section] ?? s.section,
    value: s.count,
  }));

  return (
    <AdminPage
      icon={<UserRound />}
      title={r.coordinator.name}
      description={
        <>
          Координатор · {r.coordinator.region ?? "регион не указан"} · {r.coordinator.email} · с нами с{" "}
          {fmtDate(r.coordinator.since)}
        </>
      }
      actions={<PeriodTabs value={period.key} basePath={`/admin/coordinators/${id}`} />}
    >
      <Link href="/admin/staff" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white">
        <ArrowLeft className="size-4" /> К сотрудникам
      </Link>

      {r.flags.length > 0 && (
        <ul className="mb-4 space-y-2">
          {r.flags.map((f, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium",
                f.tone === "warn" && "bg-amber-100 text-amber-900",
                f.tone === "ok" && "bg-emerald-100 text-emerald-900",
                f.tone === "info" && "bg-sky-100 text-sky-900",
              )}
            >
              {f.tone === "warn" ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              ) : f.tone === "ok" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              ) : (
                <Info className="mt-0.5 size-4 shrink-0" />
              )}
              {f.text}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<LogIn />}
          color="blue"
          label={`Дней со входом · ${p}`}
          value={r.login.activeDays}
          hint={`Последний вход: ${ago(r.login.lastAt)}`}
        />
        <StatCard
          icon={<MessageCircle />}
          label={`Ответов в чате · ${p}`}
          value={r.chat.replied}
          hint={`Сообщений от людей: ${r.chat.received}`}
        />
        <StatCard
          label="Время первого ответа (медиана)"
          value={span(r.chat.medianReplyMin)}
          hint={r.chat.within24hPct !== null ? `В течение суток: ${r.chat.within24hPct}%` : "Пока нет данных"}
          tone={r.chat.within24hPct !== null && r.chat.within24hPct < 70 ? "warn" : "default"}
        />
        <StatCard
          icon={<UserPlus />}
          color="green"
          label={`Приглашено · ${p}`}
          value={r.invites.inPeriod}
          hint={`За всё время: ${r.invites.total}`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Block
          title="Ответы людям"
          hint={
            r.sameRegionCoordinators > 1
              ? `В регионе ${r.sameRegionCoordinators} координатора — ответы в чате общие, по региону.`
              : "Чат ведётся на весь регион; цифры — по региону координатора."
          }
        >
          <Row label="Написали людей" value={r.chat.people} />
          <Row label="Сообщений от людей" value={r.chat.received} />
          <Row label="Ответов" value={r.chat.replied} />
          <Row
            label="Ждут ответа сейчас"
            value={r.chat.waitingNow ? `${r.chat.waitingNow} (дольше всех — ${r.chat.longestWaitHours} ч)` : "нет"}
            strong={r.chat.waitingNow > 0}
          />
          <Row label="Время первого ответа, медиана" value={span(r.chat.medianReplyMin)} />
          <Row label="Отвечено в течение суток" value={r.chat.within24hPct !== null ? `${r.chat.within24hPct}%` : "—"} />
          <Row label="Вопросов в расчёте" value={r.chat.answeredCount} />
          <div className="mt-3 border-t pt-3">
            <p className="text-[12.5px] font-semibold text-muted-foreground">Обращения через форму · {p}</p>
            <Row label="Поступило" value={r.inquiries.received} />
            <Row label="Отвечено" value={r.inquiries.answered} />
            <Row label="Из них лично им" value={r.inquiries.byThisCoordinator} />
            <Row label="Без ответа" value={r.inquiries.unanswered} strong={r.inquiries.unanswered > 0} />
            <Row
              label="Время ответа, медиана"
              value={r.inquiries.medianReplyHours !== null ? `${r.inquiries.medianReplyHours} ч` : "—"}
            />
          </div>
        </Block>

        <Block title="Приглашённые подписчики" hint="Люди, которые зарегистрировались по его личной ссылке-приглашению.">
          <Row label="Всего пришло по ссылке" value={r.invites.total} strong />
          <Row label={`За период (${p})`} value={r.invites.inPeriod} />
          <Row
            label="Заполнили анкету"
            value={
              r.invites.total
                ? `${r.invites.filledSurvey} (${Math.round((r.invites.filledSurvey / r.invites.total) * 100)}%)`
                : "—"
            }
          />
          <Row label="Написали ему в чат" value={r.invites.wroteToChat} />
          <p className="mt-2 text-xs text-muted-foreground">Код ссылки: {r.invites.code}</p>
        </Block>

        <Block title="Вход в приложение" hint={`За период: ${p}`}>
          <Row label="Входов" value={r.login.count} />
          <Row label="Дней со входом" value={r.login.activeDays} />
          <Row label="Последний вход" value={ago(r.login.lastAt)} />
          <Row
            label="Через установленное приложение"
            value={r.login.viaInstalledPct !== null ? `${r.login.viaInstalledPct}%` : "—"}
          />
        </Block>

        <Block
          title="Работа в кабинете"
          hint={
            r.cabinet.trackedSince
              ? `Что открывает в админке. Считается с ${fmtDate(r.cabinet.trackedSince)}.`
              : "Что открывает в админке. Журнал только включён — данные появятся, когда координатор зайдёт."
          }
        >
          <Row label="Открытий разделов" value={r.cabinet.views} />
          <Row label="Дней в кабинете" value={r.cabinet.activeDays} />
          <Row label="Последняя активность" value={ago(r.cabinet.lastAt)} />
          {sections.length > 0 && (
            <div className="mt-3">
              <BarList items={sections} max={6} tone="navy" />
            </div>
          )}
        </Block>

        <Block title="Регион" hint={r.coordinator.region ?? undefined}>
          <Row label="Людей с анкетой в регионе" value={r.region.people} strong />
          <Row label={`Новых за период (${p})`} value={r.region.newPeople} />
          <Row label={`Просмотров мер региона (${p})`} value={r.region.measureViews} />
        </Block>
      </div>
    </AdminPage>
  );
}
