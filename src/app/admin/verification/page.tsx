import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Circle,
  ExternalLink,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { planFor, lastScheduledDay } from "@/lib/verification";
import { markVerifiedAction, unmarkVerifiedAction } from "./actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { cn } from "@/lib/utils";

export const metadata = { title: "Сверка мер" };
export const dynamic = "force-dynamic";

interface Row {
  slug: string;
  title: string;
  amount: string | null;
  region: string | null;
  level: "federal" | "regional";
  source_name: string | null;
  verified_at: string | null;
  verified_by: string | null;
}

/** Меры сегодняшней порции. Постранично — PostgREST отдаёт максимум 1000 строк. */
async function loadPortion(plan: ReturnType<typeof planFor>): Promise<Row[]> {
  if (plan.kind === "reserve") return [];
  const supabase = createSupabaseAdminClient();
  const base = supabase
    .from("measures")
    .select("slug,title,amount,region,level,source_name,verified_at,verified_by")
    .eq("is_published", true);

  const query =
    plan.kind === "federal"
      ? base.eq("level", "federal")
      : base.in("region", plan.regions);

  const { data, error } = await query.order("region").order("title");
  if (error) throw error;
  return (data ?? []) as Row[];
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Сверка считается устаревшей, если её не было больше 40 дней (цикл — месяц). */
function isStale(iso: string | null): boolean {
  if (!iso) return true;
  const days = (Date.now() - new Date(iso).getTime()) / 86_400_000;
  return days > 40;
}

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const sp = await searchParams;
  const today = new Date().getDate();
  const day = Math.min(Math.max(Number(sp.day) || today, 1), 31);
  const plan = planFor(day);
  const rows = await loadPortion(plan);

  const done = rows.filter((r) => r.verified_at && !isStale(r.verified_at)).length;
  const last = lastScheduledDay();

  return (
    <div className="px-4 py-5 md:px-6">
      <AdminPageHeader
        icon={<CalendarCheck />}
        title="Сверка мер"
        description={`Вся база вычитывается за месяц: 1-го числа — федеральные меры, со 2-го по ${last}-е — по 3–4 региона в день. Так данные обновляются равномерно, а не рывком раз в месяц.`}
      />

      {/* Переключение дня: можно вернуться к пропущенной порции */}
      <div className="mt-4 flex items-center gap-2">
        <DayLink day={day - 1} disabled={day <= 1}>
          <ChevronLeft className="size-4" />
        </DayLink>
        <div className="rounded-xl border bg-muted/40 px-3.5 py-2 text-sm">
          <span className="font-semibold">{day}-е число</span>
          {day === today && <span className="ml-1.5 text-primary">(сегодня)</span>}
        </div>
        <DayLink day={day + 1} disabled={day >= 31}>
          <ChevronRight className="size-4" />
        </DayLink>
      </div>

      <div className="mt-4 light-surface rounded-2xl border bg-card p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Порция дня
        </p>
        <p className="mt-1 font-semibold">{plan.title}</p>
        {plan.kind !== "reserve" && (
          <p className="mt-1 text-sm text-muted-foreground">
            Проверено {done} из {rows.length}
          </p>
        )}
      </div>

      {plan.kind === "reserve" ? (
        <div className="mt-5 rounded-2xl border border-dashed bg-muted/30 p-6 text-center">
          <p className="font-semibold">Плановых мер на этот день нет</p>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            Резервный день. Используйте его, чтобы доработать меры, где сверка нашла
            расхождения, и разобрать уточнения, присланные пользователями.
          </p>
          <Link
            href="/admin/inquiries"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Перейти к обращениям <ExternalLink className="size-3.5" />
          </Link>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5">
          {rows.map((r) => {
            const stale = isStale(r.verified_at);
            return (
              <div
                key={r.slug}
                className={cn(
                  "flex items-start gap-3 light-surface rounded-2xl border bg-card p-3.5",
                  !stale && "border-emerald-300/60 bg-emerald-50/40",
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {stale ? (
                    <Circle className="size-5 text-muted-foreground/40" />
                  ) : (
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/measures/${r.slug}`}
                    className="font-semibold leading-snug hover:text-primary hover:underline"
                  >
                    {r.title}
                  </Link>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {r.amount || "размер не указан"}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>Источник: {r.source_name || "не указан"}</span>
                    {r.verified_at && !stale ? (
                      <span className="text-emerald-700">
                        Сверено {fmtDate(r.verified_at)}
                        {r.verified_by ? `, ${r.verified_by}` : ""}
                      </span>
                    ) : r.verified_at ? (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <AlertTriangle className="size-3.5" />
                        Сверено давно ({fmtDate(r.verified_at)}) — пора перепроверить
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Ещё не сверялась</span>
                    )}
                  </p>
                </div>

                <form action={stale ? markVerifiedAction : unmarkVerifiedAction}>
                  <input type="hidden" name="slug" value={r.slug} />
                  <button
                    type="submit"
                    className={cn(
                      "shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                      stale
                        ? "bg-primary text-white hover:opacity-90"
                        : "border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {stale ? "Сверено" : "Снять отметку"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DayLink({
  day,
  disabled,
  children,
}: {
  day: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="inline-flex size-9 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground/40">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={`/admin/verification?day=${day}`}
      className="inline-flex size-9 items-center justify-center rounded-xl border bg-background transition-colors hover:bg-muted"
    >
      {children}
    </Link>
  );
}
