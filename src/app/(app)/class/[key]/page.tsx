import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  Sparkles,
  ChevronRight,
  Gift,
  Percent,
  Wallet,
  Baby,
  CalendarDays,
  CalendarClock,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import { BackLink } from "@/components/back-link";
import { SegmentMeasures } from "@/components/segment-measures";
import { getAllMeasures } from "@/lib/measures-db";
import { getCurrentAppUser } from "@/lib/user-session";
import { REGION_COOKIE } from "@/lib/region";
import type { SupportMeasure } from "@/lib/measures";

/**
 * Блок «Классификация» на главной: по типу помощи (Бесплатно / Со скидкой /
 * Выплаты) и по частоте получения (1 раз в жизни / в год / в месяц / По
 * ситуации).
 *
 * Фильтруется по витринным меткам `class-*` в `segments` — по той же схеме, что
 * темы (topic-*) и жизненные ситуации. Метки ВКЛЮЧАЮЩИЕ: одна мера может быть и
 * «бесплатно», и «со скидкой» (путёвка бесплатно либо компенсация), и
 * «единовременно», и «ежемесячно» (капитал + пособие в одной мере).
 *
 * Обе шкалы покрывают все меры целиком:
 *  · «Бесплатно» — замыкающий тип: не даёт денег и не снижает расходы, значит
 *    даёт услугу или вещь безвозмездно;
 *  · «По ситуации» — замыкающая частота: сюда, по решению заказчика, попадают и
 *    ситуативные меры, и все постоянные льготы, которые действуют, пока есть
 *    право (бесплатный проезд, питание в школе, налоговый вычет). У них нет
 *    «частоты получения» в принципе.
 *
 * Метки class-* в SegmentId не входят и в анкете не участвуют — отсюда
 * приведение типа.
 */
function hasClass(m: SupportMeasure, key: string): boolean {
  return (m.segments as unknown as string[]).includes(`class-${key}`);
}

interface ClassCfg {
  title: string;
  short: string;
  icon: LucideIcon;
  backHref: string;
}

// Якоря на главной: TYPE — начало блока «Классификация» (там карточки типа),
// FREQ — заголовок «По частоте получения» (там дорога с пинами).
const TYPE = "/#classification";
const FREQ = "/#frequency";

const CLASSES: Record<string, ClassCfg> = {
  free: {
    title: "Бесплатно",
    short:
      "Услуги и вещи, которые семья получает безвозмездно: питание и проезд, путёвки и лекарства, кружки и секции, жильё и участки.",
    icon: Gift,
    backHref: TYPE,
  },
  discount: {
    title: "Со скидкой",
    short:
      "Льготы, компенсации, субсидии и вычеты — всё, что снижает ваши расходы на услуги, проезд, ЖКУ, обучение и ипотеку.",
    icon: Percent,
    backHref: TYPE,
  },
  money: {
    title: "Выплаты",
    short:
      "Деньги, которые приходят вам: пособия, единовременные и ежемесячные выплаты, материнский и региональные капиталы, стипендии.",
    icon: Wallet,
    backHref: TYPE,
  },
  "once-life": {
    title: "1 раз в жизни",
    short:
      "Однократные меры при важном событии: рождение или усыновление ребёнка, материнский и региональный капитал, земельный участок, погашение ипотеки.",
    icon: Baby,
    backHref: FREQ,
  },
  "once-year": {
    title: "1 раз в год",
    short:
      "Меры, которые оформляют ежегодно: выплата к учебному году, путёвка в лагерь, ежегодные компенсации.",
    icon: CalendarDays,
    backHref: FREQ,
  },
  "once-month": {
    title: "1 раз в месяц",
    short:
      "Ежемесячные пособия, выплаты и доплаты — деньги, которые приходят каждый месяц.",
    icon: CalendarClock,
    backHref: FREQ,
  },
  situational: {
    title: "По ситуации",
    short:
      "Меры, которые действуют, пока у семьи есть право: бесплатный проезд и питание, налоговый вычет, льготы и первоочередное зачисление. И помощь в трудной жизненной ситуации.",
    icon: LifeBuoy,
    backHref: FREQ,
  },
};

export function generateStaticParams() {
  return Object.keys(CLASSES).map((key) => ({ key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const cfg = CLASSES[key];
  return { title: cfg ? cfg.title : "Меры поддержки" };
}

export default async function ClassPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  const cfg = CLASSES[key];
  if (!cfg) notFound();

  const all = await getAllMeasures();
  const list = all.filter((m) => hasClass(m, key));

  // Регион: cookie (явный выбор) → анкета подбора. См. segment/[id].
  const cookieStore = await cookies();
  const user = await getCurrentAppUser();
  const surveyRegion =
    typeof user?.survey?.region === "string" ? user.survey.region : null;
  const initialRegion =
    cookieStore.get(REGION_COOKIE)?.value || surveyRegion || null;

  const Icon = cfg.icon;

  return (
    <div className="px-4 py-5">
      {/* Возвращаем ровно туда, откуда пришли: с карточек типа — к началу
          «Классификации», с пинов — к дороге «По частоте получения». На верх
          главной не отправляем: прокручивать её заново обидно. */}
      <BackLink href={cfg.backHref} label="Назад" />

      <div className="mt-3 flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-[0_6px_16px_-6px_rgba(142,29,44,0.5)]">
          <Icon className="size-6" />
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
