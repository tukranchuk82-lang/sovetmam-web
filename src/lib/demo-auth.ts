import "server-only";
import { cookies } from "next/headers";

/**
 * Демо-авторизация: имитирует вход через Telegram/VK/MAX. В прототипе
 * никаких реальных ботов нет — пользователь выбирает канал и роль,
 * а мы кладём в cookie ключ от заранее заготовленного «mock user».
 *
 * Когда дойдём до боевой реализации — этот модуль заменится на чтение
 * из Supabase auth + profiles.
 */

export type Channel = "telegram" | "vk" | "max";
export type Role = "user" | "owner" | "tech";

export interface DemoUser {
  id: string;
  channel: Channel;
  role: Role;
  name: string;
  username: string;
  /** Для генерации цветной аватарки с инициалами. */
  avatarColor: string;
  /** Регион проживания из «личного кабинета» (для фильтра региональных мер). */
  region?: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  user: "Пользователь",
  owner: "Заказчик",
  tech: "Техспец",
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  telegram: "Telegram",
  vk: "ВКонтакте",
  max: "MAX",
};

export const CHANNEL_COLORS: Record<Channel, string> = {
  telegram: "#229ED9",
  vk: "#0077FF",
  max: "#7C3AED",
};

const DEMO_USERS: Record<string, DemoUser> = {
  "telegram:user": {
    id: "tg_1000",
    channel: "telegram",
    role: "user",
    name: "Анна Петрова",
    username: "@anna_petrova",
    avatarColor: "#FF6B9D",
    region: "Москва",
  },
  "telegram:owner": {
    id: "tg_2000",
    channel: "telegram",
    role: "owner",
    name: "Светлана Иванова",
    username: "@s_ivanova",
    avatarColor: "#5B8DEF",
    region: "Московская область",
  },
  "telegram:tech": {
    id: "tg_3000",
    channel: "telegram",
    role: "tech",
    name: "Иван Сидоров",
    username: "@i_sidorov",
    avatarColor: "#10B981",
    region: "Москва",
  },
  "vk:user": {
    id: "vk_1000",
    channel: "vk",
    role: "user",
    name: "Мария Кузнецова",
    username: "vk.com/m_kuznetsova",
    avatarColor: "#F59E0B",
    region: "Московская область",
  },
  "vk:owner": {
    id: "vk_2000",
    channel: "vk",
    role: "owner",
    name: "Ольга Михайлова",
    username: "vk.com/o_mikhaylova",
    avatarColor: "#8B5CF6",
    region: "Москва",
  },
  "vk:tech": {
    id: "vk_3000",
    channel: "vk",
    role: "tech",
    name: "Андрей Волков",
    username: "vk.com/a_volkov",
    avatarColor: "#06B6D4",
    region: "Москва",
  },
  "max:user": {
    id: "max_1000",
    channel: "max",
    role: "user",
    name: "Екатерина Морозова",
    username: "max.ru/e_morozova",
    avatarColor: "#EC4899",
    region: "Москва",
  },
  "max:owner": {
    id: "max_2000",
    channel: "max",
    role: "owner",
    name: "Татьяна Соколова",
    username: "max.ru/t_sokolova",
    avatarColor: "#EF4444",
    region: "Московская область",
  },
  "max:tech": {
    id: "max_3000",
    channel: "max",
    role: "tech",
    name: "Алексей Громов",
    username: "max.ru/a_gromov",
    avatarColor: "#14B8A6",
    region: "Москва",
  },
};

const COOKIE_NAME = "sm_demo_user";

export function getDemoUserKey(channel: Channel, role: Role): string {
  return `${channel}:${role}`;
}

export function getDemoUserByKey(key: string): DemoUser | null {
  return DEMO_USERS[key] ?? null;
}

/** Текущий залогиненный демо-пользователь (или null). */
export async function getCurrentDemoUser(): Promise<DemoUser | null> {
  const c = await cookies();
  const key = c.get(COOKIE_NAME)?.value;
  if (!key) return null;
  return getDemoUserByKey(key);
}

/** Кладём ключ пользователя в cookie. Server-side. */
export async function setDemoUserCookie(key: string): Promise<void> {
  if (!getDemoUserByKey(key)) {
    throw new Error(`Unknown demo user key: ${key}`);
  }
  const c = await cookies();
  c.set(COOKIE_NAME, key, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 дней
  });
}

export async function clearDemoUserCookie(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

/** Инициалы для аватарки. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}
