import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { markMessengerConnected, type MessengerChannel } from "@/lib/onboarding-db";

/**
 * Переход в приложение из бота.
 *
 * Раньше подключение шло только в одну сторону: человек в приложении выбирал
 * мессенджер, уходил в бота, воронка Salebot дёргала наш вебхук и присылала в
 * бот сообщение «мессенджер подключён». Если же человек приходит из бота сам —
 * этот круг лишний: бот уже знает, кто он, и достаточно передать это в ссылке.
 *
 * Ссылка выглядит так:
 *   https://app.sovetmam.ru/iz-bota?ch=telegram&cid=910858576&mid=953684169&k=КЛЮЧ
 *
 * `k` — общий секрет (env SALEBOT_LINK_KEY): без него личность из ссылки
 * игнорируется. Иначе кто угодно мог бы прицепить чужой мессенджер к своему
 * аккаунту и получать чужие уведомления.
 */

const CHANNELS = ["telegram", "vk", "max"] as const;

export type BotIdentity = {
  channel: MessengerChannel;
  salebotClientId: string | null;
  messengerId: string | null;
  avatarUrl: string | null;
};

/** Разбирает параметры ссылки. null — ссылка без ключа или без канала. */
export function readBotIdentity(params: Record<string, string | undefined>): BotIdentity | null {
  const key = process.env.SALEBOT_LINK_KEY;
  if (!key || (params.k ?? "") !== key) return null;

  const channel = (params.ch ?? "").toLowerCase() as MessengerChannel;
  if (!CHANNELS.includes(channel as (typeof CHANNELS)[number])) return null;

  const clean = (v: string | undefined): string | null => {
    const s = (v ?? "").trim();
    // Salebot подставляет пустые переменные как есть — «#{client_id}» без
    // значения приходит текстом, такие подписи игнорируем.
    if (!s || s.startsWith("#{") || s.startsWith("{{")) return null;
    return s;
  };

  return {
    channel,
    salebotClientId: clean(params.cid),
    messengerId: clean(params.mid),
    avatarUrl: clean(params.avatar) ?? clean(params.photo),
  };
}

// ── Отложенное подключение ─────────────────────────────────────────────────
// Человек может прийти из бота, ещё не войдя в приложение. Тогда личность
// придерживаем в подписанной cookie и подключаем сразу после входа.

const COOKIE = "sm_from_bot";
const TTL_MINUTES = 60;

function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`from-bot:${payload}`).digest("hex");
}

/**
 * Готовая cookie с отложенной личностью. Ставить её должен маршрут: страницы
 * в Next менять cookie не могут, это разрешено только маршрутам и действиям.
 */
export function botIdentityCookie(identity: BotIdentity): {
  name: string;
  value: string;
  options: { httpOnly: true; sameSite: "lax"; path: string; maxAge: number };
} {
  const payload = JSON.stringify({ ...identity, exp: Date.now() + TTL_MINUTES * 60_000 });
  return {
    name: COOKIE,
    value: `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`,
    options: { httpOnly: true, sameSite: "lax", path: "/", maxAge: TTL_MINUTES * 60 },
  };
}

/** Достаёт отложенную личность и сразу забывает её. */
export async function takeBotIdentity(): Promise<BotIdentity | null> {
  const c = await cookies();
  const raw = c.get(COOKIE)?.value;
  if (!raw) return null;
  c.delete(COOKIE);

  const i = raw.lastIndexOf(".");
  if (i < 0) return null;

  const payload = Buffer.from(raw.slice(0, i), "base64url").toString();
  const a = Buffer.from(raw.slice(i + 1));
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(payload) as BotIdentity & { exp: number };
    if (!data.exp || data.exp < Date.now()) return null;
    return {
      channel: data.channel,
      salebotClientId: data.salebotClientId,
      messengerId: data.messengerId,
      avatarUrl: data.avatarUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Подключает мессенджер пользователю. Ничего не отправляет в бот: человек и
 * так только что оттуда пришёл, лишнее сообщение выглядело бы спамом.
 */
export async function connectFromBot(userId: string, identity: BotIdentity): Promise<boolean> {
  return markMessengerConnected({
    appId: userId,
    channel: identity.channel,
    messengerId: identity.messengerId,
    salebotClientId: identity.salebotClientId,
    avatarUrl: identity.avatarUrl,
  });
}

/** Применяет отложенное подключение после входа. Возвращает, было ли что применять. */
export async function applyPendingBotIdentity(userId: string): Promise<boolean> {
  const identity = await takeBotIdentity();
  if (!identity) return false;
  return connectFromBot(userId, identity);
}
