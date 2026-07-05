import {
  Wallet,
  Home,
  BadgePercent,
  HeartPulse,
  GraduationCap,
  Bus,
  Ticket,
  Briefcase,
  HandHeart,
  type LucideIcon,
} from "lucide-react";

// Иконка и цвет для каждой категории мер — для цветных бейджей на карточках.
// Палитра без бордового/красного/розового — чтобы в карточке не было «красноты».
export const CATEGORY_META: Record<string, { icon: LucideIcon; color: string }> = {
  "Выплаты и пособия": { icon: Wallet, color: "#B58A24" },
  "Жильё и ипотека": { icon: Home, color: "#1B3A6B" },
  "Налоги и льготы": { icon: BadgePercent, color: "#4E6A8F" },
  Здоровье: { icon: HeartPulse, color: "#2E7D5B" },
  Образование: { icon: GraduationCap, color: "#5B4B8A" },
  Транспорт: { icon: Bus, color: "#2F6DB3" },
  "Культура и отдых": { icon: Ticket, color: "#6E4FA3" },
  "Работа и занятость": { icon: Briefcase, color: "#7A6A2F" },
  "Помощь и сопровождение": { icon: HandHeart, color: "#4a9590" },
};

export const DEFAULT_CATEGORY_META = { icon: HandHeart, color: "#6b7078" };

export function categoryMeta(category: string) {
  return CATEGORY_META[category] ?? DEFAULT_CATEGORY_META;
}
