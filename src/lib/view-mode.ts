import "server-only";
import { cookies } from "next/headers";
import type { AppRole } from "@/lib/onboarding-db";

/**
 * Режим просмотра для владельца, техспеца и координатора.
 *
 * У каждого из них — своя настоящая роль в базе (`app_users.role`), но
 * владельцу и техспецу иногда нужно посмотреть на приложение глазами другой
 * роли: проверить, что видит координатор, или зайти как обычный пользователь,
 * не заводя второй аккаунт. Координатор смотрит только своими глазами или
 * глазами обычного пользователя — в панель владельца/техспеца ему хода нет.
 *
 * Это ТОЛЬКО переключатель интерфейса — не источник прав. Любое действие,
 * которое может что-то испортить (кого-то разжаловать, отредактировать чужой
 * регион), сервер проверяет по настоящей роли из базы, а не по этому cookie:
 * cookie не httpOnly и в принципе может быть подделан в браузере.
 */
export type ViewMode = "owner" | "tech" | "coordinator" | "user";

const COOKIE = "sm_view";
const MAX_AGE = 60 * 60 * 24 * 180; // полгода — переключать каждый заход не нужно

/** В какие режимы может переключаться каждая настоящая роль. */
export const ALLOWED_VIEW_MODES: Record<AppRole, ViewMode[]> = {
  owner: ["owner", "tech", "coordinator", "user"],
  tech: ["owner", "tech", "coordinator", "user"],
  coordinator: ["coordinator", "user"],
  user: ["user"],
};

/** Режим по умолчанию для роли — тот, с которого начинают работу. */
export function defaultViewMode(role: AppRole): ViewMode {
  if (role === "owner") return "owner";
  if (role === "tech") return "tech";
  if (role === "coordinator") return "coordinator";
  return "user";
}

/** Режим из cookie — только если он разрешён настоящей роли, иначе режим по умолчанию. */
export async function getViewMode(role: AppRole): Promise<ViewMode> {
  const c = await cookies();
  const raw = c.get(COOKIE)?.value;
  const allowed = ALLOWED_VIEW_MODES[role];
  if (raw === "owner" || raw === "tech" || raw === "coordinator" || raw === "user") {
    if (allowed.includes(raw)) return raw;
  }
  return defaultViewMode(role);
}

/**
 * Какой «объём» админки показывать конкретной странице — три уровня вместо
 * четырёх режимов: «user» тут не при делах (в /admin по нему не попадают
 * специально, но если владелец или техспец всё же открыли страницу /admin/…
 * напрямую, находясь в пользовательском режиме, это не повод резать им
 * функциональность — они всё равно полные админы).
 *
 * У координатора это всегда "coordinator", какой бы cookie ни была
 * подделана: единственный параметр здесь, которому вправду доверяют.
 */
export type AdminScope = "tech" | "owner" | "coordinator";

export function effectiveAdminScope(role: AppRole, mode: ViewMode): AdminScope {
  if (role === "coordinator") return "coordinator";
  if (role !== "owner" && role !== "tech") return "owner";
  return mode === "tech" || mode === "coordinator" ? (mode as AdminScope) : "owner";
}

export async function setViewMode(mode: ViewMode): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}
