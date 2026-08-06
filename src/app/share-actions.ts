"use server";

import { headers } from "next/headers";
import { getCurrentAppUser } from "@/lib/user-session";
import { recordShareEvent } from "@/lib/share";

/**
 * Отметки о том, что ссылкой поделились и что по ней пришли.
 *
 * Обе вызываются из браузера и ничего не возвращают: счётчик не должен ни
 * задерживать человека, ни показывать ему ошибку.
 */

export async function recordShareAction(input: {
  path: string;
  channel: "through" | "copy";
}): Promise<void> {
  const user = await getCurrentAppUser();
  const ua = (await headers()).get("user-agent");
  await recordShareEvent({
    kind: "share",
    path: input.path,
    channel: input.channel,
    userId: user?.id ?? null,
    userAgent: ua,
  });
}

export async function recordVisitAction(input: {
  path: string;
  ref: string;
}): Promise<void> {
  const user = await getCurrentAppUser();
  const ua = (await headers()).get("user-agent");
  await recordShareEvent({
    kind: "visit",
    path: input.path,
    ref: input.ref,
    userId: user?.id ?? null,
    userAgent: ua,
  });
}
