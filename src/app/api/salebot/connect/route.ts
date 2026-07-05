import { NextResponse } from "next/server";
import {
  markMessengerConnected,
  type MessengerChannel,
} from "@/lib/onboarding-db";

// Вебхук, который дёргает воронка Salebot, когда человек зашёл в бота.
// Ожидает (в query или в теле POST):
//   secret            — общий секрет (env SALEBOT_WEBHOOK_SECRET)
//   app_id            — id пользователя в нашей БД (передавали в прокси-ссылке)
//   channel           — telegram | vk | max
//   messenger_id      — id человека в мессенджере (tg_id / vk_id / max)  [опц.]
//   salebot_client_id — id клиента в Salebot                            [опц.]
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHANNELS = ["telegram", "vk", "max"] as const;

async function handle(request: Request): Promise<Response> {
  const sp = new URL(request.url).searchParams;

  let body: Record<string, unknown> = {};
  if (request.method === "POST") {
    const ct = request.headers.get("content-type") ?? "";
    try {
      if (ct.includes("application/json")) {
        body = (await request.json()) as Record<string, unknown>;
      } else if (ct.includes("form")) {
        const fd = await request.formData();
        body = Object.fromEntries(
          [...fd.entries()].map(([k, v]) => [k, String(v)]),
        );
      }
    } catch {
      // тело не распарсилось — работаем только с query-параметрами
    }
  }

  const get = (k: string): string =>
    (sp.get(k) ?? (body[k] as string | undefined) ?? "").toString().trim();

  const secret = process.env.SALEBOT_WEBHOOK_SECRET;
  if (!secret || get("secret") !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const appId = get("app_id");
  const channel = get("channel") as MessengerChannel;
  if (!appId) {
    return NextResponse.json({ ok: false, error: "app_id required" }, { status: 400 });
  }
  if (!CHANNELS.includes(channel as (typeof CHANNELS)[number])) {
    return NextResponse.json(
      { ok: false, error: "channel must be telegram|vk|max" },
      { status: 400 },
    );
  }

  const ok = await markMessengerConnected({
    appId,
    channel,
    messengerId: get("messenger_id") || null,
    salebotClientId: get("salebot_client_id") || null,
  });
  if (!ok) {
    return NextResponse.json(
      { ok: false, error: "user not found or update failed" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request): Promise<Response> {
  return handle(request);
}

export async function POST(request: Request): Promise<Response> {
  return handle(request);
}
