"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Plus, UserRound, X } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { FilterSearch, ResetFilters } from "@/components/admin/ui/filter-bar";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/admin/ui/primitives";
import { StaffForm } from "@/components/admin/staff-form";
import { CoordinatorStatusBadge } from "@/components/admin/coordinators-table";
import type { CoordinatorStatus } from "@/lib/analytics/coordinator-report";
import type { StaffFormState } from "@/app/admin/staff/actions";

export interface StaffPerson {
  id: string;
  name: string;
  email: string;
  region?: string | null;
  status?: CoordinatorStatus;
}

export interface PendingOwnerRequest {
  id: string;
  requestedByName: string;
  targetName: string;
  targetEmail: string;
}

type FormAction = (prev: StaffFormState, fd: FormData) => Promise<StaffFormState>;
type Tab = "coordinators" | "techs" | "analysts" | "owners";

const INPUT = "mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
const BTN = "h-[38px] rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground";

/** Кнопка «Разжаловать» с подтверждением — случайный клик в длинном списке не должен снимать роль. */
function DemoteButton({ action, id, label, confirmText }: { action: (id: string) => Promise<void>; id: string; label: string; confirmText: string }) {
  return (
    <form action={() => action(id)} onClick={(e) => e.stopPropagation()}>
      <button
        type="submit"
        onClick={(e) => {
          if (!window.confirm(confirmText)) e.preventDefault();
        }}
        className="shrink-0 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-destructive hover:text-destructive"
      >
        {label}
      </button>
    </form>
  );
}

function RoleSection({
  tab,
  people,
  pending,
  viewerRole,
  regions,
  actions,
}: {
  tab: Tab;
  people: StaffPerson[];
  pending: PendingOwnerRequest[];
  viewerRole: "owner" | "tech" | "analyst";
  regions: string[];
  actions: {
    promoteCoordinator: FormAction;
    promoteTech: FormAction;
    promoteAnalyst: FormAction;
    grantOwner: FormAction;
    requestOwner: FormAction;
    demoteCoordinator: (id: string) => Promise<void>;
    demoteTech: (id: string) => Promise<void>;
    demoteAnalyst: (id: string) => Promise<void>;
    decideOwnerRequest: (requestId: string, approve: boolean) => Promise<void>;
  };
}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const canEdit = viewerRole !== "analyst";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/ё/g, "е");
    return q ? people.filter((p) => `${p.region ?? ""} ${p.name} ${p.email}`.toLowerCase().replace(/ё/g, "е").includes(q)) : people;
  }, [people, query]);

  const demote =
    tab === "coordinators"
      ? { action: actions.demoteCoordinator, label: "Разжаловать", text: "Разжаловать координатора? Он станет обычным пользователем." }
      : tab === "techs" && viewerRole === "owner"
        ? { action: actions.demoteTech, label: "Разжаловать", text: "Разжаловать техспеца? Он станет обычным пользователем." }
        : tab === "analysts"
          ? { action: actions.demoteAnalyst, label: "Снять роль", text: "Снять роль аналитика? Он станет обычным пользователем." }
          : null;

  const columns: Column<StaffPerson>[] = [
    {
      key: "who",
      header: tab === "coordinators" ? "Регион · координатор" : "Сотрудник",
      sort: (a, b) => (tab === "coordinators" ? (a.region ?? "я").localeCompare(b.region ?? "я", "ru") : a.name.localeCompare(b.name, "ru")),
      cell: (p) => (
        <div className="min-w-0">
          <p className="truncate font-semibold leading-snug">{tab === "coordinators" ? (p.region ?? "Регион не указан") : p.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {tab === "coordinators" ? `${p.name} · ` : ""}
            {p.email}
          </p>
        </div>
      ),
    },
    ...(tab === "coordinators"
      ? ([
          {
            key: "status",
            header: "Как дела",
            className: "w-[170px]",
            sort: (a, b) => (a.status?.tone ?? "").localeCompare(b.status?.tone ?? ""),
            cell: (p) => (p.status ? <CoordinatorStatusBadge status={p.status} /> : null),
          },
          {
            key: "report",
            header: "",
            className: "w-[90px]",
            cell: () => (
              <span className="inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
                Отчёт <ChevronRight className="size-3.5" />
              </span>
            ),
          },
        ] as Column<StaffPerson>[])
      : []),
    ...(demote && canEdit
      ? ([
          {
            key: "act",
            header: "",
            className: "w-[130px] text-right",
            cell: (p) => (
              <div className="flex justify-end">
                <DemoteButton action={demote.action} id={p.id} label={demote.label} confirmText={demote.text} />
              </div>
            ),
          },
        ] as Column<StaffPerson>[])
      : []),
  ];

  const description: Record<Tab, React.ReactNode> = {
    coordinators: (
      <>
        Видят и отвечают на обращения своего региона, видят меры, анкеты и избранное региона. Нажмите на строку, чтобы открыть отчёт по работе.{" "}
        <Link href="/admin/coordinators" className="font-medium text-primary underline">
          Сравнить всех координаторов
        </Link>
      </>
    ),
    techs: "Полный доступ, включая технические разделы и управление ролями.",
    analysts: "Видят всю админку целиком, но только смотрят: менять, отвечать и назначать они не могут.",
    owners: "Передача прав владельца: владелец назначает нового сразу, техспец только предлагает кандидата.",
  };

  const addLabel: Record<Tab, string> = {
    coordinators: "Назначить координатора",
    techs: "Назначить техспеца",
    analysts: "Назначить аналитика",
    owners: viewerRole === "owner" ? "Передать права владельца" : "Предложить владельца",
  };
  const canAdd = canEdit && (tab !== "owners" || viewerRole === "owner" || viewerRole === "tech");

  return (
    <div>
      <p className="max-w-[80ch] text-xs text-muted-foreground">{description[tab]}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <FilterSearch
          value={query}
          onChange={setQuery}
          placeholder={tab === "coordinators" ? "Найти регион, имя или почту" : "Найти по имени или почте"}
        />
        <ResetFilters visible={Boolean(query)} onClick={() => setQuery("")} />
        {canAdd && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#2FA36B] px-3.5 text-[13px] font-semibold text-white hover:bg-[#28915E]"
          >
            {adding ? <X className="size-4" /> : <Plus className="size-4" />}
            {adding ? "Закрыть" : addLabel[tab]}
          </button>
        )}
      </div>

      {adding && canAdd && (
        <div className="mt-3">
          {tab === "coordinators" && (
            <StaffForm action={actions.promoteCoordinator} className="flex flex-wrap items-end gap-2 rounded-2xl border bg-muted/30 p-3">
              <label className="min-w-[220px] flex-1">
                <span className="text-xs font-medium text-muted-foreground">Почта уже зарегистрированного человека</span>
                <input name="email" type="email" required placeholder="name@example.com" className={INPUT} />
              </label>
              <label className="min-w-[200px]">
                <span className="text-xs font-medium text-muted-foreground">Регион</span>
                <select name="region" required className={INPUT}>
                  <option value="">— выбрать —</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className={BTN}>
                Назначить
              </button>
            </StaffForm>
          )}
          {tab === "techs" && (
            <StaffForm action={actions.promoteTech} className="flex flex-wrap items-end gap-2 rounded-2xl border bg-muted/30 p-3">
              <label className="min-w-[220px] flex-1">
                <span className="text-xs font-medium text-muted-foreground">Почта уже зарегистрированного человека</span>
                <input name="techEmail" type="email" required placeholder="name@example.com" className={INPUT} />
              </label>
              <button type="submit" className={BTN}>
                Назначить техспецем
              </button>
            </StaffForm>
          )}
          {tab === "analysts" && (
            <StaffForm action={actions.promoteAnalyst} className="flex flex-wrap items-end gap-2 rounded-2xl border bg-muted/30 p-3">
              <label className="min-w-[220px] flex-1">
                <span className="text-xs font-medium text-muted-foreground">Почта уже зарегистрированного человека</span>
                <input name="analystEmail" type="email" required placeholder="name@example.com" className={INPUT} />
              </label>
              <button type="submit" className={BTN}>
                Назначить аналитиком
              </button>
            </StaffForm>
          )}
          {tab === "owners" &&
            (viewerRole === "owner" ? (
              <StaffForm action={actions.grantOwner} className="flex flex-wrap items-end gap-2 rounded-2xl border bg-muted/30 p-3">
                <label className="min-w-[220px] flex-1">
                  <span className="text-xs font-medium text-muted-foreground">Передать права владельца — почта человека</span>
                  <input name="ownerEmail" type="email" required placeholder="name@example.com" className={INPUT} />
                </label>
                <button type="submit" className={BTN}>
                  Сделать владельцем
                </button>
              </StaffForm>
            ) : (
              <StaffForm action={actions.requestOwner} className="flex flex-wrap items-end gap-2 rounded-2xl border bg-muted/30 p-3">
                <label className="min-w-[220px] flex-1">
                  <span className="text-xs font-medium text-muted-foreground">Предложить кандидата во владельцы — почта человека</span>
                  <input name="candidateEmail" type="email" required placeholder="name@example.com" className={INPUT} />
                </label>
                <button type="submit" className={BTN}>
                  Предложить
                </button>
                <p className="basis-full text-xs text-muted-foreground">Заявка вступит в силу только после подтверждения действующего владельца.</p>
              </StaffForm>
            ))}
        </div>
      )}

      {tab === "owners" && viewerRole === "owner" && pending.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Ждут вашего решения:</p>
          {pending.map((p) => (
            <div key={p.id} className="rounded-2xl border border-white/15 bg-white/[0.07] p-3.5">
              <p className="text-sm">
                <b>{p.requestedByName}</b> предлагает сделать владельцем <b>{p.targetName}</b> ({p.targetEmail})
              </p>
              <div className="mt-2 flex gap-2">
                <form action={() => actions.decideOwnerRequest(p.id, true)}>
                  <button type="submit" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                    Подтвердить
                  </button>
                </form>
                <form action={() => actions.decideOwnerRequest(p.id, false)}>
                  <button type="submit" className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                    Отклонить
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      <DataTable
        rows={visible}
        columns={columns}
        rowKey={(p) => p.id}
        rowHref={tab === "coordinators" ? (p) => `/admin/coordinators/${p.id}` : undefined}
        resetKey={`${tab}|${query}`}
        initialSort={{ key: "who", dir: "asc" }}
        defaultPageSize={25}
        empty={<EmptyState icon={<UserRound />} title={query ? "Никого не нашли" : "Пока никто не назначен"} />}
        mobileCard={(p) => (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold leading-snug">{tab === "coordinators" ? (p.region ?? "Регион не указан") : p.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {tab === "coordinators" ? `${p.name} · ` : ""}
                {p.email}
              </p>
            </div>
            {tab === "coordinators" && p.status && <CoordinatorStatusBadge status={p.status} />}
          </div>
        )}
      />
    </div>
  );
}

const SECTIONS: { key: Tab; title: string; hint: string }[] = [
  { key: "coordinators", title: "Координаторы", hint: "ведут свой регион" },
  { key: "techs", title: "Техспецы", hint: "технический доступ" },
  { key: "analysts", title: "Аналитики", hint: "только просмотр" },
  { key: "owners", title: "Владельцы", hint: "полные права" },
];

/**
 * Роли — вертикальными плашками: нажали на «Координаторы» — раскрылся список с
 * поиском и таблицей. Сотня координаторов не растягивает страницу: остальные
 * плашки остаются свёрнутыми.
 */
export function StaffDirectory(props: {
  coordinators: StaffPerson[];
  techs: StaffPerson[];
  analysts: StaffPerson[];
  owners: StaffPerson[];
  pending: PendingOwnerRequest[];
  viewerRole: "owner" | "tech" | "analyst";
  regions: string[];
  actions: React.ComponentProps<typeof RoleSection>["actions"];
}) {
  const [open, setOpen] = useState<Record<Tab, boolean>>({ coordinators: false, techs: false, analysts: false, owners: false });
  const data: Record<Tab, StaffPerson[]> = {
    coordinators: props.coordinators,
    techs: props.techs,
    analysts: props.analysts,
    owners: props.owners,
  };

  return (
    <div className="mt-2 space-y-3">
      {SECTIONS.map((sec) => {
        const isOpen = open[sec.key];
        return (
          <section key={sec.key} className="light-surface overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgba(32,36,44,0.04)]">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [sec.key]: !o[sec.key] }))}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/50"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-bold leading-tight">{sec.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{sec.hint}</span>
              </span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-primary">{data[sec.key].length}</span>
              <ChevronDown className={cn("size-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
              <div className="border-t px-4 pb-4 pt-3">
                <RoleSection
                  tab={sec.key}
                  people={data[sec.key]}
                  pending={props.pending}
                  viewerRole={props.viewerRole}
                  regions={props.regions}
                  actions={props.actions}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
