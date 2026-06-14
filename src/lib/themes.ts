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
];

export const DEFAULT_THEME = "classic";
