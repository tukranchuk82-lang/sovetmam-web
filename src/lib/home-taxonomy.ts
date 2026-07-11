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
  { id: "money", title: "Деньги", href: "/topic/money" },
  { id: "health", title: "Здоровье", href: "/topic/health" },
  { id: "housing", title: "Жильё", href: "/topic/housing" },
  { id: "utilities", title: "ЖКХ", href: "/topic/utilities" },
  { id: "transport", title: "Проезд", href: "/topic/transport" },
  { id: "education", title: "Образование", href: "/topic/education" },
  { id: "employers", title: "Работодатели", href: "/topic/employers" },
  { id: "vuz", title: "ВУЗы", href: "/topic/vuz" },
  { id: "leisure", title: "Отдых", href: "/topic/leisure" },
  { id: "culture", title: "Культура", href: "/topic/culture" },
  { id: "sport", title: "Спорт", href: "/topic/sport" },
  { id: "taxes", title: "Налоги", href: "/topic/taxes" },
  { id: "social", title: "Соцподдержка", href: "/topic/social" },
  { id: "shops", title: "Магазины", href: "/topic/shops" },
  { id: "kids-goods", title: "Товары для детей", href: "/topic/kids-goods" },
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
  // Ведёт на уже рабочий /segment/[id] (фильтрует по measures.segments,
  // умеет федеральные-раньше-региональных и регион пользователя) — раньше
  // вело на /catalog?situation=..., а /catalog этот параметр не читает вовсе.
  { id: "expecting-1", title: "Ждём 1-го ребёнка", href: "/segment/expecting-first" },
  { id: "expecting-2", title: "Ждём 2-го ребёнка", href: "/segment/expecting-second" },
  { id: "expecting-3", title: "Ждём 3-го ребёнка", href: "/segment/expecting-third" },
  { id: "expecting-4", title: "Ждём 4-го ребёнка", href: "/segment/expecting-fourth" },
  { id: "expecting-5plus", title: "Ждём 5-го и более ребёнка", href: "/segment/expecting-fifth-plus" },
  // «Семья с N детьми» и «Многодетная» → /family/[count], фильтр по числу детей
  // (criteria.minChildren ≤ N), см. src/app/(app)/family/[count]/page.tsx.
  { id: "family-1", title: "Семья с 1 ребёнком", href: "/family/1" },
  { id: "family-2", title: "Семья с 2 детьми", href: "/family/2" },
  { id: "family-3", title: "Семья с 3 детьми", href: "/family/3" },
  { id: "family-4", title: "Семья с 4 детьми", href: "/family/4" },
  { id: "family-5", title: "Семья с 5 детьми", href: "/family/5" },
  { id: "many-children", title: "Многодетная семья", href: "/family/many" },
  { id: "young-family", title: "Молодая семья", href: "/situation/young-family" },
  // Ситуационные плитки на готовые segment-теги (тег выверен, шум приемлемый).
  { id: "student-family", title: "Студенческая семья", href: "/segment/student-family" },
  { id: "low-income", title: "Семья с низким доходом", href: "/situation/low-income" },
  { id: "single-parent", title: "Одинокий родитель", href: "/situation/single-parent" },
  { id: "foster", title: "Приёмные родители", href: "/segment/foster-family" },
  { id: "svo-family", title: "Семья участника СВО", href: "/segment/svo-family" },
  { id: "loss", title: "Потеря в семье", href: "/situation/loss" },
  { id: "parent-disability", title: "Родитель-инвалид", href: "/situation/parent-disability" },
  { id: "child-disability", title: "Ребёнок-инвалид", href: "/situation/child-disability" },
  { id: "nursery", title: "Ясли", href: "/situation/nursery" },
  { id: "kindergarten", title: "Детсад", href: "/situation/kindergarten" },
  { id: "school", title: "Школа", href: "/segment/schoolchild" },
  { id: "college", title: "Колледж", href: "/situation/college" },
  { id: "university", title: "ВУЗ", href: "/situation/university" },
  { id: "vacation", title: "Семья и отпуск", href: "/situation/vacation" },
  { id: "second-family", title: "Вторая семья", href: "/situation/second-family" },
  { id: "grandparents", title: "Бабушки и дедушки", href: "/situation/grandparents" },
  { id: "family-business", title: "Семейный бизнес", href: "/situation/family-business" },
  { id: "own", title: "Своя жизненная ситуация", special: true, href: "/situation/own" },
];
