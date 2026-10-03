import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Дописывает в сегодняшний просмотр меры, что человек на странице делал:
 * сколько был на ней, как далеко прокрутил, до каких разделов дошёл, что нажал.
 *
 * Приходит через sendBeacon при уходе со страницы, поэтому отвечает коротко и
 * ничего не требует от клиента. Устройство узнаём по cookie vid (httpOnly — из
 * браузерного кода его не прочитать и не подделать). Если сегодняшнего просмотра
 * нет (например, это сотрудник — их просмотры не пишем), запрос ничего не делает.
 * Значения берём с запасом на «мусор»: числа ограничиваем, массивы — только из
 * известных слов.
 */

const SECTIONS = new Set(["eligibility", "howto", "documents", "tips"]);
const ACTIONS = new Set(["link", "ask"]);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug : "";
  if (!/^[a-z0-9-]{1,160}$/i.test(slug)) return NextResponse.json({ ok: false }, { status: 400 });

  const visitor = (await cookies()).get("vid")?.value;
  if (!visitor) return NextResponse.json({ ok: true });

  const clamp = (v: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  const seconds = clamp(body.seconds, 600);
  const scroll = clamp(body.scroll, 100);
  const pick = (v: unknown, allowed: Set<string>) =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && allowed.has(x)))] : [];
  const sections = pick(body.sections, SECTIONS);
  const actions = pick(body.actions, ACTIONS);

  const sb = createSupabaseAdminClient();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const { data: row } = await sb
    .from("measure_views")
    .select("id, dwell_seconds, max_scroll, sections, actions")
    .eq("visitor", visitor)
    .eq("slug", slug)
    .gte("created_at", dayStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return NextResponse.json({ ok: true });

  // Повторные заходы за день складываем: время суммируется (с потолком), прокрутка
  // — максимум, разделы и действия — объединение.
  await sb
    .from("measure_views")
    .update({
      dwell_seconds: Math.min(1800, (row.dwell_seconds as number) + seconds),
      max_scroll: Math.max(row.max_scroll as number, scroll),
      sections: [...new Set([...(row.sections as string[]), ...sections])],
      actions: [...new Set([...(row.actions as string[]), ...actions])],
    })
    .eq("id", row.id as string);

  return NextResponse.json({ ok: true });
}
