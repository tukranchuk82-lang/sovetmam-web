// Реестр визуальных тем (одна структура — разные «скины»).
// key → значение атрибута data-theme на <html>; стили в globals.css.
export interface ThemeOption {
  key: string;
  name: string;
  /** Краткое описание для переключателя. */
  hint: string;
}

export const THEMES: ThemeOption[] = [
  { key: "classic", name: "Классический", hint: "Официальный navy" },
  { key: "berry", name: "Ягодный", hint: "Клюква + кремово-розовый (рекоменд.)" },
  { key: "berry-warm", name: "Ягодный · тёплый", hint: "Коралл-малина, персиковый фон" },
  { key: "berry-cream", name: "Ягодный · кремовый", hint: "Глубокая клюква, нейтральный крем" },
  { key: "base", name: "База", hint: "Классический каркас в ягодной гамме" },
  { key: "city", name: "Город", hint: "Бордовый бренд-кит, городской силуэт" },
  { key: "kids", name: "Яркий", hint: "Цветные карточки, лаванда" },
  { key: "crayon", name: "Карандаш", hint: "Детские рисунки, цветные мелки" },
  { key: "notebook", name: "Тетрадка", hint: "Шпаргалка на листе в клетку" },
  { key: "minimal", name: "Минимализм", hint: "Чистый, индиго" },
];

export const DEFAULT_THEME = "city";
