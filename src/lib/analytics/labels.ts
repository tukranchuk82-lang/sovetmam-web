/** Понятное имя метки (utm_source) вместо служебного слова в ссылке. */
export const SOURCE_LABEL: Record<string, string> = {
  share: "Кнопка «Поделиться»",
  quiz: "Квиз «Сколько вам положено»",
  kurs: "Курс «Шпаргалка»",
  bot: "Чат-боты",
  baza: "База знаний",
  coordinator: "Приглашения координаторов",
  "без метки": "Без метки",
};

export function sourceLabel(raw: string | null | undefined): string {
  if (!raw) return "Без метки";
  return SOURCE_LABEL[raw] ?? raw;
}
