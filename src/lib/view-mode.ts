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

/** В какие режимы может переключаться каждая настоящая роль. */
export const ALLOWED_VIEW_MODES: Record<AppRole, ViewMode[]> = {
  owner: ["owner", "tech", "coordinator", "user"],
  tech: ["owner", "tech", "coordinator", "user"],
  coordinator: ["coordinator", "user"],
  user: ["user"],
};

/**
 * Режим из cookie — только если он разрешён настоящей роли, иначе —
 * «пользователь». Раньше владелец/техспец/координатор по умолчанию
 * попадали сразу в свою рабочую роль, а сама cookie жила полгода — на деле
 * это путало: человек заходил в приложение через несколько дней и попадал
 * не в личный кабинет, а в панель управления или в её обрезанный вид на
 * /profile, без объяснения, почему. Теперь при входе всегда «пользователь»,
 * а рабочая роль — осознанный выбор через переключатель на каждый заход.
 */
export async function getViewMode(role: AppRole): Promise<ViewMode> {
  const c = await cookies();
  const raw = c.get(COOKIE)?.value;
  const allowed = ALLOWED_VIEW_MODES[role];
  if (raw === "owner" || raw === "tech" || raw === "coordinator" || raw === "user") {
    if (allowed.includes(raw)) return raw;
  }
  return "user";
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
  // Без maxAge — сессионная cookie: держит выбранную роль, пока открыт
  // браузер/приложение, но не переживает следующий вход (см. getViewMode).
  c.set(COOKIE, mode, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}
