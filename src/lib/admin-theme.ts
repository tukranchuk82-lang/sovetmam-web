import "server-only";
import { cookies } from "next/headers";

export type AdminTheme = "city" | "blue" | "beige" | "dark";

const COOKIE = "admin_theme";
const DEFAULT: AdminTheme = "city";

export async function getAdminTheme(): Promise<AdminTheme> {
  const c = await cookies();
  const v = c.get(COOKIE)?.value;
  if (v === "city" || v === "beige" || v === "dark" || v === "blue") return v;
  return DEFAULT;
}

export async function setAdminThemeCookie(theme: AdminTheme): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, theme, {
    httpOnly: false, // чтобы возможно отображать в UI без лишних запросов
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export const ADMIN_THEME_LABELS: Record<AdminTheme, string> = {
  city: "Город",
  blue: "Синяя",
  beige: "Бежевая",
  dark: "Тёмная",
};
