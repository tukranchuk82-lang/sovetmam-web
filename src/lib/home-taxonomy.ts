// Разрезы каталога мер для главной страницы (структура по брифу клиента).
//
// Это НАВИГАЦИОННЫЕ константы: пирамида (уровень), типы мер, тематические
// категории («лепестки») и каталог жизненных ситуаций. Реальная фильтрация по
// уровню работает только для federal/regional (поле measures.level). Остальные
// разрезы (муниципальные/работодатель/вуз/нко, типы, тематики) пока ведут в
// общий каталог — их фильтры подключим после доразметки мер в базе.

export interface PyramidLevel {
  id: string;
  title: string;
  /** Где искать такие меры (подпись-источник, как на схеме клиента). */
  source: string;
  /** Цвет уровня на схеме (HEX) — диаграмма остаётся многоцветной. */
  color: string;
  href: string;
}

/** Снизу вверх: фундамент — федеральные, вершина — НКО. */
export const PYRAMID_LEVELS: PyramidLevel[] = [
  {
    id: "federal",
    title: "Федеральные",
    source: "Госуслуги · МФЦ · Социальный фонд РФ",
    color: "#1e3a8a",
    href: "/catalog?level=federal",
  },
  {
    id: "regional",
    title: "Региональные",
    source: "МФЦ · Семейный МФЦ · Фонд «Защитники Отечества»",
    color: "#2563eb",
    href: "/catalog?level=regional",
  },
  {
    id: "municipal",
    title: "Муниципальные",
    source: "Администрация (управа) района",
    color: "#15803d",
    href: "/catalog?level=municipal",
  },
  {
    id: "employer",
    title: "От работодателя",
    source: "HR-служба · Профсоюз",
    color: "#ea580c",
    href: "/catalog?level=employer",
  },
  {
    id: "vuz",
    title: "ВУЗ",
    source: "Госуслуги · Единое окно вуза",
    color: "#7c3aed",
    href: "/catalog?level=vuz",
  },
  {
    id: "nko",
    title: "НКО",
    source: "Интернет (сайты и порталы НКО)",
    color: "#d97706",
    href: "/catalog?level=nko",
  },
];

/** Особый «венец» пирамиды — неформальная семейная поддержка. */
export const PYRAMID_CROWN = {
  id: "grandparents",
  title: "Бабушки и дедушки",
  source: "Неформальная семейная поддержка",
  href: "/catalog",
};

export interface MeasureType {
  id: string;
  title: string;
  desc: string;
  /** «type» — по типу помощи, «frequency» — по частоте получения. */
  group: "type" | "frequency";
  href: string;
}

/** «Классификация поддержки» — по типу помощи и по частоте получения. */
export const MEASURE_TYPES: MeasureType[] = [
  {
    id: "free",
    title: "Положено бесплатно",
    desc: "Услуги и вещи, предоставляемые безвозмездно",
    group: "type",
    href: "/catalog?type=free",
  },
  {
    id: "discount",
    title: "Положено со скидкой",
    desc: "Льготы на оплату услуг, проезда, ЖКУ",
    group: "type",
    href: "/catalog?type=discount",
  },
  {
    id: "money",
    title: "Вам платят деньги",
    desc: "Пособия, выплаты, материнский капитал",
    group: "type",
    href: "/catalog?type=money",
  },
  {
    id: "once-life",
    title: "1 раз в жизни",
    desc: "Крупные целевые выплаты (например, маткапитал)",
    group: "frequency",
    href: "/catalog?type=once-life",
  },
  {
    id: "once-year",
    title: "1 раз в год",
    desc: "Ежегодные компенсации к школе, путёвки",
    group: "frequency",
    href: "/catalog?type=once-year",
  },
  {
    id: "once-month",
    title: "1 раз в месяц",
    desc: "Ежемесячные пособия на детей",
    group: "frequency",
    href: "/catalog?type=once-month",
  },
  {
    id: "situational",
    title: "По ситуации",
    desc: "Помощь в трудной жизненной ситуации",
    group: "frequency",
    href: "/catalog?type=situational",
  },
];

export interface LifeCategory {
  id: string;
  title: string;
  href: string;
}

/** «Жизненные ситуации» — тематические категории (по картинке с цветком). */
export const LIFE_CATEGORIES: LifeCategory[] = [
  { id: "money", title: "Деньги", href: "/catalog?topic=money" },
  { id: "health", title: "Здоровье", href: "/catalog?topic=health" },
  { id: "housing", title: "Жильё", href: "/catalog?topic=housing" },
  { id: "utilities", title: "ЖКХ", href: "/catalog?topic=utilities" },
  { id: "transport", title: "Проезд", href: "/catalog?topic=transport" },
  { id: "education", title: "Образование", href: "/catalog?topic=education" },
  { id: "employers", title: "Работодатели", href: "/catalog?topic=employers" },
  { id: "vuz", title: "ВУЗы", href: "/catalog?topic=vuz" },
  { id: "leisure", title: "Отдых", href: "/catalog?topic=leisure" },
  { id: "culture", title: "Культура", href: "/catalog?topic=culture" },
  { id: "sport", title: "Спорт", href: "/catalog?topic=sport" },
  { id: "taxes", title: "Налоги", href: "/catalog?topic=taxes" },
  { id: "social", title: "Соцподдержка", href: "/catalog?topic=social" },
  { id: "shops", title: "Магазины", href: "/catalog?topic=shops" },
  { id: "kids-goods", title: "Товары для детей", href: "/catalog?topic=kids-goods" },
];

export interface CatalogSituation {
  id: string;
  title: string;
  /** Особая карточка-развилка (анкета / обращение). */
  special?: boolean;
  href: string;
}

/** «Каталог мер поддержки» — жизненные ситуации семьи (карточки). */
export const CATALOG_SITUATIONS: CatalogSituation[] = [
  { id: "expecting-1", title: "Ждём 1-го ребёнка", href: "/catalog?situation=expecting-1" },
  { id: "expecting-2", title: "Ждём 2-го ребёнка", href: "/catalog?situation=expecting-2" },
  { id: "expecting-3", title: "Ждём 3-го ребёнка", href: "/catalog?situation=expecting-3" },
  { id: "expecting-4", title: "Ждём 4-го ребёнка", href: "/catalog?situation=expecting-4" },
  { id: "expecting-5plus", title: "Ждём 5-го и более ребёнка", href: "/catalog?situation=expecting-5plus" },
  { id: "family-1", title: "Семья с 1 ребёнком", href: "/catalog?situation=family-1" },
  { id: "family-2", title: "Семья с 2 детьми", href: "/catalog?situation=family-2" },
  { id: "family-3", title: "Семья с 3 детьми", href: "/catalog?situation=family-3" },
  { id: "family-4", title: "Семья с 4 детьми", href: "/catalog?situation=family-4" },
  { id: "family-5", title: "Семья с 5 детьми", href: "/catalog?situation=family-5" },
  { id: "many-children", title: "Многодетная семья", href: "/catalog?situation=many-children" },
  { id: "young-family", title: "Молодая семья", href: "/catalog?situation=young-family" },
  { id: "student-family", title: "Студенческая семья", href: "/catalog?situation=student-family" },
  { id: "low-income", title: "Семья с низким доходом", href: "/catalog?situation=low-income" },
  { id: "single-parent", title: "Одинокий родитель", href: "/catalog?situation=single-parent" },
  { id: "foster", title: "Приёмные родители", href: "/catalog?situation=foster" },
  { id: "svo-family", title: "Семья участника СВО", href: "/catalog?situation=svo-family" },
  { id: "loss", title: "Потеря в семье", href: "/catalog?situation=loss" },
  { id: "parent-disability", title: "Родитель-инвалид", href: "/catalog?situation=parent-disability" },
  { id: "child-disability", title: "Ребёнок-инвалид", href: "/catalog?situation=child-disability" },
  { id: "nursery", title: "Ясли", href: "/catalog?situation=nursery" },
  { id: "kindergarten", title: "Детсад", href: "/catalog?situation=kindergarten" },
  { id: "school", title: "Школа", href: "/catalog?situation=school" },
  { id: "college", title: "Колледж", href: "/catalog?situation=college" },
  { id: "university", title: "ВУЗ", href: "/catalog?situation=university" },
  { id: "vacation", title: "Семья и отпуск", href: "/catalog?situation=vacation" },
  { id: "second-family", title: "Вторая семья", href: "/catalog?situation=second-family" },
  { id: "grandparents", title: "Бабушки и дедушки", href: "/catalog?situation=grandparents" },
  { id: "family-business", title: "Семейный бизнес", href: "/catalog?situation=family-business" },
  { id: "own", title: "Своя жизненная ситуация", special: true, href: "/situation/own" },
];
