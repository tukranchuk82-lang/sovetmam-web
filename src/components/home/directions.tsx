import Link from "next/link";
import {
  RussianRuble,
  Heart,
  Home,
  Droplet,
  Bus,
  BookOpen,
  Users,
  GraduationCap,
  Sun,
  Drama,
  Dumbbell,
  Calculator,
  HandHeart,
  ShoppingBag,
  Baby,
  Sparkles,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

// Экран «Направления мер поддержки» — секция на главной (по референсу).
// Сетка 3×5 тематических плиток. Иллюстрации из public: domik-cut.png (у
// заголовка) и city2-cut.png (силуэт города снизу, перекрашен в цвет city).
// Плитки кликабельны → /catalog (с фильтром по категории, где есть соответствие).

const BLUE = "#B51234"; // символы иконок — основной красный
const CIRCLE = "#bbc1cc"; // фоновый круг
const T1 = "#15234A";
const T2 = "#5E6785";

// Направления — это те же 15 тем, что и плитки-«лепестки» (LIFE_CATEGORIES),
// поэтому ведут на тот же роут /topic/[key]. Раньше вели на
// /catalog?category=…, но каталог параметр не читал (открывался полный список),
// а маппинг на 9 значений `category` был лоссовым: ЖКХ и Жильё давали
// одинаковую выдачу, Вузы = Образование, а Спорт/Магазины/Товары пары не имели
// вовсе. У /topic/[key] разметка мульти-категорийная и точная.
interface Direction {
  icon: LucideIcon;
  label: string;
  topic: string; // ключ темы, см. src/app/(app)/topic/[key]/page.tsx
}

const DIRECTIONS: Direction[] = [
  { icon: RussianRuble, label: "Деньги", topic: "money" },
  { icon: Heart, label: "Здоровье", topic: "health" },
  { icon: Home, label: "Жильё", topic: "housing" },
  { icon: Droplet, label: "ЖКХ", topic: "utilities" },
  { icon: Bus, label: "Проезд", topic: "transport" },
  { icon: BookOpen, label: "Образование", topic: "education" },
  { icon: Users, label: "Работодатели", topic: "employers" },
  { icon: GraduationCap, label: "Вузы", topic: "vuz" },
  { icon: Sun, label: "Отдых", topic: "leisure" },
  { icon: Drama, label: "Культура", topic: "culture" },
  { icon: Dumbbell, label: "Спорт", topic: "sport" },
  { icon: Calculator, label: "Налоги", topic: "taxes" },
  { icon: HandHeart, label: "Соцподдержка", topic: "social" },
  { icon: ShoppingBag, label: "Магазины", topic: "shops" },
  { icon: Baby, label: "Товары для детей", topic: "kids-goods" },
];

function hrefFor(d: Direction) {
  return `/topic/${d.topic}`;
}

export function Directions() {
  return (
    <section
      className="px-5 pb-10 pt-2"
      style={{ fontFamily: "var(--font-inter), sans-serif", color: T1 }}
    >
      {/* Заголовок + домик справа */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2
            className="text-[26px] font-normal leading-[1.12]"
            style={{ fontFamily: "var(--font-playfair), serif", color: T1 }}
          >
            Направления мер поддержки
          </h2>
          <p className="mt-2 text-[14px] leading-snug" style={{ color: T2 }}>
            Меры поддержки на все случаи жизни для вас и вашей семьи
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/domik2-cut.png"
          alt=""
          aria-hidden
          className="mt-1 w-[140px] shrink-0 object-contain"
        />
      </div>

      {/* Сетка направлений */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {DIRECTIONS.map((d) => {
          const Icon = d.icon;
          return (
            <Link
              key={d.label}
              href={hrefFor(d)}
              className="flex flex-col items-center rounded-[20px] border border-[#3A4D63]/30 bg-white px-2 py-4 shadow-[0_10px_24px_-8px_rgba(21,35,74,0.34)] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#3A4D63]/55 hover:shadow-[0_16px_32px_-10px_rgba(21,35,74,0.42)] active:scale-95"
            >
              <span
                className="flex size-14 items-center justify-center rounded-full"
                style={{ background: CIRCLE }}
              >
                <Icon size={26} strokeWidth={1.6} color={BLUE} aria-hidden />
              </span>
              <span
                className="mt-2.5 text-center text-[13px] font-medium leading-tight"
                style={{ color: T1 }}
              >
                {d.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Баннер «Подобрать меры поддержки» → анкета */}
      <Link
        href="/podbor"
        className="mt-6 flex items-center gap-3 rounded-2xl px-5 py-4 text-white"
        style={{
          background:
            "linear-gradient(135deg, #274A7E 0%, #172A4B 58%, #101D38 100%)",
          boxShadow: "0 18px 34px -12px rgba(23,42,75,0.55)",
        }}
      >
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Sparkles size={22} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold leading-tight">
            Подобрать меры поддержки
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-snug text-white/85">
            Пройдите анкету — подберём меры под вашу семью
          </span>
        </span>
        <ChevronRight size={20} className="shrink-0" aria-hidden />
      </Link>
    </section>
  );
}
