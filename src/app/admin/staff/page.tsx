import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentAdmin } from "@/lib/user-session";
import { listByRole, listPendingOwnerRequests } from "@/lib/staff-db";
import { REGIONS } from "@/lib/measures";
import { AdminPage } from "@/components/admin/ui/admin-page";
import {
  decideOwnerRequestAction,
  demoteCoordinatorAction,
  demoteTechAction,
  grantOwnerDirectAction,
  promoteToCoordinatorAction,
  promoteToTechAction,
  requestOwnerAction,
} from "./actions";

export const metadata = { title: "Сотрудники" };
export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login?next=/admin/staff");

  const [coordinatorsRaw, techs, owners, pending] = await Promise.all([
    listByRole("coordinator"),
    listByRole("tech"),
    listByRole("owner"),
    admin.role === "owner" ? listPendingOwnerRequests() : Promise.resolve([]),
  ]);

  // Координаторы — по алфавиту названий регионов; без региона — в конце.
  const coordinators = [...coordinatorsRaw].sort((a, b) => {
    if (!a.region && !b.region) return 0;
    if (!a.region) return 1;
    if (!b.region) return -1;
    return a.region.localeCompare(b.region, "ru");
  });

  return (
    <AdminPage
      icon={<ShieldCheck />}
      title="Сотрудники"
      description="Кто ведёт какой регион, кто отвечает за техническую часть и кому переданы права владельца."
    >

      {/* ── Координаторы ─────────────────────────────────────────────── */}
      <section className="mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Координаторы
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Видят и отвечают на обращения своего региона, правят его меры, видят анкеты и избранное региона.
        </p>

        <div className="mt-3 space-y-2">
          {coordinators.length === 0 && (
            <p className="text-sm text-muted-foreground">Пока никто не назначен.</p>
          )}
          {coordinators.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 light-surface rounded-2xl border bg-card p-3.5">
              <div className="min-w-0">
                <p className="truncate font-semibold leading-snug">
                  {c.region ?? "Регион не указан"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.firstName} {c.lastName} · {c.email}
                </p>
              </div>
              <form action={demoteCoordinatorAction.bind(null, c.id)}>
                <button
                  type="submit"
                  className="shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
                >
                  Разжаловать
                </button>
              </form>
            </div>
          ))}
        </div>

        <form action={promoteToCoordinatorAction} className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border bg-muted/30 p-3">
          <label className="min-w-[220px] flex-1">
            <span className="text-xs font-medium text-muted-foreground">Почта уже зарегистрированного человека</span>
            <input
              name="email"
              type="email"
              required
              placeholder="name@example.com"
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <label className="min-w-[200px]">
            <span className="text-xs font-medium text-muted-foreground">Регион</span>
            <select
              name="region"
              required
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">— выбрать —</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="h-[38px] rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Назначить
          </button>
        </form>
      </section>

      {/* ── Техспецы ──────────────────────────────────────────────────── */}
      <section className="mt-7">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Техспецы
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Полный доступ, включая технические разделы и управление ролями.
        </p>

        <div className="mt-3 space-y-2">
          {techs.length === 0 && (
            <p className="text-sm text-muted-foreground">Пока никто не назначен.</p>
          )}
          {techs.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-3 light-surface rounded-2xl border bg-card p-3.5">
              <div className="min-w-0">
                <p className="truncate font-semibold leading-snug">
                  {t.firstName} {t.lastName}
                </p>
                <p className="truncate text-xs text-muted-foreground">{t.email}</p>
              </div>
              {admin.role === "owner" && (
                <form action={demoteTechAction.bind(null, t.id)}>
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
                  >
                    Разжаловать
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        <form action={promoteToTechAction} className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border bg-muted/30 p-3">
          <label className="min-w-[220px] flex-1">
            <span className="text-xs font-medium text-muted-foreground">Почта уже зарегистрированного человека</span>
            <input
              name="techEmail"
              type="email"
              required
              placeholder="name@example.com"
              className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>
          <button
            type="submit"
            className="h-[38px] rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Назначить техспецем
          </button>
        </form>
      </section>

      {/* ── Владелец ──────────────────────────────────────────────────── */}
      <section className="mt-7">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Владелец
        </h2>
        <div className="mt-3 space-y-2">
          {owners.map((o) => (
            <div key={o.id} className="light-surface rounded-2xl border bg-card p-3.5">
              <p className="font-semibold leading-snug">
                {o.firstName} {o.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{o.email}</p>
            </div>
          ))}
        </div>

        {admin.role === "owner" ? (
          <form action={grantOwnerDirectAction} className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border bg-muted/30 p-3">
            <label className="min-w-[220px] flex-1">
              <span className="text-xs font-medium text-muted-foreground">
                Передать права владельца — почта человека
              </span>
              <input
                name="ownerEmail"
                type="email"
                required
                placeholder="name@example.com"
                className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <button
              type="submit"
              className="h-[38px] rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Сделать владельцем
            </button>
          </form>
        ) : (
          <form action={requestOwnerAction} className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border bg-muted/30 p-3">
            <label className="min-w-[220px] flex-1">
              <span className="text-xs font-medium text-muted-foreground">
                Предложить кандидата во владельцы — почта человека
              </span>
              <input
                name="candidateEmail"
                type="email"
                required
                placeholder="name@example.com"
                className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </label>
            <button
              type="submit"
              className="h-[38px] rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              Предложить
            </button>
            <p className="basis-full text-xs text-muted-foreground">
              Заявка вступит в силу только после подтверждения действующего владельца.
            </p>
          </form>
        )}

        {admin.role === "owner" && pending.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Ждут вашего решения:</p>
            {pending.map((p) => (
              <div key={p.id} className="rounded-2xl border border-white/15 bg-white/[0.07] p-3.5">
                <p className="text-sm">
                  <b>{p.requestedByName}</b> предлагает сделать владельцем{" "}
                  <b>{p.targetName}</b> ({p.targetEmail})
                </p>
                <div className="mt-2 flex gap-2">
                  <form action={decideOwnerRequestAction.bind(null, p.id, true)}>
                    <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                      Подтвердить
                    </button>
                  </form>
                  <form action={decideOwnerRequestAction.bind(null, p.id, false)}>
                    <button type="submit" className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      Отклонить
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminPage>
  );
}
