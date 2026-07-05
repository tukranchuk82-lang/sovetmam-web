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

// Фон карточек каталога. Сохранённые варианты (для быстрого отката —
// достаточно поменять, какой присвоен CARD_BG):
//  • «Жемчужный» (запасной): linear-gradient(160deg, #FBFBFC 0%, #EFF1F3 54%, #E4E7EB 100%)
//  • «Графит» (глубже, текущий): linear-gradient(160deg, #EDEFF2 0%, #D7DCE2 54%, #C3C9D1 100%)
const CARD_BG =
  "linear-gradient(160deg, #EDEFF2 0%, #D7DCE2 54%, #C3C9D1 100%)";

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
      className="relative z-10 flex h-[64px] items-center gap-2.5 rounded-[18px] border border-black/[0.06] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_24px_-12px_rgba(30,41,59,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-black/[0.10] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_30px_-12px_rgba(30,41,59,0.34)] active:scale-[0.98]"
      style={{ background: CARD_BG }}
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
          className="mt-[21px] flex w-full items-center gap-4 rounded-[22px] px-5 py-[18px] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
          style={{
            background:
              "linear-gradient(135deg, #5E6E99 0%, #52618A 55%, #45547B 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.18), 0 14px 28px -16px rgba(37,42,75,0.6)",
          }}
        >
          <ClipboardList
            aria-hidden
            className="size-9 shrink-0"
            strokeWidth={1.4}
            style={{ color: "#FFFFFF" }}
          />
          <span className="min-w-0 flex-1">
            {/* На тёмно-синем фоне заголовок и подпись — белые. */}
            <span
              className="block text-[18px] font-semibold leading-tight"
              style={{ color: "#FFFFFF" }}
            >
              {special.title}
            </span>
            <span
              className="mt-1 block text-[15px] leading-snug"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              Пройти анкету и получить подбор мер поддержки
            </span>
          </span>
          <ChevronRight
            aria-hidden
            className="size-7 shrink-0"
            style={{ color: "rgba(255,255,255,0.65)" }}
          />
        </Link>
      )}
    </section>
  );
}
