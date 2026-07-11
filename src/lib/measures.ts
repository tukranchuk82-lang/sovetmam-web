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

/** Условия, при которых мера подходит пользователю (движок правил). */
export interface EligibilityCriteria {
  /** Мера для семьи: подходит, если пользователь ждёт ребёнка ИЛИ уже есть дети. */
  requiresFamily?: boolean;
  requiresPregnancy?: boolean;
  requiresChildren?: boolean;
  minChildren?: number;
  maxYoungestChildAgeYears?: number;
  /** Доход ниже прожиточного минимума. Эквивалент maxIncomePm: 1. */
  requiresLowIncome?: boolean;
  /**
   * Потолок дохода на человека в ПМ. Мера с `maxIncomePm: 2` подходит всем,
   * чей доход не выше 2 ПМ, то есть и группе «до 1 ПМ», и «до 1,5 ПМ».
   */
  maxIncomePm?: IncomePm;
  requiresDisabledChild?: boolean;
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
  hasChildren: boolean;
  childrenCount: number;
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
  disabledChild: boolean;
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
export function isEligible(profile: UserProfile, m: SupportMeasure): boolean {
  const c = m.criteria;

  // Региональные меры показываем ТОЛЬКО при совпадении региона. Источник региона —
  // criteria.regions (если задан) или колонка region. Без выбранного региона
  // региональные меры не показываем вовсе — иначе в выдачу попадают чужие регионы.
  if (m.level === "regional") {
    if (!profile.region) return false;
    const allowed =
      c.regions && c.regions.length > 0
        ? c.regions
        : m.region
          ? [m.region]
          : [];
    if (allowed.length > 0 && !allowed.includes(profile.region)) return false;
  }

  if (c.requiresFamily && !profile.pregnant && !profile.hasChildren) return false;
  if (c.requiresPregnancy && !profile.pregnant) return false;
  if (c.requiresChildren && !profile.hasChildren) return false;
  if (c.minChildren && profile.childrenCount < c.minChildren) return false;
  if (
    c.maxYoungestChildAgeYears != null &&
    (profile.youngestChildAgeYears == null ||
      profile.youngestChildAgeYears > c.maxYoungestChildAgeYears)
  ) {
    return false;
  }
  if (c.requiresLowIncome && !profile.lowIncome) return false;
  // Порог дохода: мера видна, если доход пользователя не выше её потолка.
  // Неизвестный доход (null = выше 2 ПМ или без ответа) не проходит ни один порог.
  if (c.maxIncomePm != null) {
    if (profile.incomePm == null || profile.incomePm > c.maxIncomePm) return false;
  }
  if (c.requiresDisabledChild && !profile.disabledChild) return false;
  if (c.requiresMortgageIntent && !profile.mortgageIntent) return false;
  if (c.requiresSvoFamily && !profile.svoFamily) return false;
  if (c.requiresSingleParent && !profile.singleParent) return false;
  if (c.requiresStudent && !profile.student) return false;
  if (c.requiresParentUnder35 && !profile.parentUnder35) return false;
  if (c.requiresSelfEmployed && !profile.selfEmployed) return false;
  if (c.requiresEntrepreneur && !profile.entrepreneur) return false;
  if (c.requiresDisabledParent && !profile.disabledParent) return false;
  if (c.requiresFosterParent && !profile.fosterParent) return false;
  if (c.regions && c.regions.length > 0) {
    if (!profile.region || !c.regions.includes(profile.region)) return false;
  }
  return true;
}

/** Возвращает все подходящие меры из переданного списка. */
export function matchMeasures(
  profile: UserProfile,
  measures: SupportMeasure[],
): SupportMeasure[] {
  return measures.filter((m) => isEligible(profile, m));
}