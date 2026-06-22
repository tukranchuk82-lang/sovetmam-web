import Link from "next/link";
import {
  Baby,
  Users,
  UsersRound,
  Heart,
  GraduationCap,
  Wallet,
  User,
  HandHeart,
  Star,
  Flame,
  Accessibility,
  Blocks,
  BookOpen,
  Backpack,
  Luggage,
  HousePlus,
  Briefcase,
  ClipboardList,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { CATALOG_SITUATIONS, type CatalogSituation } from "@/lib/home-taxonomy";

// «Каталог мер поддержки» на главной — реализация по утверждённому макету
// (referense): 2 колонки белых карточек с тонкой бордовой иконкой слева,
// названием по центру и шевроном справа. Последняя карточка — «Своя жизненная
// ситуация» — выделена пунктирной рамкой и светлым бордовым фоном.
//
// Данные берём из общей таксономии (id/title/href), порядок элементов совпадает
// с макетом, поэтому «Семейный бизнес» оказывается в левой ячейке последнего
// ряда, а спец-карточка — в правой.

const ACCENT = "#B51234";
// Иконки каталога — основной красный.
const ICON_COLOR = ACCENT;
// Бренд-синий (бархатный) — для спец-карточки «Своя жизненная ситуация».
const BLUE = "#3A4D63";

// Тематические иконки по id ситуации. lucide не содержит точных пиктограмм
// макета (беременность, коляска), поэтому подобраны ближайшие линейные иконки.
const ICONS: Record<string, LucideIcon> = {
  "expecting-1": Baby,
  "expecting-2": Baby,
  "expecting-3": Baby,
  "expecting-4": Baby,
  "expecting-5plus": Baby,
  "family-1": Users,
  "family-2": Users,
  "family-3": Users,
  "family-4": Users,
  "family-5": Users,
  "many-children": UsersRound,
  "young-family": Heart,
  "student-family": GraduationCap,
  "low-income": Wallet,
  "single-parent": User,
  foster: HandHeart,
  "svo-family": Star,
  loss: Flame,
  "parent-disability": Accessibility,
  "child-disability": Accessibility,
  nursery: Baby,
  kindergarten: Blocks,
  school: BookOpen,
  college: Backpack,
  university: GraduationCap,
  vacation: Luggage,
  "second-family": HousePlus,
  grandparents: UsersRound,
  "family-business": Briefcase,
  own: ClipboardList,
};

function CatalogCard({ s }: { s: CatalogSituation }) {
  const Icon = ICONS[s.id] ?? Users;
  return (
    <Link
      href={s.href}
      className="relative z-10 flex h-[64px] items-center gap-2.5 rounded-[18px] border border-[#3A4D63]/30 bg-white px-3 py-3 shadow-[0_8px_20px_-8px_rgba(58,77,99,0.30)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3A4D63]/60 hover:shadow-[0_14px_28px_-10px_rgba(58,77,99,0.38)] active:scale-[0.98]"
    >
      <Icon
        aria-hidden
        className="size-6 shrink-0"
        strokeWidth={1.4}
        style={{ color: ICON_COLOR }}
      />
      <span className="min-w-0 flex-1 text-[13px] font-medium leading-tight text-[#1A1A1A]">
        {s.title}
      </span>
      <ChevronRight aria-hidden className="size-4 shrink-0 text-[#C9C4C4]" />
    </Link>
  );
}

export function CatalogMeasures() {
  const regular = CATALOG_SITUATIONS.filter((s) => !s.special);
  const special = CATALOG_SITUATIONS.find((s) => s.special);

  return (
    <section
      className="px-5 pb-8 pt-4"
      style={{ fontFamily: "var(--font-inter), sans-serif" }}
    >
      <h2
        className="text-[30px] font-normal leading-[1.1] text-[#1A1A1A]"
        style={{ fontFamily: "var(--font-playfair), serif" }}
      >
        Каталог мер поддержки
      </h2>
      <p className="mt-2 text-[15px] leading-snug text-[#666666]">
        Выберите вашу жизненную ситуацию,
        <br />
        чтобы узнать доступные меры поддержки.
      </p>

      {/* Единая сетка: все карточки по две в ряд с одинаковым отступом. */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {regular.map((s) => (
          <CatalogCard key={s.id} s={s} />
        ))}
      </div>

      {special && (
        <Link
          href={special.href}
          className="mt-4 flex w-full items-center gap-4 rounded-[22px] border border-dashed px-5 py-[18px] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
          style={{
            borderColor: "rgba(58,77,99,0.5)",
            background: "rgba(58,77,99,0.06)",
          }}
        >
          <ClipboardList
            aria-hidden
            className="size-9 shrink-0"
            strokeWidth={1.4}
            style={{ color: BLUE }}
          />
          <span className="min-w-0 flex-1">
            {/* Надпись «Своя жизненная ситуация» оставляем красной. */}
            <span
              className="block text-[18px] font-semibold leading-tight"
              style={{ color: ACCENT }}
            >
              {special.title}
            </span>
            <span
              className="mt-1 block text-[15px] leading-snug"
              style={{ color: "rgba(58,77,99,0.7)" }}
            >
              Пройти анкету и получить подбор мер поддержки
            </span>
          </span>
          <ChevronRight
            aria-hidden
            className="size-7 shrink-0"
            style={{ color: "rgba(58,77,99,0.6)" }}
          />
        </Link>
      )}
    </section>
  );
}
