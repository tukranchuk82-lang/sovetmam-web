import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppUserById, type AppUser } from "@/lib/onboarding-db";

// Сессия обычного пользователя: в httpOnly-cookie кладём id пользователя и
// его HMAC-подпись (секрет — service-role ключ), чтобы cookie нельзя было
// подделать. Для прототипа этого достаточно; при боевой выкатке можно перейти
// на полноценный JWT/Supabase Auth.

const COOKIE = "sm_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-secret";
}

function sign(userId: string): string {
  return createHmac("sha256", secret()).update(userId).digest("hex");
}

function verify(userId: string, sig: string): boolean {
  const expected = sign(userId);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setUserSession(userId: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearUserSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}

/** Текущий залогиненный пользователь (или null). */
export async function getCurrentAppUser(): Promise<AppUser | null> {
  const c = await cookies();
  const raw = c.get(COOKIE)?.value;
  if (!raw) return null;
  const idx = raw.lastIndexOf(".");
  if (idx < 0) return null;
  const userId = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  if (!verify(userId, sig)) return null;
  return getAppUserById(userId);
}
