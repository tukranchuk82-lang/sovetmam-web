import type { LucideIcon } from "lucide-react";
import {
  Landmark,
  Building2,
  Users,
  Briefcase,
  GraduationCap,
  Heart,
  Gift,
  Tag,
  Banknote,
  Infinity as InfinityIcon,
  CalendarDays,
  Clock,
  LifeBuoy,
  Wallet,
  HeartPulse,
  Home,
  Lightbulb,
  Bus,
  TreePalm,
  Drama,
  Dumbbell,
  ReceiptText,
  HandHeart,
  ShoppingCart,
  Baby,
} from "lucide-react";

/** Иконки уровней пирамиды (по id из PYRAMID_LEVELS). */
export const PYRAMID_ICONS: Record<string, LucideIcon> = {
  federal: Landmark,
  regional: Building2,
  municipal: Users,
  employer: Briefcase,
  vuz: GraduationCap,
  nko: Heart,
};

/** Иконки типов мер (по id из MEASURE_TYPES). */
export const MEASURE_TYPE_ICONS: Record<string, LucideIcon> = {
  free: Gift,
  discount: Tag,
  money: Banknote,
  "once-life": InfinityIcon,
  "once-year": CalendarDays,
  "once-month": Clock,
  situational: LifeBuoy,
};

/** Иконки жизненных категорий (по id из LIFE_CATEGORIES). */
export const LIFE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  money: Wallet,
  health: HeartPulse,
  housing: Home,
  utilities: Lightbulb,
  transport: Bus,
  education: GraduationCap,
  employers: Briefcase,
  vuz: Building2,
  leisure: TreePalm,
  culture: Drama,
  sport: Dumbbell,
  taxes: ReceiptText,
  social: HandHeart,
  shops: ShoppingCart,
  "kids-goods": Baby,
};
