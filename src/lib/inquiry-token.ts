import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Одноразовая ссылка на форму ответа для письма.
 *
 * Кнопка «Ответить» в письме должна открывать форму сразу, без входа в
 * приложение — иначе с телефона это лишние три шага. Поэтому в ссылку кладём
 * подписанный токен: id обращения + срок годности + HMAC на служебном ключе.
 *
 * Отдельной таблицы под токены не заводим: подпись самодостаточна, а срок
 * зашит внутрь. Токен даёт право ответить ровно на одно обращение и ничего
 * больше — ни читать чужие, ни заходить в админку.
 */
const TTL_DAYS = 14;

function secret(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`inquiry-reply:${payload}`).digest("hex");
}

/** Токен вида «<id>.<срок>.<подпись>» для ссылки из письма. */
export function createReplyToken(inquiryId: string): string {
  const exp = Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${inquiryId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export type ReplyTokenResult =
  | { ok: true; inquiryId: string }
  | { ok: false; reason: "invalid" | "expired" };

export function verifyReplyToken(token: string): ReplyTokenResult {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "invalid" };

  const [inquiryId, expRaw, sig] = parts;
  const expected = sign(`${inquiryId}.${expRaw}`);

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "invalid" };
  }

  const exp = Number(expRaw);
  if (!Number.isFinite(exp)) return { ok: false, reason: "invalid" };
  if (exp < Date.now()) return { ok: false, reason: "expired" };

  return { ok: true, inquiryId };
}

/** Полный адрес формы ответа — для кнопки в письме. */
export function buildReplyUrl(inquiryId: string): string {
  return `${appUrl()}/otvet/${createReplyToken(inquiryId)}`;
}

/**
 * Базовый адрес приложения. В письме нужна абсолютная ссылка, а Next о своём
 * домене не знает — берём из env, иначе боевой адрес по умолчанию.
 *
 * Сначала смотрим APP_URL и только потом NEXT_PUBLIC_APP_URL. Переменные с
 * префиксом NEXT_PUBLIC_ Next подставляет в код на сборке, поэтому в Coolify
 * их пришлось бы помечать как build-переменную и пересобирать образ. Ссылки
 * в письмах строит только сервер — обычной серверной переменной достаточно,
 * и она подхватывается простым перезапуском.
 */
export function appUrl(): string {
  const raw =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://app.sovetmam.ru";
  return raw.replace(/\/+$/, "");
}
