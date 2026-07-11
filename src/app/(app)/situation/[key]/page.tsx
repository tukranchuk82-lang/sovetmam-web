import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Sparkles, ChevronRight, Users } from "lucide-react";
import { BackLink } from "@/components/back-link";
import { SegmentMeasures } from "@/components/segment-measures";
import { getAllMeasures } from "@/lib/measures-db";
import { getCurrentAppUser } from "@/lib/user-session";
import { REGION_COOKIE } from "@/lib/region";
import type { SupportMeasure } from "@/lib/measures";

// Один роут на все ситуационные плитки с главной: ключ → {заголовок, фильтр}.
// Статический /situation/own (развилка «своя ситуация») живёт рядом и имеет
// приоритет над этим динамическим сегментом.
/**
 * Витринная категория меры. Категории живут в том же массиве `segments`, что и
 * segment-теги, но в SegmentId не входят (они не участвуют в анкете — движок
 * подбора смотрит только criteria). Отсюда приведение типа.
 *
 * Категория — это «в какой плитке мера ПОКАЗЫВАЕТСЯ», в отличие от criteria
 * («что от семьи ТРЕБУЕТСЯ»). Мера, положенная нескольким категориям
 * («многодетным ИЛИ малоимущим»), получает их все и видна в каждой плитке.
 */
function cat(m: SupportMeasure, category: string): boolean {
  return (m.segments as unknown as string[]).includes(category);
}

const SITUATIONS: Record<
  string,
  { title: string; short: string; filter: (m: SupportMeasure) => boolean }
> = {
  // ВИТРИНЫ фильтруются по КАТЕГОРИЯМ (segments), а не по criteria. Это важно:
  // criteria в движке подбора складываются по «И», поэтому мере «для многодетных
  // ИЛИ малоимущих» нельзя проставить оба флага (анкета зря потребовала бы оба
  // условия сразу) — и такие меры выпадали из плиток. Категория же — просто
  // список: «или»-мера получает ВСЕ свои категории и видна в каждой плитке.
  // criteria при этом остаются строгими и честными — они нужны анкете.
  "young-family": {
    title: "Молодая семья",
    short: "Меры поддержки для молодых семей — где родителям до 35 лет.",
    filter: (m) => cat(m, "young-family"),
  },
  "low-income": {
    title: "Семья с низким доходом",
    short: "Меры поддержки для семей с доходом ниже прожиточного минимума.",
    filter: (m) => cat(m, "low-income"),
  },
  "single-parent": {
    title: "Одинокий родитель",
    short: "Меры поддержки для неполных семей — одиноких матерей и отцов.",
    filter: (m) => cat(m, "single-parent"),
  },
  "parent-disability": {
    title: "Родитель-инвалид",
    short: "Меры поддержки для семей, где один или оба родителя — инвалиды.",
    filter: (m) => cat(m, "parent-disability"),
  },
  "child-disability": {
    title: "Ребёнок-инвалид",
    short: "Меры поддержки для семей, воспитывающих ребёнка-инвалида или с ОВЗ.",
    filter: (m) => cat(m, "child-disability"),
  },
  // «Потеря в семье» — узкая категория именно про потерю кормильца/родителя
  // (пенсия по потере кормильца и доплаты). Помечена сегментом "loss" — он не
  // входит в SegmentId (это витринная метка, не участвует в анкете), потому
  // фильтруем через приведение к string[]. Опека/сироты — в «Приёмные родители».
  loss: {
    title: "Потеря в семье",
    short: "Меры при потере кормильца — пенсия по случаю потери кормильца и доплаты.",
    filter: (m) => cat(m, "loss"),
  },
  // Плитки-стадии (возраст/этап ребёнка). Помечены витринными сегментами
  // nursery/kindergarten/college/university (не входят в SegmentId — фильтруем
  // приведением к string[]). «Школа» — на готовый тег schoolchild, роутится
  // напрямую через /segment/schoolchild, здесь её нет.
  nursery: {
    title: "Ясли",
    short: "Меры для семей с малышами до 3 лет: питание, уход, выплаты.",
    filter: (m) => cat(m, "nursery"),
  },
  kindergarten: {
    title: "Детский сад",
    short: "Меры, связанные с детским садом: плата, места, компенсации.",
    filter: (m) => cat(m, "kindergarten"),
  },
  college: {
    title: "Колледж",
    short: "Меры для студентов колледжей и техникумов (СПО) и их семей.",
    filter: (m) => cat(m, "college"),
  },
  university: {
    title: "ВУЗ",
    short: "Меры для студентов вузов и семей с детьми-студентами.",
    filter: (m) => cat(m, "university"),
  },
  vacation: {
    title: "Семья и отпуск",
    short: "Отдых и оздоровление: путёвки в лагеря и санатории, оплата проезда.",
    filter: (m) => cat(m, "vacation"),
  },
  "family-business": {
    title: "Семейный бизнес",
    short: "Поддержка своего дела: социальный контракт, помощь ИП и самозанятым.",
    filter: (m) => cat(m, "family-business"),
  },
  // Ситуации без отдельных мер в базе: показываем честный пустой экран —
  // заголовок ситуации + призыв к индивидуальному подбору (не тупик).
  grandparents: {
    title: "Бабушки и дедушки",
    short: "Отдельных мер для этой ситуации пока нет — попробуйте подбор или напишите обращение.",
    filter: () => false,
  },
  "second-family": {
    title: "Вторая семья",
    short: "Отдельных мер для этой ситуации пока нет — попробуйте подбор или напишите обращение.",
    filter: () => false,
  },
};

export function generateStaticParams() {
  return Object.keys(SITUATIONS).map((key) => ({ key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const cfg = SITUATIONS[key];
  return { title: cfg ? cfg.title : "Меры поддержки" };
}

export default async function SituationPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const cfg = SITUATIONS[key];
  if (!cfg) notFound();

  const all = await getAllMeasures();
  const list = all.filter(cfg.filter);

  // Регион: cookie (явный выбор на экране) → анкета подбора. См. segment/[id].
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
