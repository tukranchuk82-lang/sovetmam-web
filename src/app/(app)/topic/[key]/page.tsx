import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Sparkles, ChevronRight, LayoutGrid } from "lucide-react";
import { SegmentMeasures } from "@/components/segment-measures";
import { getAllMeasures } from "@/lib/measures-db";
import { getCurrentAppUser } from "@/lib/user-session";
import { REGION_COOKIE } from "@/lib/region";
import type { SupportMeasure } from "@/lib/measures";

/**
 * Тематические плитки («лепестки» LIFE_CATEGORIES на главной): Деньги, Здоровье,
 * Жильё, ЖКХ, Проезд и т.д.
 *
 * Фильтруются по ВИТРИННЫМ категориям `topic-*` в `segments` — по той же схеме,
 * что и ситуационные плитки. Тема — это «про что мера», и мера часто относится
 * сразу к нескольким («компенсация ЖКУ» = Жильё + ЖКХ), поэтому нужен список,
 * а не одно поле. Поле `measures.category` (одно значение на меру) оставлено как
 * есть — оно работает на выпадающий фильтр в каталоге.
 *
 * Метки topic-* в SegmentId не входят и в анкете не участвуют — отсюда
 * приведение типа.
 */
function topic(m: SupportMeasure, key: string): boolean {
  return (m.segments as unknown as string[]).includes(`topic-${key}`);
}

const TOPICS: Record<string, { title: string; short: string }> = {
  money: {
    title: "Деньги",
    short: "Выплаты, пособия, капиталы, компенсации и субсидии.",
  },
  health: {
    title: "Здоровье",
    short: "Лекарства, лечение, санатории, реабилитация, медицинская помощь.",
  },
  housing: {
    title: "Жильё",
    short: "Ипотека, покупка и строительство жилья, земельный участок, аренда.",
  },
  utilities: {
    title: "ЖКХ",
    short: "Компенсации за коммунальные услуги, газификация, капремонт, топливо.",
  },
  transport: {
    title: "Проезд",
    short: "Льготный и бесплатный проезд, транспорт для семьи.",
  },
  education: {
    title: "Образование",
    short: "Детский сад, школа, колледж, вуз, кружки и обучение.",
  },
  employers: {
    title: "Работодатели",
    short: "Трудовые гарантии, обучение, занятость, своё дело.",
  },
  vuz: {
    title: "ВУЗы",
    short: "Меры для студентов вузов: обучение, стипендии, гарантии.",
  },
  leisure: {
    title: "Отдых",
    short: "Путёвки в лагеря и санатории, оздоровление, каникулы.",
  },
  culture: {
    title: "Культура",
    short: "Музеи, театры, выставки, Пушкинская карта.",
  },
  sport: {
    title: "Спорт",
    short: "Бассейны, катки, спортивные секции и занятия спортом.",
  },
  taxes: {
    title: "Налоги",
    short: "Налоговые вычеты и льготы для семей с детьми.",
  },
  social: {
    title: "Соцподдержка",
    short: "Социальный контракт, соцуслуги, сопровождение, юрпомощь.",
  },
  shops: {
    title: "Магазины",
    short: "Скидки, сертификаты и льготы на покупки.",
  },
  "kids-goods": {
    title: "Товары для детей",
    short: "Коляски, кроватки, детское питание, школьная форма, прокат вещей.",
  },
};

export function generateStaticParams() {
  return Object.keys(TOPICS).map((key) => ({ key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const cfg = TOPICS[key];
  return { title: cfg ? cfg.title : "Меры поддержки" };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const cfg = TOPICS[key];
  if (!cfg) notFound();

  const all = await getAllMeasures();
  const list = all.filter((m) => topic(m, key));

  // Регион: cookie (явный выбор) → анкета подбора. См. segment/[id].
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
          <LayoutGrid className="size-6" />
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
