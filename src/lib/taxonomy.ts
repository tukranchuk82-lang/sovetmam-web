/**
 * Ключи разделов приложения: темы, классификация, жизненные ситуации, размер
 * семьи.
 *
 * Сами страницы держат при себе то, что нужно только им — иконки, фильтры,
 * тексты. Здесь лежит один общий список ключей, и он решает две задачи:
 *
 * 1. Карта сайта (sitemap.ts) перечисляет ровно те же разделы, что открываются
 *    в приложении. Раньше такой список пришлось бы дублировать вручную, и он
 *    молча разъехался бы при первой же новой плитке.
 * 2. Страницы объявляют свои настройки как Record<ТипКлюча, …> — TypeScript
 *    ругается и на забытый раздел, и на лишний. Забыть описать новую тему уже
 *    не получится.
 */

export const TOPIC_KEYS = [
  "money",
  "health",
  "housing",
  "utilities",
  "transport",
  "education",
  "employers",
  "vuz",
  "leisure",
  "culture",
  "sport",
  "taxes",
  "social",
  "business",
  "nko",
  // Ниже — темы, снятые с главной, но живые по прямой ссылке.
  "shops",
  "kids-goods",
] as const;
export type TopicKey = (typeof TOPIC_KEYS)[number];

export const CLASS_KEYS = [
  "free",
  "discount",
  "money",
  "once-life",
  "once-year",
  "once-month",
  "situational",
] as const;
export type ClassKey = (typeof CLASS_KEYS)[number];

export const SITUATION_KEYS = [
  // Для тех, у кого детей ещё нет и беременности пока нет: лечение бесплодия,
  // ЭКО, жильё молодой семье. Раньше такие люди не видели в подборе почти
  // ничего — вся база адресована семьям с детьми.
  "planning",
  "young-family",
  "low-income",
  "single-parent",
  "parent-disability",
  "child-disability",
  "loss",
  "nursery",
  "kindergarten",
  "college",
  "university",
  "vacation",
  "family-business",
  "grandparents",
  "second-family",
] as const;
export type SituationKey = (typeof SITUATION_KEYS)[number];

export const FAMILY_KEYS = ["1", "2", "3", "4", "5", "many"] as const;
export type FamilyKey = (typeof FAMILY_KEYS)[number];

/**
 * Самая важная сейчас жизненная ситуация — вопрос перед анкетой подбора
 * (заказчик, 2026-09-09). Меры, которые ей соответствуют, подбор поднимает
 * отдельным блоком в начало выдачи, перед обычным федеральные/региональные.
 *
 * Сознательно не все 17 тем каталога, а шесть крупных, которые заказчик
 * выбрал сам — они ложатся на уже существующие метки `topic-*`, отдельно
 * размечать меры под это не нужно.
 */
export const PRIORITY_SITUATIONS = [
  {
    key: "money",
    title: "Деньги",
    short: "Выплаты и компенсации",
    topics: ["money"],
  },
  {
    key: "housing",
    title: "Жильё",
    short: "Получение жилья, компенсации за него",
    topics: ["housing"],
  },
  {
    key: "health",
    title: "Здоровье",
    short: "Лекарства, где и как лечиться, диспансеризация",
    topics: ["health"],
  },
  {
    key: "child-education",
    title: "Образование ребёнка",
    short: "Места в саду, школе, колледже, компенсации",
    topics: ["education", "vuz"],
  },
  {
    key: "leisure",
    title: "Отдых и путешествия",
    short: "Лагеря, путёвки, поездки",
    topics: ["leisure"],
  },
  {
    key: "self-realization",
    title: "Самореализация",
    short: "Обучение взрослых, новая профессия",
    topics: ["employers"],
  },
] as const satisfies readonly {
  key: string;
  title: string;
  short: string;
  topics: readonly TopicKey[];
}[];
export type PrioritySituationKey = (typeof PRIORITY_SITUATIONS)[number]["key"];
