"use client";

import { useMemo, useState } from "react";
import {
  Search,
  MapPin,
  Heart,
  MailCheck,
  MailWarning,
  ChevronDown,
} from "lucide-react";
import type { AdminUser } from "@/lib/users-admin";
// Только типы: onboarding-db — серверный модуль (server-only), его константы
// сюда тянуть нельзя, поэтому подписи ролей дублируем ниже.
import type { AppRole, MessengerChannel } from "@/lib/onboarding-db";
import { resolveUserAvatar } from "@/lib/avatar";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CHANNEL_LABELS: Record<MessengerChannel, string> = {
  telegram: "Telegram",
  vk: "VK",
  max: "MAX",
};

const ROLE_LABELS: Record<AppRole, string> = {
  user: "Пользователь",
  owner: "Владелец",
  tech: "Техспец",
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
];

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

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "verified", label: "Подтвердили почту" },
  { key: "messenger", label: "С мессенджером" },
  { key: "survey", label: "С анкетой" },
];

export function UsersList({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const visible = useMemo(() => {
    // Слова запроса ищем по отдельности: тогда находится и «Иванова Мария»,
    // и «Мария Иванова», и просто «иванов» — порядок ввода не важен.
    const words = normalize(query).split(" ").filter(Boolean);
    return users.filter((u) => {
      if (filter === "verified" && !u.emailVerifiedAt) return false;
      if (filter === "messenger" && channelsOf(u).length === 0) return false;
      if (filter === "survey" && !u.survey) return false;
      if (words.length === 0) return true;
      const haystack = normalize(
        [u.lastName, u.firstName, u.email, u.survey?.region ?? ""].join(" "),
      );
      return words.every((w) => haystack.includes(w));
    });
  }, [users, query, filter]);

  return (
    <>
      <div className="mt-4 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по фамилии, имени, почте или региону"
            autoComplete="off"
            className="h-10 w-full rounded-xl border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-background hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Показано: {visible.length} из {users.length}
      </p>

      {visible.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed bg-muted/40 px-4 py-10 text-center">
          <p className="text-sm font-medium">Никого не нашлось</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Попробуйте другой запрос или снимите фильтр
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {visible.map((u) => {
            const channels = channelsOf(u);
            const open = openId === u.id;
            const fullName = `${u.lastName} ${u.firstName}`.trim() || u.email;

            return (
              <div key={u.id} className="rounded-xl border bg-card">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : u.id)}
                  className="flex w-full items-start gap-3 p-3 text-left"
                >
                  <UserAvatar avatar={resolveUserAvatar(u)} size={38} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold leading-snug">
                        {fullName}
                      </span>
                      {u.role !== "user" && (
                        <Badge variant="default" className="text-[10px]">
                          {ROLE_LABELS[u.role]}
                        </Badge>
                      )}
                      {u.emailVerifiedAt ? (
                        <MailCheck className="size-3.5 text-emerald-600" />
                      ) : (
                        <MailWarning className="size-3.5 text-amber-600" />
                      )}
                      {channels.map((ch) => (
                        <span
                          key={ch}
                          className="text-[10px] font-semibold"
                          style={{ color: CHANNEL_COLORS[ch] }}
                        >
                          {CHANNEL_LABELS[ch]}
                        </span>
                      ))}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {u.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      <span>рег. {formatDate(u.createdAt)}</span>
                      {u.survey?.region && (
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="size-3" />
                          {u.survey.region}
                        </span>
                      )}
                      {u.savedCount > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <Heart className="size-3" />
                          {u.savedCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
                      open && "rotate-180",
                    )}
                  />
                </button>

                {open && <UserDetails user={u} />}
              </div>
            );
          })}
        </div>
      )}
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
    <div className="space-y-2 border-t px-3 py-3 text-xs">
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
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}
