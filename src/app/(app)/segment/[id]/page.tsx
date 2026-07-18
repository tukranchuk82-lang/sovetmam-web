import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { SegmentMeasures } from "@/components/segment-measures";
import { SEGMENT_ICONS } from "@/components/segment-icon";
import { SEGMENTS, getSegment, type SegmentId } from "@/lib/measures";
import { getMeasuresBySegment } from "@/lib/measures-db";
import { getCurrentAppUser } from "@/lib/user-session";
import { REGION_COOKIE } from "@/lib/region";

export function generateStaticParams() {
  return SEGMENTS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const segment = getSegment(id);
  return { title: segment ? segment.title : "Меры поддержки" };
}

export default async function SegmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const segment = getSegment(id);
  if (!segment) notFound();

  const list = await getMeasuresBySegment(segment.id as SegmentId);
  const Icon = SEGMENT_ICONS[segment.id];

  // Регион: сначала из cookie (пользователь явно выбрал регион на этом
  // экране), иначе — из анкеты подбора (app_users.survey.region), если
  // пользователь авторизован и её заполнял. Нет ни там, ни там → спросим
  // на клиенте.
  // Было getCurrentDemoUser() — демо-режим сняли в июле, эта функция больше
  // никогда не возвращает пользователя, поэтому регион реальных
  // авторизованных пользователей тут никогда не подхватывался.
  const cookieStore = await cookies();
  const user = await getCurrentAppUser();
  const surveyRegion =
    typeof user?.survey?.region === "string" ? user.survey.region : null;
  const initialRegion =
    cookieStore.get(REGION_COOKIE)?.value || surveyRegion || null;

  return (
    <div className="px-4 py-5">

      <div className="mt-3 flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_6px_16px_-6px_rgba(142,29,44,0.5)]">
          <Icon className="size-6" />
        </div>
        <h1 className="text-xl font-extrabold leading-tight">{segment.title}</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{segment.short}</p>

      {/* Призыв к индивидуальному подбору — вверху, чтобы был виден сразу,
          даже когда мер в разделе станет много */}
      <Link
        href="/podbor"
        className="mt-4 flex items-center gap-3 rounded-2xl bg-[#2d2d2d] p-4 text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.35)] transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_14px_28px_-10px_rgba(0,0,0,0.45)]"
      >
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_6px_16px_-6px_rgba(142,29,44,0.6)]">
          <Sparkles className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">
            Подберём меры лично для вас
          </p>
          <p className="mt-0.5 text-xs text-white/75">
            Ответьте на несколько вопросов — покажем, что положено именно вашей
            семье
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-white/60" />
      </Link>

      <SegmentMeasures measures={list} initialRegion={initialRegion} />
    </div>
  );
}
