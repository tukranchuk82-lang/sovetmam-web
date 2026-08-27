/**
 * Приложение курса — отдельный сайт на своём домене.
 *
 * Метка utm_source нужна курсу: по ней там видно, что человек пришёл из
 * «Шпаргалки», а не из рассылки или бота. Свой счёт переходов мы ведём
 * отдельно — в /go/kurs, чтобы не зависеть от чужой аналитики.
 */
export const COURSE_URL =
  "https://kurs.sovetmam.ru/?utm_source=shpargalka&utm_medium=banner";

/** Наш адрес-счётчик: ведёт в курс и попутно отмечает переход. */
export function courseLink(fromPath = "/"): string {
  return `/go/kurs?from=${encodeURIComponent(fromPath)}`;
}
