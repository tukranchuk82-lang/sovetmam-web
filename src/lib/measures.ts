// Типы и константы каталога. Сами меры теперь хранятся в Supabase
// (таблицы public.measures и public.segments) — читать их через
// src/lib/measures-db.ts (server-only). Сегменты, категории и регионы
// оставлены константами: набор стабильный, а к segment-id привязаны иконки.

export type SupportLevel = "federal" | "regional";

/** Жизненные ситуации (сегменты) — главная навигация на входе. */
export type SegmentId =
  | "expecting-first"
  | "expecting-second"
  | "expecting-third"
  | "expecting-fourth"
  | "expecting-fifth-plus"
  | "student-family"
  | "single-parent"
  | "svo-family"
  | "disability"
  | "foster-family"
  | "schoolchild";

export interface Segment {
  id: SegmentId;
  title: string;
  short: string;
}

export const SEGMENTS: Segment[] = [
  {
    id: "expecting-first",
    title: "В ожидании первого ребёнка",
    short: "Беременность и рождение первенца.",
  },
  {
    id: "expecting-second",
    title: "В ожидании второго ребёнка",
    short: "Поддержка при рождении второго малыша.",
  },
  {
    id: "expecting-third",
    title: "В ожидании третьего ребёнка",
    short: "Меры для семей, готовящихся стать многодетными.",
  },
  {
    id: "expecting-fourth",
    title: "В ожидании четвёртого ребёнка",
    short: "Поддержка многодетных семей при рождении четвёртого малыша.",
  },
  {
    id: "expecting-fifth-plus",
    title: "В ожидании пятого и последующих детей",
    short: "Меры для больших многодетных семей.",
  },
  {
    id: "student-family",
    title: "Студенческая семья",
    short: "Поддержка семей, где родители учатся очно.",
  },
  {
    id: "single-parent",
    title: "Неполная семья",
    short: "Меры для одиноких родителей.",
  },
  {
    id: "svo-family",
    title: "Семьи участников СВО",
    short: "Льготы и выплаты семьям военнослужащих.",
  },
  {
    id: "disability",
    title: "В семье есть инвалид или человек с ОВЗ",
    short: "Поддержка семей с инвалидностью.",
  },
  {
    id: "foster-family",
    title: "Приёмная семья и опека",
    short: "Поддержка опекунов, приёмных и замещающих семей.",
  },
  {
    id: "schoolchild",
    title: "Есть дети-школьники",
    short: "Выплаты и льготы для семей со школьниками.",
  },
];

export type Category =
  | "Выплаты и пособия"
  | "Жильё и ипотека"
  | "Налоги и льготы"
  | "Здоровье"
  | "Образование"
  | "Транспорт"
  | "Культура и отдых"
  | "Работа и занятость"
  | "Помощь и сопровождение"
  // Коммерческие предложения сетей многодетным: кешбэк, постоянные скидки.
  // В базе такие меры были, а в этом списке — нет, и фильтр каталога их
  // не показывал.
  | "Скидки в магазинах";

export const CATEGORIES: Category[] = [
  "Выплаты и пособия",
  "Жильё и ипотека",
  "Налоги и льготы",
  "Здоровье",
  "Образование",
  "Транспорт",
  "Культура и отдых",
  "Работа и занятость",
  "Помощь и сопровождение",
  "Скидки в магазинах",
];

// Все 89 субъектов Российской Федерации, отсортированы по алфавиту.
// Названия — официальные, в формате, ожидаемом criteria.regions у мер.
export const REGIONS = [
  "Алтайский край",
  "Амурская область",
  "Архангельская область",
  "Астраханская область",
  "Белгородская область",
  "Брянская область",
  "Владимирская область",
  "Волгоградская область",
  "Вологодская область",
  "Воронежская область",
  "Донецкая Народная Республика",
  "Еврейская автономная область",
  "Забайкальский край",
  "Запорожская область",
  "Ивановская область",
  "Иркутская область",
  "Кабардино-Балкарская Республика",
  "Калининградская область",
  "Калужская область",
  "Камчатский край",
  "Карачаево-Черкесская Республика",
  "Кемеровская область — Кузбасс",
  "Кировская область",
  "Костромская область",
  "Краснодарский край",
  "Красноярский край",
  "Курганская область",
  "Курская область",
  "Ленинградская область",
  "Липецкая область",
  "Луганская Народная Республика",
  "Магаданская область",
  "Москва",
  "Московская область",
  "Мурманская область",
  "Ненецкий автономный округ",
  "Нижегородская область",
  "Новгородская область",
  "Новосибирская область",
  "Омская область",
  "Оренбургская область",
  "Орловская область",
  "Пензенская область",
  "Пермский край",
  "Приморский край",
  "Псковская область",
  "Республика Адыгея",
  "Республика Алтай",
  "Республика Башкортостан",
  "Республика Бурятия",
  "Республика Дагестан",
  "Республика Ингушетия",
  "Республика Калмыкия",
  "Республика Карелия",
  "Республика Коми",
  "Республика Крым",
  "Республика Марий Эл",
  "Республика Мордовия",
  "Республика Саха (Якутия)",
  "Республика Северная Осетия — Алания",
  "Республика Татарстан",
  "Республика Тыва",
  "Республика Хакасия",
  "Ростовская область",
  "Рязанская область",
  "Самарская область",
  "Санкт-Петербург",
  "Саратовская область",
  "Сахалинская область",
  "Свердловская область",
  "Севастополь",
  "Смоленская область",
  "Ставропольский край",
  "Тамбовская область",
  "Тверская область",
  "Томская область",
  "Тульская область",
  "Тюменская область",
  "Удмуртская Республика",
  "Ульяновская область",
  "Хабаровский край",
  "Ханты-Мансийский автономный округ — Югра",
  "Херсонская область",
  "Челябинская область",
  "Чеченская Республика",
  "Чувашская Республика",
  "Чукотский автономный округ",
  "Ямало-Ненецкий автономный округ",
  "Ярославская область",
] as const;

/**
 * Доход семьи на человека, в прожиточных минимумах — то, что выбрал
 * пользователь. Хранится верхняя граница его группы; `null` — «выше 2 ПМ»
 * либо вопрос не заполнен.
 */
export type IncomePm = 1 | 1.5 | 2;

/**
 * Система налогообложения предпринимателя.
 *
 * НПД здесь не случайно: налог на профессиональный доход платят не только
 * самозанятые без статуса ИП — предприниматель тоже вправе на него перейти.
 * Такой ИП НДФЛ не платит, и налоговые меры ему не подходят.
 */
export type TaxSystem = "osno" | "usn" | "npd" | "patent" | "eshn" | "unknown";

export const TAX_SYSTEM_LABEL: Record<TaxSystem, string> = {
  osno: "Общая (ОСНО)",
  usn: "Упрощённая (УСН)",
  npd: "НПД (как самозанятый)",
  patent: "Патент",
  eshn: "Сельхозналог (ЕСХН)",
  unknown: "Не знаю",
};

/** Тип населённого пункта — от него зависят сельские и малогородские программы. */
export type SettlementType = "city" | "small-town" | "village";

/** Чем человек занят сейчас. Декрет — отдельное состояние, а не «не работаю». */
export type EmploymentStatus = "working" | "not-working" | "parental-leave";

/** Как оформлена занятость. Можно совмещать: наём + самозанятость. */
export type EmploymentKind = "hired" | "self-employed" | "entrepreneur";

/** Кем человек был до декрета — от этого зависят и выплаты, и меры вуза. */
export type PreviousEmployment = EmploymentKind | "student" | "none";

/** Сфера работы: под земские программы, IT-ипотеку, ЖСК. */
export type WorkField =
  | "education"
  | "medicine"
  | "sport"
  | "culture"
  | "it"
  | "public"
  | "defense"
  | "military";

/** Кто именно в семье связан с СВО: круг получателей у мер разный. */
export type SvoRole = "active" | "veteran" | "lost" | "disabled";

/** Уровень и форма обучения родителей-студентов. */
export type StudyLevel = "vuz" | "college";
export type StudyFunding = "budget" | "paid";

/** Срок беременности — влияет на единое пособие и выплаты жене призывника. */
export type PregnancyStage = "under12" | "12-27" | "28-35" | "36plus";

/**
 * Ребёнок: месяц и год рождения вместо возраста.
 *
 * Возраст в анкете устаревает — заполненная год назад анкета считает семилетку
 * шестилеткой, и школьные меры человеку не показываются. Дата рождения не
 * устаревает никогда, даёт точность в месяцах (нужна для мер «до 1,5 лет») и
 * позволяет считать сроки подачи: например, шесть месяцев на единовременное
 * пособие отсчитываются именно от неё.
 */
export interface ChildInfo {
  /** 1–12. */
  birthMonth: number;
  birthYear: number;
  /**
   * Для детей 18 лет и старше: учится ли очно. От этого зависит статус
   * многодетной семьи (он держится до 23 лет) и меры для студентов.
   */
  studiesFullTime?: boolean;
}

/**
 * Условия, при которых мера подходит пользователю (движок правил).
 *
 * Все поля складываются через И: мера с requiresChildren + requiresLowIncome
 * подойдёт только семье, у которой есть дети И низкий доход.
 *
 * Но огромная часть мер адресована нескольким группам сразу — «многодетным,
 * малоимущим и семьям с детьми-инвалидами». Такую меру нельзя описать через И:
 * она потребовала бы от человека быть всем одновременно. Раньше их оставляли
 * вовсе без условий — и они вываливались в подбор каждому, из-за чего люди
 * получали десятки чужих мер. Для них есть `anyOf` — «хотя бы одна из групп».
 */
export interface EligibilityCriteria {
  /**
   * Мера подходит, если выполнен ХОТЯ БЫ ОДИН из наборов условий.
   * Проверяется вместе с остальными полями: те по-прежнему через И.
   *
   * Пример — «помощь многодетным, малоимущим и семьям с детьми-инвалидами»:
   *   { requiresChildren: true,
   *     anyOf: [{ minChildren: 3 }, { requiresLowIncome: true },
   *             { requiresDisabledChild: true }] }
   * Дети нужны в любом случае, а дальше достаточно попасть в одну из трёх групп.
   */
  anyOf?: EligibilityCriteria[];
  /** Мера для семьи: подходит, если пользователь ждёт ребёнка ИЛИ уже есть дети. */
  requiresFamily?: boolean;
  requiresPregnancy?: boolean;
  requiresChildren?: boolean;
  minChildren?: number;
  /**
   * Многоплодные роды: мера положена, только если за одни роды родилось не менее
   * N детей (двойня → 2, тройня → 3, четверни → 4). Это НЕ то же, что minChildren:
   * семья с тремя погодками под «тройню» не подходит, а семья, где одновременно
   * родилась тройня, — подходит. Считается по ответу анкеты «многоплодные роды».
   */
  minSimultaneousBirth?: number;
  /**
   * Сколько детей должны УЧИТЬСЯ В ШКОЛЕ ОДНОВРЕМЕННО (возраст 7–17 лет).
   *
   * Это не то же самое, что число детей в семье. Например, в Мордовии пособие к
   * учебному году положено, только если в школе учатся сразу четверо детей: мама
   * шестерых, у которой школьник один, права на него не имеет. Считается по
   * возрастам детей из анкеты.
   */
  minSchoolChildren?: number;
  maxYoungestChildAgeYears?: number;
  /**
   * В семье есть ребёнок В ВОЗРАСТЕ ОТ … ДО … лет (включительно).
   *
   * Не путать с maxYoungestChildAgeYears — там про самого младшего. Здесь —
   * «хоть один ребёнок подходящего возраста»: Пушкинская карта нужна подростку
   * 14–22 лет, неонатальный скрининг — новорождённому, образовательный кредит —
   * выпускнику. Считается по возрастам детей из анкеты.
   */
  hasChildAgedFrom?: number;
  hasChildAgedTo?: number;
  /** В семье есть дети, потерявшие одного или обоих родителей (кормильца). */
  requiresLossOfBreadwinner?: boolean;
  /**
   * Мера НЕ участвует в подборе — только в каталоге.
   *
   * Есть меры, право на которые зависит от обстоятельств, о которых мы в анкете
   * не спрашиваем и спрашивать не будем: льготы чернобыльцам, «Гектар» на
   * Дальнем Востоке, выплаты от работодателя, жильё на селе, социальное такси.
   * Без этого флага они лезли в подбор каждому и создавали ощущение, что подбор
   * «выдаёт что попало». В каталоге и в тематических разделах они остаются.
   */
  excludeFromMatching?: boolean;
  /** Доход ниже прожиточного минимума. Эквивалент maxIncomePm: 1. */
  requiresLowIncome?: boolean;
  /**
   * Потолок дохода на человека в ПМ. Мера с `maxIncomePm: 2` подходит всем,
   * чей доход не выше 2 ПМ, то есть и группе «до 1 ПМ», и «до 1,5 ПМ».
   */
  maxIncomePm?: IncomePm;
  /** Ребёнок-инвалид (установлена инвалидность). */
  requiresDisabledChild?: boolean;
  /**
   * Ребёнок с ОВЗ (ограниченные возможности здоровья) — статус в образовании,
   * инвалидности при этом может не быть.
   *
   * Такие меры подходят и семьям с ребёнком-инвалидом: в базе это школьное
   * питание, обучение и соцуслуги, которые почти везде оформлены сразу «для
   * детей с ОВЗ и детей-инвалидов». Ставить обе метки на одну меру нельзя —
   * критерии в анкете складываются через И, и мера потребовала бы сразу
   * инвалидность И ОВЗ. См. isEligible.
   */
  requiresSpecialNeedsChild?: boolean;
  requiresMortgageIntent?: boolean;
  requiresSvoFamily?: boolean;
  requiresSingleParent?: boolean;
  requiresStudent?: boolean;
  /** Мера только для родителей младше 35 лет («молодая семья»). */
  requiresParentUnder35?: boolean;
  /**
   * Предельный возраст заявителя — для мер с цензом жёстче «молодой семьи»:
   * «маме до 25 лет», «женщине до 28 лет» и подобных.
   *
   * Считается по возрасту того, кто заполняет анкету: такие выплаты назначают
   * лично матери, а не семье. Если возраст не указан (анкету заполняли до
   * того, как мы стали его спрашивать), условие пропускаем — иначе у людей
   * молча пропали бы меры, которые они уже видели.
   */
  maxParentAge?: number;
  requiresSelfEmployed?: boolean;
  requiresEntrepreneur?: boolean;
  /**
   * Мера — возврат уже уплаченного НДФЛ (налоговые вычеты, семейная налоговая
   * выплата). Положена только тем, кто этот налог платил.
   *
   * Кто платит — считает paysNdfl. Коротко: наёмная работа с официальной
   * зарплатой или предпринимательство на общей системе. Самозанятость (НПД),
   * УСН и патент своего НДФЛ не дают: вернуть нечего.
   */
  requiresNdfl?: boolean;
  /**
   * Родитель работает учителем.
   *
   * Появилось под Указ Президента от 20.07.2026 № 498: у учителей есть свой
   * набор мер (музеи, «Ветеран труда» за 25 лет стажа, бесплатная юрпомощь),
   * а часть мер адресована их детям — например, первоочередной приём в детсад.
   */
  requiresTeacher?: boolean;
  /** Инвалидность у самого родителя (не у ребёнка — для того requiresDisabledChild). */
  requiresDisabledParent?: boolean;
  /** Приёмные родители, опекуны, попечители, усыновители. */
  requiresFosterParent?: boolean;
  /**
   * Возрастное окно ребёнка В МЕСЯЦАХ: мера подходит, если ХОТЯ БЫ ОДИН ребёнок
   * попадает в диапазон. Заменяет hasChildAgedFrom/hasChildAgedTo — те считали
   * в целых годах, и рубеж «до полутора лет» выразить было нельзя.
   *
   * Возраст считается на сегодня из даты рождения, поэтому подбор не устаревает.
   */
  childAgeFromMonths?: number;
  childAgeToMonths?: number;
  /**
   * Мера касается и тех, кто ребёнка только ждёт.
   *
   * Нужна вместе с возрастным окном: маткапитал и единовременное пособие при
   * рождении привязаны к возрасту 0, но знать о них нужно заранее. Без этого
   * флага беременная без детей их не увидит — в окно никто не попадает.
   */
  appliesToExpecting?: boolean;
  /** Есть ребёнок 18–23 лет на очном обучении. */
  requiresChildStudying?: boolean;
  /** У ребёнка редкое (орфанное) заболевание — «Круг добра», лечебное питание. */
  requiresRareDisease?: boolean;
  /** Встала на учёт по беременности до 12 недель — условие единого пособия. */
  requiresEarlyRegistration?: boolean;
  /** Срок беременности не меньше указанного: жене призывника — от 180 дней. */
  minPregnancyWeeks?: number;
  /** Село или город до 50 тысяч: сельская ипотека, земские программы. */
  requiresSettlement?: SettlementType[];
  /** Нужно гражданство РФ у всей семьи. */
  requiresCitizenship?: boolean;
  /** Человек сейчас в отпуске по беременности и родам или по уходу за ребёнком. */
  requiresParentalLeave?: boolean;
  /** Откуда человек ушёл в декрет: меры вуза — только вчерашним студентам. */
  requiresPreviousEmployment?: PreviousEmployment[];
  /**
   * Уплачены добровольные взносы на социальное страхование.
   *
   * Оформляемая метка: у ИП право на декретные есть только при взносе до
   * 31 декабря прошлого года, задним числом не купишь — но на следующий год
   * успеть можно, поэтому меру показываем с плашкой, а не прячем.
   */
  requiresVoluntaryInsurance?: boolean;
  /** Официальный статус безработного. Оформляемая метка — см. PendingReason. */
  requiresUnemployedStatus?: boolean;
  /** Сфера работы родителя. Обобщает частный случай requiresTeacher. */
  requiresWorkField?: WorkField[];
  requiresStudyLevel?: StudyLevel[];
  /** Мера для платного обучения: перевод на бюджет, отсрочка оплаты. */
  requiresPaidStudy?: boolean;
  requiresTargetedContract?: boolean;
  /**
   * Статус нуждающихся в улучшении жилищных условий.
   *
   * Оформляемая метка: статус присваивает администрация, и если у семьи есть
   * основание (своего жилья нет, метраж меньше нормы, жильё аварийное), меру
   * показываем с плашкой, а не прячем.
   */
  requiresHousingNeed?: boolean;
  /** Нет своего жилья ни в собственности, ни по соцнайму. */
  requiresNoHome?: boolean;
  /** Жильё аварийное или непригодное для проживания. */
  requiresUnfitHousing?: boolean;
  /** Есть действующая ипотека: 450 000 ₽ на погашение, каникулы, вычет. */
  requiresMortgage?: boolean;
  /** Уточнение внутри СВО: круг получателей у каждой меры свой. */
  requiresSvoRole?: SvoRole[];
  /** Муж проходит срочную службу по призыву — это не СВО, меры другие. */
  requiresConscriptSpouse?: boolean;
  requiresVeteranCombat?: boolean;
  /** Пострадавшие от радиационных аварий (ЧАЭС, «Маяк»). */
  requiresRadiation?: boolean;
  /** Трудная жизненная ситуация: пожар, ЧС, потеря жилья. */
  requiresHardship?: boolean;
  /** Только для региональных мер: список регионов, где мера действует. */
  regions?: string[];
}

export interface SupportMeasure {
  slug: string;
  title: string;
  shortDescription: string;
  level: SupportLevel;
  region?: string;
  category: Category;
  amount?: string;
  segments: SegmentId[];
  criteria: EligibilityCriteria;
  howToApply: string[];
  documents: string[];
  /** «Полезно знать» — заметки/факты рядом с мерой (не отдельная выплата). */
  tips: string[];
  sourceUrl: string;
  sourceName: string;
  updatedAt: string;
}

/** Ответы пользователя из анкеты. */
export interface UserProfile {
  pregnant: boolean;
  /**
   * Какого по счёту ребёнка ждут: 1…10, где 10 — «10 и более».
   * `null` — не в ожидании либо не ответили.
   *
   * Сейчас только записывается в профиль: движок подбора (isEligible) им пока
   * не пользуется — меры для ожидающих размечены критерием requiresPregnancy
   * без привязки к очерёдности. Поле нужно, чтобы позже подбирать меры именно
   * по числу детей (маткапитал на первого/третьего и т.п.).
   */
  expectingChildNumber: number | null;
  hasChildren: boolean;
  childrenCount: number;
  /**
   * Возраст каждого ребёнка по отдельности (лет), 0…18, где 18 — «18 и старше».
   * Длина совпадает с childrenCount; незаполненные позиции сюда не попадают.
   * Движок подбора смотрит на youngestChildAgeYears — он выводится отсюда как
   * минимум, — но сами возрасты нужны, чтобы позже подбирать меры, привязанные
   * к возрасту конкретного ребёнка (школьные, дошкольные, студенческие).
   */
  childrenAges: number[];
  youngestChildAgeYears: number | null;
  /**
   * Сколько детей родилось за одни (самые «многоплодные») роды: 1 — обычные роды,
   * 2 — двойня, 3 — тройня, 4 — четверни и более. Нужно для мер, положенных
   * именно при многоплодных родах (criteria.minSimultaneousBirth).
   */
  multipleBirthCount: number;
  region: string;
  /**
   * Доход на человека: верхняя граница выбранной группы в ПМ.
   * `null` — «выше 2 ПМ» либо пользователь не ответил.
   */
  incomePm: IncomePm | null;
  /**
   * Устаревшее: доход ниже ПМ. Оставлено, потому что 46 мер размечены
   * requiresLowIncome. Всегда выводится из incomePm — отдельно не задавать.
   */
  lowIncome: boolean;
  /** Ребёнок-инвалид. */
  disabledChild: boolean;
  /** Ребёнок с ОВЗ (инвалидности может не быть). */
  specialNeedsChild: boolean;
  /** В семье есть дети, потерявшие одного или обоих родителей (кормильца). */
  lossOfBreadwinner: boolean;
  mortgageIntent: boolean;
  svoFamily: boolean;
  singleParent: boolean;
  student: boolean;
  /** Возраст того, кто заполняет анкету. `null` — не ответили. */
  parentAge: number | null;
  /** Возраст супруга. `null` — супруга нет либо не ответили. */
  spouseAge: number | null;
  /**
   * Оба родителя моложе 36 лет.
   *
   * Программы для молодых семей требуют, чтобы возрастной ценз проходили ОБА
   * супруга: если одному 33, а второму 37, семья права не имеет. Поэтому флаг
   * выводится из возрастов и по старшему из супругов, а не спрашивается
   * отдельно — раньше на один вопрос «до 35 лет» отвечали за двоих, и меры
   * показывались семьям, которым не полагались.
   */
  parentUnder35: boolean;
  selfEmployed: boolean;
  entrepreneur: boolean;
  /**
   * Кто-то из родителей работает по найму с официальной зарплатой.
   *
   * `null` — не спрашивали (анкету заполнили до появления вопроса).
   */
  employed: boolean | null;
  /**
   * Система налогообложения предпринимателя. Спрашиваем, только если человек
   * ответил, что он ИП.
   *
   * Нужна ровно для одного: свой НДФЛ по ставке 13% предприниматель платит
   * только на общей системе. На УСН, НПД, патенте и ЕСХН — не платит, а значит
   * и возвращать ему нечего.
   */
  taxSystem: TaxSystem | null;
  /**
   * У предпринимателя есть наёмные сотрудники.
   *
   * На право самого ИП вернуть налог не влияет: НДФЛ за работников он
   * перечисляет как налоговый агент, это налог работников, а не его.
   * Спрашиваем ради мер для работодателей.
   */
  hasEmployees: boolean | null;
  disabledParent: boolean;
  fosterParent: boolean;
  /** Работает учителем — см. criteria.requiresTeacher. */
  teacher: boolean;

  // ── Анкета версии 2 ───────────────────────────────────────────────────
  // Все поля необязательные: 40+ анкет заполнены по старой форме, и они
  // должны продолжать работать. Где нового ответа нет, движок берёт старое
  // поле или пропускает условие — молча пропавшая мера хуже лишней.

  /** Город, малый город или село — сельские и малогородские программы. */
  settlementType?: SettlementType | null;
  /** Гражданство РФ у всей семьи. false — у кого-то из семьи его нет. */
  citizenshipAll?: boolean | null;
  /** Срок беременности. */
  pregnancyStage?: PregnancyStage | null;
  /** Встала на учёт по беременности до 12 недель. */
  registeredEarly?: boolean | null;
  /**
   * Дети с датами рождения. Заменяет childrenAges: возраст в анкете
   * устаревает, дата рождения — нет. Старое поле остаётся для анкет,
   * заполненных раньше.
   */
  children?: ChildInfo[];
  /** У ребёнка редкое (орфанное) заболевание. */
  rareDisease?: boolean;
  /** Работает, не работает или в декрете. */
  employmentStatus?: EmploymentStatus | null;
  /** Как оформлена занятость: можно совмещать наём с самозанятостью. */
  employmentKinds?: EmploymentKind[];
  /** Кем человек был до декрета — от этого зависят меры вуза и работодателя. */
  previousEmployment?: PreviousEmployment | null;
  /** Уплачены добровольные взносы на социальное страхование (ИП, самозанятые). */
  voluntaryInsurance?: boolean | null;
  /** Официальный статус безработного. */
  unemployedStatus?: boolean | null;
  /**
   * Сферы работы родителей. Пустой массив — осознанный ответ «не работаем
   * в указанных сферах», null — вопрос пропущен. Разница важна: пропуск меру
   * не скрывает, явное «нет» — скрывает.
   */
  workFields?: WorkField[] | null;
  studyLevel?: StudyLevel | null;
  studyFunding?: StudyFunding | null;
  targetedContract?: boolean | null;
  /** Есть своё жильё — в собственности или по социальному найму. */
  ownsHome?: boolean | null;
  /** Общая площадь жилья и число зарегистрированных — для расчёта нормы. */
  homeArea?: number | null;
  residentsCount?: number | null;
  /** Жильё аварийное или непригодное. */
  homeUnfit?: boolean | null;
  /** Состоит на учёте как нуждающийся в улучшении жилищных условий. */
  housingNeedStatus?: "registered" | "no" | "unknown" | null;
  /** Есть действующая ипотека. */
  hasMortgage?: boolean | null;
  /** Кто в семье связан с СВО: у каждой меры свой круг получателей. */
  svoRoles?: SvoRole[];
  /** Муж проходит срочную службу по призыву — это не СВО. */
  conscriptSpouse?: boolean;
  veteranCombat?: boolean;
  radiationAffected?: boolean;
  /** Трудная жизненная ситуация: пожар, ЧС, потеря жилья. */
  hardship?: boolean;
}

/** Правильное склонение: «1 мера», «2 меры», «5 мер». */
export function pluralMeasures(n: number): string {
  const d10 = n % 10;
  const d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return `${n} мера`;
  if (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20)) return `${n} меры`;
  return `${n} мер`;
}

export function getSegment(id: string): Segment | undefined {
  return SEGMENTS.find((s) => s.id === id);
}

/** Подходит ли мера пользователю по его ответам. */
/**
 * @param ignoreRegion не отсекать региональные меры по региону профиля. Нужно
 * экрану результатов подбора: там регион переключается прямо в выдаче (и его
 * можно указать, если в анкете не указывали), поэтому фильтрацию по региону
 * берёт на себя список мер, а не движок.
 */
/**
 * Подходит ли мера — с тремя исходами вместо двух.
 *
 * fits: false — не подходит, показывать нельзя.
 * fits: true, pending пуст — подходит полностью.
 * fits: true, pending не пуст — подойдёт, когда человек оформит статус;
 * такую меру показываем с плашкой из PENDING_TEXT, а не прячем.
 *
 * Плашка появляется, только если ВСЕ остальные условия совпали: провалено
 * хотя бы одно жёсткое — меры нет вовсе, чтобы не обнадёживать зря.
 */
export function evaluateEligibility(
  profile: UserProfile,
  m: SupportMeasure,
  {
    ignoreRegion = false,
    strict = false,
  }: { ignoreRegion?: boolean; strict?: boolean } = {},
): { fits: boolean; pending: PendingReason[] } {
  const c = m.criteria;

  // Региональные меры показываем ТОЛЬКО при совпадении региона. Источник региона —
  // criteria.regions (если задан) или колонка region. Без выбранного региона
  // региональные меры не показываем вовсе — иначе в выдачу попадают чужие регионы.
  if (m.level === "regional" && !ignoreRegion) {
    if (!profile.region) return { fits: false, pending: [] };
    const allowed =
      c.regions && c.regions.length > 0
        ? c.regions
        : m.region
          ? [m.region]
          : [];
    if (allowed.length > 0 && !allowed.includes(profile.region)) {
      return { fits: false, pending: [] };
    }
  }

  const pending = new Set<PendingReason>();
  if (!matchesCriteria(profile, c, strict ? undefined : pending)) {
    return { fits: false, pending: [] };
  }

  // Вторая (страховочная) проверка региона: мера могла указать regions, будучи
  // помечена федеральной. Тоже уважает ignoreRegion — иначе региональные меры
  // отсеиваются здесь, даже если выше их пропустили.
  if (!ignoreRegion && c.regions && c.regions.length > 0) {
    if (!profile.region || !c.regions.includes(profile.region)) {
      return { fits: false, pending: [] };
    }
  }
  return { fits: true, pending: [...pending] };
}

/** Подходит ли мера. Меры «подойдёт, если оформить статус» тоже считаются. */
export function isEligible(
  profile: UserProfile,
  m: SupportMeasure,
  opts: { ignoreRegion?: boolean; strict?: boolean } = {},
): boolean {
  return evaluateEligibility(profile, m, opts).fits;
}

/** Предельный возраст супругов в программах для молодых семей. */
export const YOUNG_FAMILY_MAX_AGE = 35;

/**
 * Проходит ли семья возрастной ценз «молодой семьи».
 *
 * Считаем по старшему из супругов: программа требует, чтобы обоим было не
 * больше 35 лет. Если возрасты не заполнены (анкета старая), опираемся на
 * прежний ответ «до 35 лет» — иначе у людей, заполнивших анкету раньше,
 * молча пропали бы подходящие меры.
 */
export function isYoungFamily(profile: UserProfile): boolean {
  const { parentAge, spouseAge } = profile;
  if (parentAge == null && spouseAge == null) return profile.parentUnder35;

  const ages = [parentAge, spouseAge].filter((a): a is number => a != null);
  return ages.every((a) => a <= YOUNG_FAMILY_MAX_AGE);
}

/**
 * Платит ли семья НДФЛ по основной ставке — то есть есть ли что возвращать.
 *
 * Возвращает `null`, если об этом ничего не спрашивали: анкеты, заполненные до
 * появления вопросов о занятости, не должны терять меры, которые человек уже
 * видел. Молча пропавшая мера хуже лишней.
 *
 * Правила простые:
 *  - наёмная работа с официальной зарплатой — налог платит работодатель, право
 *    на вычет есть;
 *  - ИП на общей системе — платит свой НДФЛ, право есть;
 *  - ИП на УСН, НПД, патенте, ЕСХН и самозанятость без статуса ИП (тоже НПД)
 *    своего НДФЛ не дают.
 *
 * Важно: самозанятый или ИП, который вдобавок работает по найму, право
 * сохраняет — поэтому наёмная работа проверяется первой и перевешивает.
 *
 * НДФЛ, который предприниматель перечисляет за сотрудников, здесь не при чём:
 * это налог работников, ИП лишь налоговый агент. Права на собственный вычет
 * он не даёт, поэтому hasEmployees в расчёте не участвует.
 */
export function paysNdfl(profile: UserProfile): boolean | null {
  if (profile.employed === true) return true;

  if (profile.entrepreneur) {
    if (profile.taxSystem === "osno") return true;
    // «Не знаю» — не повод скрывать меру: пусть человек проверит сам.
    if (profile.taxSystem == null || profile.taxSystem === "unknown") return null;
    return false;
  }

  // Работы по найму нет и предпринимательства нет: остаётся самозанятость либо
  // отсутствие дохода — в обоих случаях своего НДФЛ нет.
  if (profile.employed === false) return false;

  return null;
}

/**
 * Проверка набора условий (без региона — им занимается isEligible).
 * Все поля — через И; `anyOf` — «хотя бы один из вложенных наборов».
 * Вынесено отдельной функцией, чтобы anyOf проверялся теми же правилами.
 */
/**
 * Чего человеку не хватает, чтобы мера стала доступной.
 *
 * Это третий исход помимо «подходит» и «не подходит»: статус, который человек
 * может оформить. Такие меры не прячем — показываем с плашкой, где назван и
 * сам статус, и ведомство, которое его присваивает.
 */
export type PendingReason = "unemployed" | "housing" | "insurance";

export const PENDING_TEXT: Record<PendingReason, string> = {
  unemployed:
    "Положено при официальном статусе безработного, полученном в Службе занятости",
  housing:
    "Положено при статусе нуждающихся в улучшении жилищных условий — оформляется в администрации по месту жительства",
  insurance:
    "Положено, если добровольные взносы на социальное страхование уплачены до 31 декабря предыдущего года — на следующий год ещё можно успеть",
};

/**
 * Ориентир учётной нормы площади, кв. м на человека.
 *
 * Точную норму устанавливает каждый муниципалитет отдельно, единого
 * справочника не существует. Берём типовое значение: оно нужно не для
 * решения, а для подсказки «похоже, у вас есть основание встать на учёт».
 */
const HOUSING_NORM_M2 = 12;

/** Возраст ребёнка в месяцах на сегодня. */
function childAgeMonths(child: ChildInfo, now = new Date()): number {
  return (
    (now.getFullYear() - child.birthYear) * 12 +
    (now.getMonth() + 1 - child.birthMonth)
  );
}

/**
 * Возрасты детей в месяцах — диапазоном, а не точкой.
 *
 * У анкет версии 2 дата рождения известна, и диапазон вырождается в точку.
 * У старых анкет есть только возраст в целых годах: ребёнку «5 лет» может
 * быть от 60 до 71 месяца, поэтому проверяем пересечение с окном меры, а не
 * попадание точки — иначе меры «до 1,5 лет» потерялись бы у всех, кто
 * заполнял анкету раньше.
 */
function childrenAgeRangesMonths(
  profile: UserProfile,
): { from: number; to: number }[] {
  if (profile.children && profile.children.length > 0) {
    return profile.children.map((ch) => {
      const m = childAgeMonths(ch);
      return { from: m, to: m };
    });
  }
  const ages = profile.childrenAges ?? [];
  return ages.map((a) =>
    // 18 в старой анкете значило «18 и старше» — верхнюю границу берём 24 года.
    a >= 18 ? { from: 18 * 12, to: 24 * 12 } : { from: a * 12, to: a * 12 + 11 },
  );
}

/**
 * Сколько детей считается по правилу Указа Президента от 23.01.2024 № 63:
 * дети младше 18 лет плюс дети до 23 лет, которые учатся очно.
 *
 * Раньше движок брал число, которое человек вписал сам, и возраст не смотрел
 * вовсе. Из-за этого семья теряла статус многодетной, когда старший поступал
 * в вуз, — на что и жаловался заказчик.
 */
export function countChildrenForStatus(profile: UserProfile): number {
  const kids = profile.children;
  if (!kids || kids.length === 0) return profile.childrenCount;
  return kids.filter((ch) => {
    const years = Math.floor(childAgeMonths(ch) / 12);
    if (years < 18) return true;
    return years <= 23 && ch.studiesFullTime === true;
  }).length;
}

/** Есть ли ребёнок 18–23 лет на очном обучении. */
function hasStudyingAdultChild(profile: UserProfile): boolean {
  return (profile.children ?? []).some((ch) => {
    const years = Math.floor(childAgeMonths(ch) / 12);
    return years >= 18 && years <= 23 && ch.studiesFullTime === true;
  });
}

/** Нижняя граница срока беременности в неделях — по выбранной группе. */
function pregnancyWeeksFrom(profile: UserProfile): number | null {
  switch (profile.pregnancyStage) {
    case "under12":
      return 0;
    case "12-27":
      return 12;
    case "28-35":
      return 28;
    case "36plus":
      return 36;
    default:
      return null;
  }
}

/**
 * Положение семьи с жильём: статус есть, статуса нет но основание есть, либо
 * оснований не видно.
 *
 * Основания — по статье 51 Жилищного кодекса: своего жилья нет, площадь на
 * человека меньше учётной нормы, жильё аварийное. Когда данных нет вовсе,
 * возвращаем «основание есть»: лучше показать меру с плашкой, чем спрятать
 * положенное.
 */
export function housingNeedState(
  profile: UserProfile,
): "registered" | "eligible" | "no" {
  if (profile.housingNeedStatus === "registered") return "registered";
  if (profile.ownsHome === false) return "eligible";
  if (profile.homeUnfit === true) return "eligible";
  const { homeArea: area, residentsCount: people } = profile;
  if (area != null && people != null && people > 0) {
    return area / people < HOUSING_NORM_M2 ? "eligible" : "no";
  }
  // Про жильё ничего не спрашивали (старая анкета) — меру не прячем.
  if (profile.ownsHome == null && profile.housingNeedStatus == null) {
    return "eligible";
  }
  return "no";
}

function matchesCriteria(
  profile: UserProfile,
  c: EligibilityCriteria,
  pending?: Set<PendingReason>,
): boolean {
  // Мера показывается только в каталоге — в подборе её быть не должно.
  if (c.excludeFromMatching) return false;

  if (c.requiresFamily && !profile.pregnant && !profile.hasChildren) return false;
  if (c.requiresPregnancy && !profile.pregnant) return false;
  if (c.requiresChildren && !profile.hasChildren) return false;
  // Число детей. Для тех, кто ждёт ребёнка, считаем будущее число: женщина,
  // ожидающая третьего, должна видеть меры «на третьего ребёнка» — оформлять их
  // всё равно после родов, но знать о них нужно заранее. Отсюда и вопрос анкеты
  // «какого по счёту ребёнка ожидаете».
  const countedChildren = countChildrenForStatus(profile);
  const effectiveChildren = profile.pregnant
    ? Math.max(countedChildren + 1, profile.expectingChildNumber ?? 0)
    : countedChildren;
  if (c.minChildren && effectiveChildren < c.minChildren) return false;
  // Многоплодные роды: нужно, чтобы за одни роды родилось не меньше N детей.
  // Незаполненный ответ считаем обычными родами (1) — мера про двойню/тройню не
  // покажется тому, кто про многоплодные роды не отметил.
  if (
    c.minSimultaneousBirth &&
    (profile.multipleBirthCount ?? 1) < c.minSimultaneousBirth
  ) {
    return false;
  }
  // Школьники — дети 7–17 лет. Если возрасты в анкете не заполнены, требование
  // не проверяем: иначе мера пропала бы у тех, кто просто не указал возраст.
  if (c.minSchoolChildren) {
    const ages = profile.childrenAges ?? [];
    if (ages.length > 0) {
      const schoolKids = ages.filter((a) => a >= 7 && a <= 17).length;
      if (schoolKids < c.minSchoolChildren) return false;
    }
  }
  if (
    c.maxYoungestChildAgeYears != null &&
    (profile.youngestChildAgeYears == null ||
      profile.youngestChildAgeYears > c.maxYoungestChildAgeYears)
  ) {
    return false;
  }
  // «Есть ребёнок в возрасте от … до …».
  // Если детей нет вовсе — условие не выполнено (Пушкинская карта не нужна той,
  // кто только ждёт первенца). Если дети есть, но возрасты в анкете не заполнены,
  // требование не проверяем — иначе мера пропала бы у того, кто просто не указал
  // возраст. Меры, которые нужны и будущим родителям, ставят это условие внутрь
  // anyOf рядом с requiresPregnancy — см. пособие при рождении.
  if (c.hasChildAgedFrom != null || c.hasChildAgedTo != null) {
    if (!profile.hasChildren) return false;
    const ages = profile.childrenAges ?? [];
    if (ages.length > 0) {
      const from = c.hasChildAgedFrom ?? 0;
      const to = c.hasChildAgedTo ?? 18;
      if (!ages.some((a) => a >= from && a <= to)) return false;
    }
  }
  if (c.requiresLossOfBreadwinner && !profile.lossOfBreadwinner) return false;
  if (c.requiresLowIncome && !profile.lowIncome) return false;
  // Порог дохода: мера видна, если доход пользователя не выше её потолка.
  // Неизвестный доход (null = выше 2 ПМ или без ответа) не проходит ни один порог.
  if (c.maxIncomePm != null) {
    if (profile.incomePm == null || profile.incomePm > c.maxIncomePm) return false;
  }
  if (c.requiresDisabledChild && !profile.disabledChild) return false;
  // Мера «для детей с ОВЗ» подходит и семьям с ребёнком-инвалидом: в базе такие
  // меры (питание, обучение, соцуслуги) почти всегда адресованы обеим группам
  // сразу, а инвалидность у ребёнка школьного возраста практически всегда даёт
  // и статус ОВЗ. Лучше показать лишнее, чем скрыть положенное.
  if (
    c.requiresSpecialNeedsChild &&
    !profile.specialNeedsChild &&
    !profile.disabledChild
  ) {
    return false;
  }
  if (c.requiresMortgageIntent && !profile.mortgageIntent) return false;
  if (c.requiresSvoFamily && !profile.svoFamily) return false;
  if (c.requiresSingleParent && !profile.singleParent) return false;
  if (c.requiresStudent && !profile.student) return false;
  // Молодая семья: ценз должны проходить оба супруга — см. parentUnder35.
  if (c.requiresParentUnder35 && !isYoungFamily(profile)) return false;

  // Возрастной ценз лично для заявителя («маме до 25 лет»). Возраст не
  // указан — условие не проверяем, см. комментарий у maxParentAge.
  if (
    c.maxParentAge != null &&
    profile.parentAge != null &&
    profile.parentAge > c.maxParentAge
  ) {
    return false;
  }
  if (c.requiresSelfEmployed && !profile.selfEmployed) return false;
  if (c.requiresEntrepreneur && !profile.entrepreneur) return false;
  // Возврат НДФЛ — только тем, кто его платит. Если ответов о занятости нет
  // (анкета заполнена до появления вопросов), условие пропускаем: см. paysNdfl.
  if (c.requiresNdfl && paysNdfl(profile) === false) return false;
  if (c.requiresDisabledParent && !profile.disabledParent) return false;
  if (c.requiresFosterParent && !profile.fosterParent) return false;
  if (c.requiresTeacher && !profile.teacher) return false;

  // ── Анкета версии 2 ───────────────────────────────────────────────────

  // Возрастное окно в месяцах: достаточно, чтобы подошёл ХОТЯ БЫ ОДИН ребёнок.
  // Семья с детьми 2 и 9 лет видит и малышовые меры, и школьные.
  if (c.childAgeFromMonths != null || c.childAgeToMonths != null) {
    const from = c.childAgeFromMonths ?? 0;
    const to = c.childAgeToMonths ?? 24 * 12;
    const ranges = childrenAgeRangesMonths(profile);
    if (ranges.length === 0) {
      // Детей ещё нет. Меры про рождение (маткапитал, пособие при рождении)
      // помечены appliesToExpecting — их показываем и тем, кто ждёт ребёнка.
      if (!(c.appliesToExpecting && profile.pregnant)) return false;
    } else if (!ranges.some((r) => r.to >= from && r.from <= to)) {
      return false;
    }
  }
  if (c.requiresChildStudying && !hasStudyingAdultChild(profile)) return false;
  if (c.requiresRareDisease && !profile.rareDisease) return false;
  if (c.requiresEarlyRegistration && profile.registeredEarly !== true) {
    return false;
  }
  if (c.minPregnancyWeeks != null) {
    const weeks = pregnancyWeeksFrom(profile);
    // Срок не указан — условие пропускаем, чтобы не терять меру у тех, кто
    // заполнял анкету до появления вопроса.
    if (weeks != null && weeks < c.minPregnancyWeeks) return false;
  }
  if (c.requiresSettlement && c.requiresSettlement.length > 0) {
    const kind = profile.settlementType;
    if (kind && !c.requiresSettlement.includes(kind)) return false;
  }
  if (c.requiresCitizenship && profile.citizenshipAll === false) return false;
  if (c.requiresParentalLeave && profile.employmentStatus !== "parental-leave") {
    return false;
  }
  if (c.requiresPreviousEmployment && c.requiresPreviousEmployment.length > 0) {
    const prev = profile.previousEmployment;
    if (prev && !c.requiresPreviousEmployment.includes(prev)) return false;
  }
  if (c.requiresWorkField && c.requiresWorkField.length > 0) {
    const wanted = c.requiresWorkField;
    const fields = profile.workFields;
    // null — вопрос пропущен, меру не скрываем. Пустой массив — осознанный
    // ответ «не работаем в указанных сферах», меру убираем.
    if (fields && !fields.some((f) => wanted.includes(f))) return false;
  }
  if (c.requiresStudyLevel && c.requiresStudyLevel.length > 0) {
    const level = profile.studyLevel;
    if (level && !c.requiresStudyLevel.includes(level)) return false;
  }
  if (c.requiresPaidStudy && profile.studyFunding === "budget") return false;
  if (c.requiresTargetedContract && profile.targetedContract === false) {
    return false;
  }
  if (c.requiresNoHome && profile.ownsHome === true) return false;
  if (c.requiresUnfitHousing && profile.homeUnfit === false) return false;
  if (c.requiresMortgage && profile.hasMortgage === false) return false;
  if (c.requiresSvoRole && c.requiresSvoRole.length > 0) {
    const wantedRoles = c.requiresSvoRole;
    const roles = profile.svoRoles ?? [];
    if (roles.length > 0 && !roles.some((r) => wantedRoles.includes(r))) {
      return false;
    }
  }
  if (c.requiresConscriptSpouse && !profile.conscriptSpouse) return false;
  if (c.requiresVeteranCombat && !profile.veteranCombat) return false;
  if (c.requiresRadiation && !profile.radiationAffected) return false;
  if (c.requiresHardship && !profile.hardship) return false;

  // ── Оформляемые условия ───────────────────────────────────────────────
  // Статус, которого пока нет, но который человек может получить. В обычном
  // режиме такие меры показываем с плашкой (см. PENDING_TEXT), в строгом —
  // когда аккумулятор не передан — скрываем.
  if (c.requiresUnemployedStatus && profile.unemployedStatus !== true) {
    if (!pending) return false;
    pending.add("unemployed");
  }
  if (c.requiresVoluntaryInsurance && profile.voluntaryInsurance !== true) {
    if (!pending) return false;
    pending.add("insurance");
  }
  if (c.requiresHousingNeed) {
    const state = housingNeedState(profile);
    if (state === "no") return false;
    if (state === "eligible") {
      if (!pending) return false;
      pending.add("housing");
    }
  }

  // «Хотя бы одна из групп» — для мер, адресованных нескольким категориям сразу
  // («многодетным, малоимущим и семьям с детьми-инвалидами»).
  if (c.anyOf && c.anyOf.length > 0) {
    // Сначала ищем ветку, которая проходит целиком: если человек подходит
    // как многодетный, незачем предлагать ему оформлять статус безработного.
    if (c.anyOf.some((sub) => matchesCriteria(profile, sub))) return true;
    if (!pending) return false;
    for (const sub of c.anyOf) {
      const branch = new Set<PendingReason>();
      if (matchesCriteria(profile, sub, branch)) {
        branch.forEach((r) => pending.add(r));
        return true;
      }
    }
    return false;
  }
  return true;
}

/**
 * Подбор с пометками: рядом с мерой едет список статусов, которых человеку
 * не хватает. Нужен экрану результатов, чтобы нарисовать плашку.
 */
export function matchMeasuresDetailed(
  profile: UserProfile,
  measures: SupportMeasure[],
  opts: { ignoreRegion?: boolean } = {},
): { measure: SupportMeasure; pending: PendingReason[] }[] {
  const out: { measure: SupportMeasure; pending: PendingReason[] }[] = [];
  for (const measure of measures) {
    const verdict = evaluateEligibility(profile, measure, opts);
    if (verdict.fits) out.push({ measure, pending: verdict.pending });
  }
  return out;
}

/** Возвращает все подходящие меры из переданного списка. */
export function matchMeasures(
  profile: UserProfile,
  measures: SupportMeasure[],
  opts: { ignoreRegion?: boolean } = {},
): SupportMeasure[] {
  return measures.filter((m) => isEligible(profile, m, opts));
}