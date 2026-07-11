import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Sparkles, ChevronRight, Users } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { SegmentMeasures } from "@/components/segment-measures";
import {
  getMeasuresForFamilySize,
  getMeasuresForManyChildren,
} from "@/lib/measures-db";
import { getCurrentAppUser } from "@/lib/user-session";
import { REGION_COOKIE } from "@/lib/region";

// Плитки «Семья с N детьми» и «Многодетная семья» с главной. В отличие от
// плиток «Ждём N-го» (они про рождение и фильтруются по segments), эти — про
// СЛОЖИВШУЮСЯ семью и фильтруются по количеству детей (criteria.minChildren):
// семья с N детьми видит меры, требующие не больше N. См. measures-db.ts.
const FAMILY: Record<
  string,
  { title: string; short: string; count: number | "many" }
> = {
  "1": {
    title: "Семья с одним ребёнком",
    short: "Меры поддержки для семей, где растёт один ребёнок.",
    count: 1,
  },
  "2": {
    title: "Семья с двумя детьми",
    short: "Меры поддержки для семей с двумя детьми.",
    count: 2,
  },
  "3": {
    title: "Семья с тремя детьми",
    short: "Меры поддержки для семей с тремя детьми.",
    count: 3,
  },
  "4": {
    title: "Семья с четырьмя детьми",
    short: "Меры поддержки для семей с четырьмя детьми.",
    count: 4,
  },
  "5": {
    title: "Семья с пятью детьми",
    short: "Меры поддержки для семей с пятью детьми.",
    count: 5,
  },
  many: {
    title: "Многодетная семья",
    short: "Меры поддержки для семей с тремя и более детьми.",
    count: "many",
  },
};

export function generateStaticParams() {
  return Object.keys(FAMILY).map((count) => ({ count }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ count: string }>;
}) {
  const { count } = await params;
  const cfg = FAMILY[count];
  return { title: cfg ? cfg.title : "Меры поддержки" };
}

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ count: string }>;
}) {
  const { count } = await params;
  const cfg = FAMILY[count];
  if (!cfg) notFound();

  const list =
    cfg.count === "many"
      ? await getMeasuresForManyChildren()
      : await getMeasuresForFamilySize(cfg.count);

  // Регион: cookie (явный выбор на этом экране) → анкета подбора. См. segment/[id].
  const cookieStore = await cookies();
  const user = await getCurrentAppUser();
  const surveyRegion =
    typeof user?.survey?.region === "string" ? user.survey.region : null;
  const initialRegion =
    cookieStore.get(REGION_COOKIE)?.value || surveyRegion || null;

  return (
    <div className="px-4 py-5">
      <BackLink href="/" label="На главную" />

      <div className="mt-3 flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_6px_16px_-6px_rgba(142,29,44,0.5)]">
          <Users className="size-6" />
        </div>
        <h1 className="text-xl font-extrabold leading-tight">{cfg.title}</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{cfg.short}</p>

      {/* Призыв к индивидуальному подбору */}
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
