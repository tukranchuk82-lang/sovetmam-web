"use client";

import { useMemo, useState } from "react";
import { MapPin, MailCheck, MailWarning, Users } from "lucide-react";
import type { AdminUser } from "@/lib/users-admin";
import { TAX_SYSTEM_LABEL, type TaxSystem } from "@/lib/measures";
// Только типы: onboarding-db — серверный модуль (server-only), его константы
// сюда тянуть нельзя, поэтому подписи ролей дублируем ниже.
import type { AppRole, MessengerChannel } from "@/lib/onboarding-db";
import { resolveUserAvatar } from "@/lib/avatar";
import { UserAvatar } from "@/components/user-avatar";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { Drawer } from "@/components/admin/ui/drawer";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
  ResetFilters,
  SegmentTabs,
} from "@/components/admin/ui/filter-bar";
import { EmptyState, StatusBadge } from "@/components/admin/ui/primitives";

const CHANNEL_LABELS: Record<MessengerChannel, string> = {
  telegram: "Telegram",
  vk: "VK",
  max: "MAX",
};

const ROLE_LABELS: Record<AppRole, string> = {
  user: "Пользователь",
  owner: "Владелец",
  tech: "Техспец",
  coordinator: "Координатор",
};

const CHANNEL_COLORS: Record<MessengerChannel, string> = {
  telegram: "#229ED9",
  vk: "#0077FF",
  max: "#7C3AED",
};

// Признаки анкеты, которые показываем словами в раскрытой карточке.
const SURVEY_FLAGS: { key: string; label: string }[] = [
  { key: "pregnant", label: "беременность" },
  { key: "lowIncome", label: "малоимущая семья" },
  { key: "singleParent", label: "одинокий родитель" },
  { key: "svoFamily", label: "семья участника СВО" },
  { key: "disabledChild", label: "ребёнок с инвалидностью" },
  { key: "specialNeedsChild", label: "ребёнок с ОВЗ" },
  { key: "fosterParent", label: "приёмный родитель" },
  { key: "mortgageIntent", label: "планирует ипотеку" },
  { key: "student", label: "студент" },
  { key: "teacher", label: "педагог" },
  { key: "selfEmployed", label: "самозанятый" },
  { key: "entrepreneur", label: "предприниматель" },
  { key: "employed", label: "работает по найму" },
  { key: "hasEmployees", label: "есть сотрудники" },
];

/** Человеческие названия согласий. */
const CONSENT_LABEL: Record<string, string> = {
  personal_data: "обработка персональных данных",
  mailing: "новости и анонсы",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Приведение к виду, по которому сравниваем: нижний регистр, «ё» = «е»,
 * дефисы и лишние пробелы схлопнуты. Иначе «Соловьёва» не находится по
 * «соловьева», а «Петрова-Водкина» — по «петрова водкина».
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function channelsOf(u: AdminUser): MessengerChannel[] {
  const out: MessengerChannel[] = [];
  if (u.telegramId != null) out.push("telegram");
  if (u.vkId != null) out.push("vk");
  if (u.maxId != null) out.push("max");
  return out;
}

type Filter = "all" | "verified" | "messenger" | "survey";

export function UsersList({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [region, setRegion] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const counts = useMemo(
    () => ({
      all: users.length,
      verified: users.filter((u) => u.emailVerifiedAt).length,
      messenger: users.filter((u) => channelsOf(u).length > 0).length,
      survey: users.filter((u) => u.survey).length,
    }),
    [users],
  );

  const regions = useMemo(
    () =>
      [...new Set(users.map((u) => u.survey?.region).filter((r): r is string => Boolean(r)))].sort((a, b) =>
        a.localeCompare(b, "ru"),
      ),
    [users],
  );

  const rows = useMemo(() => {
    // Слова запроса ищем по отдельности: тогда находится и «Иванова Мария»,
    // и «Мария Иванова», и просто «иванов» — порядок ввода не важен.
    const words = normalize(query).split(" ").filter(Boolean);
    return users.filter((u) => {
      if (filter === "verified" && !u.emailVerifiedAt) return false;
      if (filter === "messenger" && channelsOf(u).length === 0) return false;
      if (filter === "survey" && !u.survey) return false;
      if (region && u.survey?.region !== region) return false;
      if (words.length === 0) return true;
      const haystack = normalize([u.lastName, u.firstName, u.email, u.survey?.region ?? ""].join(" "));
      return words.every((w) => haystack.includes(w));
    });
  }, [users, query, filter, region]);

  const fullName = (u: AdminUser) => `${u.lastName} ${u.firstName}`.trim() || u.email;
  const resetKey = `${filter}|${query}|${region}`;

  const columns: Column<AdminUser>[] = [
    {
      key: "name",
      header: "Пользователь",
      sort: (a, b) => fullName(a).localeCompare(fullName(b), "ru"),
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar avatar={resolveUserAvatar(u)} size={34} />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-semibold leading-snug">
              <span className="truncate">{fullName(u)}</span>
              {u.role !== "user" && <StatusBadge tone="brand">{ROLE_LABELS[u.role]}</StatusBadge>}
            </p>
            <p className="truncate text-[12px] text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "region",
      header: "Регион",
      hideBelow: "lg",
      className: "w-[200px]",
      sort: (a, b) => (a.survey?.region ?? "").localeCompare(b.survey?.region ?? "", "ru"),
      cell: (u) => (
        <span className="line-clamp-2 text-[13px] text-muted-foreground">{u.survey?.region ?? "—"}</span>
      ),
    },
    {
      key: "email",
      header: "Почта",
      className: "w-[90px]",
      sort: (a, b) => Number(Boolean(b.emailVerifiedAt)) - Number(Boolean(a.emailVerifiedAt)),
      cell: (u) =>
        u.emailVerifiedAt ? (
          <StatusBadge tone="done" icon={<MailCheck />}>
            ок
          </StatusBadge>
        ) : (
          <StatusBadge tone="new" icon={<MailWarning />}>
            нет
          </StatusBadge>
        ),
    },
    {
      key: "messenger",
      header: "Мессенджер",
      hideBelow: "lg",
      className: "w-[130px]",
      sort: (a, b) => channelsOf(b).length - channelsOf(a).length,
      cell: (u) => {
        const ch = channelsOf(u);
        return ch.length === 0 ? (
          <span className="text-[13px] text-muted-foreground">—</span>
        ) : (
          <span className="flex flex-wrap gap-x-2 text-[12px] font-semibold">
            {ch.map((c) => (
              <span key={c} style={{ color: CHANNEL_COLORS[c] }}>
                {CHANNEL_LABELS[c]}
              </span>
            ))}
          </span>
        );
      },
    },
    {
      key: "saved",
      header: "Избр.",
      hideBelow: "xl",
      className: "w-[70px] text-right",
      sort: (a, b) => a.savedCount - b.savedCount,
      cell: (u) => <span className="tabular-nums text-[13px] text-muted-foreground">{u.savedCount || "—"}</span>,
    },
    {
      key: "created",
      header: "Регистрация",
      className: "w-[120px] text-right",
      sort: (a, b) => a.createdAt.localeCompare(b.createdAt),
      cell: (u) => <span className="tabular-nums text-[13px] text-muted-foreground">{formatDate(u.createdAt)}</span>,
    },
  ];

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "Все" },
    { key: "verified", label: "С почтой" },
    { key: "messenger", label: "С мессенджером" },
    { key: "survey", label: "С анкетой" },
  ];

  return (
    <>
      <FilterBar>
        <SegmentTabs
          value={filter}
          onChange={setFilter}
          items={FILTERS.map((f) => ({ ...f, count: counts[f.key] }))}
        />
        <FilterSearch value={query} onChange={setQuery} placeholder="Фамилия, имя, почта или регион" />
        <FilterSelect label="Регион" value={region} onChange={setRegion}>
          <option value="">Все регионы</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </FilterSelect>
        <ResetFilters
          visible={Boolean(query || region)}
          onClick={() => {
            setQuery("");
            setRegion("");
          }}
        />
      </FilterBar>

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(u) => u.id}
        onRowClick={setSelected}
        resetKey={resetKey}
        initialSort={{ key: "created", dir: "desc" }}
        empty={
          <EmptyState icon={<Users />} title="Никого не нашлось">
            Попробуйте другой запрос или сбросьте фильтры.
          </EmptyState>
        }
        mobileCard={(u) => (
          <div className="flex items-start gap-3">
            <UserAvatar avatar={resolveUserAvatar(u)} size={38} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">{fullName(u)}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-muted-foreground">
                <span>рег. {formatDate(u.createdAt)}</span>
                {u.survey?.region && (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="size-3" />
                    {u.survey.region}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}
      />

      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? fullName(selected) : ""}
        subtitle={selected?.email}
      >
        {selected && <UserDetails user={selected} />}
      </Drawer>
    </>
  );
}

function UserDetails({ user }: { user: AdminUser }) {
  const s = user.survey;
  const flags = s
    ? SURVEY_FLAGS.filter((f) => s[f.key] === true).map((f) => f.label)
    : [];
  const ages = s?.childrenAges?.length ? s.childrenAges.join(", ") : null;

  return (
    <div className="space-y-2.5 text-[13px]">
      <Field label="Почта подтверждена">
        {user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "нет"}
      </Field>
      <Field label="Мессенджер">
        {user.telegramId != null && <>Telegram id {user.telegramId}. </>}
        {user.vkId != null && <>VK id {user.vkId}. </>}
        {user.maxId != null && <>MAX id {user.maxId}. </>}
        {user.telegramId == null && user.vkId == null && user.maxId == null && (
          <>
            не подключён
            {user.messengerChoice
              ? ` (выбирал ${CHANNEL_LABELS[user.messengerChoice]})`
              : ""}
          </>
        )}
      </Field>
      {(user.utmSource || user.utmCampaign) && (
        <Field label="Откуда пришёл">
          {[user.utmSource, user.utmCampaign].filter(Boolean).join(" / ")}
        </Field>
      )}
      <Field label="Сохранено мер">{user.savedCount}</Field>

      {/* Согласия. У тех, кто зарегистрировался до появления галочек, записей
          нет — так и пишем, чтобы пустое место не читалось как «отказался». */}
      <Field label="Согласия">
        {user.consents.length === 0 ? (
          <span className="text-muted-foreground">
            записей нет — регистрация до введения галочек
          </span>
        ) : (
          <span className="space-y-0.5">
            {user.consents.map((c, i) => (
              <span key={i} className="block">
                {CONSENT_LABEL[c.kind] ?? c.kind} — ред. {c.docVersion},{" "}
                {formatDate(c.acceptedAt)}
                {c.revokedAt ? ` · отозвано ${formatDate(c.revokedAt)}` : ""}
              </span>
            ))}
          </span>
        )}
      </Field>

      {s ? (
        <>
          <Field label="Анкета">
            обновлена {formatDate(user.surveyUpdatedAt)}
          </Field>
          {s.region && <Field label="Регион">{s.region}</Field>}
          <Field label="Дети">
            {s.childrenCount
              ? `${s.childrenCount}${ages ? ` (возраст: ${ages})` : ""}`
              : "нет"}
          </Field>
          {typeof s.taxSystem === "string" && (
            <Field label="Налогообложение ИП">
              {TAX_SYSTEM_LABEL[s.taxSystem as TaxSystem] ?? s.taxSystem}
            </Field>
          )}
          {flags.length > 0 && (
            <Field label="Отметил">{flags.join(", ")}</Field>
          )}
        </>
      ) : (
        <Field label="Анкета">не заполнена</Field>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}
