import { NextResponse } from "next/server";
import { createBotHelpRequest } from "@/lib/bot-help";
import type { MessengerChannel } from "@/lib/onboarding-db";

/**
 * Вебхук Salebot: человек написал боту, потому что не смог войти.
 *
 * В приложении под формой входа есть строчка «код не пришёл — напишите нам»
 * со ссылками в Telegram, MAX и «ВКонтакте». Ссылки запускают в Salebot
 * цепочку по кодовому слову helpcode, а цепочка дёргает этот адрес.
 *
 * Ждём (в query или в теле POST):
 *   secret            — общий секрет (env SALEBOT_WEBHOOK_SECRET)
 *   salebot_client_id — id клиента в Salebot: по нему же потом отвечаем
 *   channel           — telegram | vk | max
 *   name              — имя из мессенджера            [необязательно]
 *   username          — ник                            [необязательно]
 *   note              — что человек написал            [необязательно]
 *
 * Секрет тот же, что у вебхука подключения мессенджера: настройка одна.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHANNELS = ["telegram", "vk", "max"] as const;

async function handle(request: Request): Promise<Response> {
  const sp = new URL(request.url).searchParams;

  // Тело читаем и как JSON, и как форму: Salebot шлёт JSON без заголовка.
  let body: Record<string, unknown> = {};
  if (request.method === "POST") {
    let raw = "";
    try {
      raw = await request.text();
    } catch {
      /* тела нет */
    }
    if (raw) {
      try {
        body = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        try {
          body = Object.fromEntries(new URLSearchParams(raw));
        } catch {
          /* не распарсилось — остаются query-параметры */
        }
      }
    }
  }

  const get = (k: string): string =>
    (sp.get(k) ?? (body[k] as string | undefined) ?? "").toString().trim();

  const secret = process.env.SALEBOT_WEBHOOK_SECRET;
  if (!secret || get("secret") !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const clientId = get("salebot_client_id") || get("client_id");
  const channel = get("channel") as MessengerChannel;
  if (!clientId) {
    return NextResponse.json(
      { ok: false, error: "salebot_client_id required" },
      { status: 400 },
    );
  }
  if (!CHANNELS.includes(channel as (typeof CHANNELS)[number])) {
    return NextResponse.json(
      { ok: false, error: "channel must be telegram|vk|max" },
      { status: 400 },
    );
  }

  const res = await createBotHelpRequest({
    salebotClientId: clientId,
    channel,
    name: get("name") || get("first_name") || null,
    username: get("username") || null,
    note: get("note") || get("text") || null,
  });

  // created:false — заявка от этого человека уже висит незакрытой. Для
  // воронки это не ошибка: она получит ok и покажет человеку тот же ответ.
  return NextResponse.json({ ok: true, created: res.created, id: res.id });
}

export async function POST(request: Request): Promise<Response> {
  return handle(request);
}

export async function GET(request: Request): Promise<Response> {
  return handle(request);
}
