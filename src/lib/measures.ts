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
  | "Помощь и сопровождение";

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
  requiresSelfEmployed?: boolean;
  requiresEntrepreneur?: boolean;
  /** Инвалидность у самого родителя (не у ребёнка — для того requiresDisabledChild). */
  requiresDisabledParent?: boolean;
  /** Приёмные родители, опекуны, попечители, усыновители. */
  requiresFosterParent?: boolean;
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
  parentUnder35: boolean;
  selfEmployed: boolean;
  entrepreneur: boolean;
  disabledParent: boolean;
  fosterParent: boolean;
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
export function isEligible(
  profile: UserProfile,
  m: SupportMeasure,
  { ignoreRegion = false }: { ignoreRegion?: boolean } = {},
): boolean {
  const c = m.criteria;

  // Региональные меры показываем ТОЛЬКО при совпадении региона. Источник региона —
  // criteria.regions (если задан) или колонка region. Без выбранного региона
  // региональные меры не показываем вовсе — иначе в выдачу попадают чужие регионы.
  if (m.level === "regional" && !ignoreRegion) {
    if (!profile.region) return false;
    const allowed =
      c.regions && c.regions.length > 0
        ? c.regions
        : m.region
          ? [m.region]
          : [];
    if (allowed.length > 0 && !allowed.includes(profile.region)) return false;
  }

  if (!matchesCriteria(profile, c)) return false;

  // Вторая (страховочная) проверка региона: мера могла указать regions, будучи
  // помечена федеральной. Тоже уважает ignoreRegion — иначе региональные меры
  // отсеиваются здесь, даже если выше их пропустили.
  if (!ignoreRegion && c.regions && c.regions.length > 0) {
    if (!profile.region || !c.regions.includes(profile.region)) return false;
  }
  return true;
}

/**
 * Проверка набора условий (без региона — им занимается isEligible).
 * Все поля — через И; `anyOf` — «хотя бы один из вложенных наборов».
 * Вынесено отдельной функцией, чтобы anyOf проверялся теми же правилами.
 */
function matchesCriteria(profile: UserProfile, c: EligibilityCriteria): boolean {
  // Мера показывается только в каталоге — в подборе её быть не должно.
  if (c.excludeFromMatching) return false;

  if (c.requiresFamily && !profile.pregnant && !profile.hasChildren) return false;
  if (c.requiresPregnancy && !profile.pregnant) return false;
  if (c.requiresChildren && !profile.hasChildren) return false;
  // Число детей. Для тех, кто ждёт ребёнка, считаем будущее число: женщина,
  // ожидающая третьего, должна видеть меры «на третьего ребёнка» — оформлять их
  // всё равно после родов, но знать о них нужно заранее. Отсюда и вопрос анкеты
  // «какого по счёту ребёнка ожидаете».
  const effectiveChildren = profile.pregnant
    ? Math.max(profile.childrenCount + 1, profile.expectingChildNumber ?? 0)
    : profile.childrenCount;
  if (c.minChildren && effectiveChildren < c.minChildren) return false;
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
  if (c.requiresParentUnder35 && !profile.parentUnder35) return false;
  if (c.requiresSelfEmployed && !profile.selfEmployed) return false;
  if (c.requiresEntrepreneur && !profile.entrepreneur) return false;
  if (c.requiresDisabledParent && !profile.disabledParent) return false;
  if (c.requiresFosterParent && !profile.fosterParent) return false;

  // «Хотя бы одна из групп» — для мер, адресованных нескольким категориям сразу
  // («многодетным, малоимущим и семьям с детьми-инвалидами»).
  if (c.anyOf && c.anyOf.length > 0) {
    if (!c.anyOf.some((sub) => matchesCriteria(profile, sub))) return false;
  }
  return true;
}

/** Возвращает все подходящие меры из переданного списка. */
export function matchMeasures(
  profile: UserProfile,
  measures: SupportMeasure[],
  opts: { ignoreRegion?: boolean } = {},
): SupportMeasure[] {
  return measures.filter((m) => isEligible(profile, m, opts));
}