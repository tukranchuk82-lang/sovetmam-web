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

/**
 * Мультяшные эмодзи-иконки типов мер — дружелюбная альтернатива строгим
 * line-иконкам. Используются в блоке «Какая бывает помощь?» (measure-types).
 */
export const MEASURE_TYPE_EMOJI: Record<string, string> = {
  free: "🎁",
  discount: "🏷️",
  money: "💰",
  "once-life": "🌟",
  "once-year": "📅",
  "once-month": "🗓️",
  situational: "🎯",
};

/** Мультяшные эмодзи жизненных категорий (по id из LIFE_CATEGORIES). */
export const LIFE_CATEGORY_EMOJI: Record<string, string> = {
  money: "💰",
  health: "🏥",
  housing: "🏠",
  utilities: "💡",
  transport: "🚌",
  education: "📚",
  employers: "💼",
  vuz: "🎓",
  leisure: "🏖️",
  culture: "🎭",
  sport: "⚽",
  taxes: "🧾",
  social: "🤝",
  shops: "🛒",
  "kids-goods": "🧸",
};

/** Мультяшные эмодзи жизненных ситуаций (по id из CATALOG_SITUATIONS). */
export const CATALOG_SITUATION_EMOJI: Record<string, string> = {
  "expecting-1": "🍼",
  "expecting-2": "🧸",
  "expecting-3": "🎈",
  "expecting-4": "🌟",
  "expecting-5plus": "🚂",
  "family-1": "👶",
  "family-2": "👧",
  "family-3": "👨‍👩‍👧",
  "family-4": "👨‍👩‍👧‍👦",
  "family-5": "👪",
  "many-children": "🏡",
  "young-family": "💑",
  "student-family": "🎓",
  "low-income": "🪙",
  "single-parent": "🤱",
  foster: "🤗",
  "svo-family": "🎖️",
  loss: "🕊️",
  "parent-disability": "♿",
  "child-disability": "🦽",
  nursery: "🍼",
  kindergarten: "🧩",
  school: "🎒",
  college: "📐",
  university: "🎓",
  vacation: "🏖️",
  "second-family": "👨‍👩‍👧",
  grandparents: "👵",
  "family-business": "🏪",
  own: "✏️",
};

/** Карандашные дудлы для темы «Карандаш» — типы мер (id из MEASURE_TYPES). */
export const MEASURE_TYPE_DOODLE: Record<string, string> = {
  free: "gift",
  discount: "tag",
  money: "coin",
  "once-life": "star",
  "once-year": "sun",
  "once-month": "cloud",
  situational: "flower",
};

/** Карандашные дудлы — жизненные категории (id из LIFE_CATEGORIES). */
export const LIFE_CATEGORY_DOODLE: Record<string, string> = {
  money: "coin",
  health: "heart",
  housing: "house",
  utilities: "bulb",
  transport: "bus",
  education: "book",
  employers: "star",
  vuz: "cap",
  leisure: "balloon",
  culture: "flower",
  sport: "ball",
  taxes: "doc",
  social: "bear",
  shops: "bag",
  "kids-goods": "bunny",
};

/** Карандашные дудлы — жизненные ситуации (id из CATALOG_SITUATIONS). */
export const CATALOG_SITUATION_DOODLE: Record<string, string> = {
  "expecting-1": "balloon",
  "expecting-2": "bear",
  "expecting-3": "ball",
  "expecting-4": "star",
  "expecting-5plus": "bus",
  "family-1": "family1",
  "family-2": "family2",
  "family-3": "family3",
  "family-4": "family4",
  "family-5": "family5",
  "many-children": "familyMany",
  "young-family": "heart",
  "student-family": "cap",
  "low-income": "coin",
  "single-parent": "adultchild",
  foster: "dog",
  "svo-family": "star",
  loss: "cloud",
  "parent-disability": "wheelchair",
  "child-disability": "bunny",
  nursery: "rattle",
  kindergarten: "sun",
  school: "satchel",
  college: "bookstack",
  university: "cap",
  vacation: "sun",
  "second-family": "house",
  grandparents: "grandparents",
  "family-business": "officechair",
  own: "flower",
};

/** Карандашные дудлы — нижнее меню (по href вкладки). */
export const NAV_DOODLE: Record<string, string> = {
  "/": "house",
  "/catalog": "book",
  "/podbor": "star",
  "/profile/inquiries/new": "heart",
  "/profile": "bear",
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
