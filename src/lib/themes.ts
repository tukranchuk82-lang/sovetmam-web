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
  { key: "neon", name: "Неон", hint: "Яркий брутализм" },
  { key: "warm", name: "Тёплый", hint: "Пастель, коралл и шалфей" },
  { key: "kids", name: "Яркий", hint: "Цветные карточки, лаванда" },
  { key: "crayon", name: "Карандаш", hint: "Детские рисунки, цветные мелки" },
  { key: "notebook", name: "Тетрадка", hint: "Шпаргалка на листе в клетку" },
  { key: "minimal", name: "Минимализм", hint: "Чистый, индиго" },
];

export const DEFAULT_THEME = "classic";
