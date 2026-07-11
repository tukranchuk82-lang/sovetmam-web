/**
 * Типы обращений — в отдельном модуле (без "server-only"), чтобы подписи можно
 * было использовать и в клиентских компонентах: сама inquiries-db ходит в базу
 * и на клиент не импортируется.
 *
 * question — вопрос про свою ситуацию;
 * proposal — предложение ввести новую меру;
 * clarification — уточнение по существующей мере (устарела сумма, изменились
 * условия). Для него обязательны мера и регион; если мера федеральная, в поле
 * региона пишется FEDERAL_REGION.
 */
export type InquiryType = "question" | "proposal" | "clarification";

export const INQUIRY_TYPE_LABEL: Record<InquiryType, string> = {
  question: "Вопрос",
  proposal: "Идея",
  clarification: "Уточнение",
};

/** Значение поля «регион» для федеральных мер: они действуют по всей стране. */
export const FEDERAL_REGION = "Федеральная мера";
