import {
  deadlineStatus,
  evaluateEligibility,
  type PendingReason,
  type SupportMeasure,
  type UserProfile,
} from "./measures";

/**
 * Раскладка подборки по группам — так, как устроена книга Буцкой.
 *
 * Раньше подбор отдавал одну плоскую ленту: маткапитал соседствовал с
 * телефоном доверия, а порядок определялся служебным именем меры. Человек
 * видел три десятка карточек вперемешку и не понимал, с чего начать.
 *
 * Книга даёт готовую структуру. Сначала то, что горит по срокам. Потом
 * «положено всем» — без проверки дохода и статуса; с этого начинается вторая
 * глава, потому что главный миф звучит как «мне ничего не положено». Потом
 * «положено вам» — то, что открылось благодаря составу семьи, доходу или
 * статусу. Внутри каждой группы — три «кармана»: деньги, скидки, бесплатное.
 */

export type PocketKey = "money" | "discount" | "free";

export const POCKET_TITLE: Record<PocketKey, string> = {
  money: "Деньги",
  discount: "Скидки",
  free: "Бесплатно",
};

export type PodborItem = {
  measure: SupportMeasure;
  /** Каких статусов не хватает — показываем плашкой на карточке. */
  pending: PendingReason[];
  deadline: { text: string; urgent: boolean } | null;
};

export type PodborGroups = {
  urgent: PodborItem[];
  forAll: Record<PocketKey, PodborItem[]>;
  forYou: Record<PocketKey, PodborItem[]>;
  forAllCount: number;
  forYouCount: number;
  total: number;
};

/**
 * Условия, которые не делают меру адресной.
 *
 * Беременность, наличие детей и возраст ребёнка — это не «особый статус», а
 * обычный ход жизни: бесплатное питание в школе положено всем ученикам, а не
 * какой-то льготной категории. Регион тоже не критерий отбора: чужие меры
 * человек и так не увидит, а ежемесячное пособие своей области положено всем
 * её жителям с детьми.
 */
const OPEN_CRITERIA = new Set([
  "requiresFamily",
  "requiresPregnancy",
  "requiresChildren",
  "childAgeFromMonths",
  "childAgeToMonths",
  "appliesToExpecting",
  "hasChildAgedFrom",
  "hasChildAgedTo",
  "maxYoungestChildAgeYears",
  "regions",
  "requiresCitizenship",
  "excludeFromMatching",
]);

/** Мера положена всем — без проверки дохода, статуса и числа детей. */
export function isOpenToEveryone(m: SupportMeasure): boolean {
  const c = m.criteria ?? {};
  return Object.entries(c).every(([key, value]) => {
    if (OPEN_CRITERIA.has(key)) return true;
    // «Хотя бы один ребёнок» ограничением не считается — это те же дети.
    if (key === "minChildren") return (value as number) <= 1;
    if (key === "anyOf") return false;
    return value === undefined;
  });
}

/** Карман меры: деньги, скидка или бесплатная услуга. */
export function pocketOf(m: SupportMeasure): PocketKey {
  // В measures.segments лежат метки трёх видов: жизненные ситуации, темы
  // (topic-) и классы (class-). Тип SegmentId описывает только ситуации,
  // поэтому классы читаем как строки — так же, как страницы /class/[key].
  const segments = m.segments as unknown as string[];
  if (segments.includes("class-money")) return "money";
  if (segments.includes("class-discount")) return "discount";
  if (segments.includes("class-free")) return "free";
  // Карман не проставлен: если у меры есть сумма — это деньги, иначе услуга.
  return m.amount ? "money" : "free";
}

function emptyPockets(): Record<PocketKey, PodborItem[]> {
  return { money: [], discount: [], free: [] };
}

/**
 * Собирает подборку в группы.
 *
 * Меры со срочным сроком попадают И в блок «Успеть подать», И в свою обычную
 * группу: наверху человек видит, что горит, а ниже — полную картину, чтобы
 * список не выглядел рваным.
 */
export function groupPodbor(
  profile: UserProfile,
  measures: SupportMeasure[],
  now: Date = new Date(),
): PodborGroups {
  const groups: PodborGroups = {
    urgent: [],
    forAll: emptyPockets(),
    forYou: emptyPockets(),
    forAllCount: 0,
    forYouCount: 0,
    total: 0,
  };

  for (const measure of measures) {
    const verdict = evaluateEligibility(profile, measure);
    if (!verdict.fits) continue;

    const item: PodborItem = {
      measure,
      pending: verdict.pending,
      deadline: deadlineStatus(profile, measure, now),
    };
    groups.total += 1;
    if (item.deadline?.urgent) groups.urgent.push(item);

    const pocket = pocketOf(measure);
    if (isOpenToEveryone(measure)) {
      groups.forAll[pocket].push(item);
      groups.forAllCount += 1;
    } else {
      groups.forYou[pocket].push(item);
      groups.forYouCount += 1;
    }
  }

  // Внутри кармана — сначала меры с суммой: человек пришёл за деньгами, а не
  // за списком услуг. Порядок в базе (sort_order) у всех мер нулевой, поэтому
  // без этой сортировки маткапитал оказывался в хвосте.
  const withAmountFirst = (a: PodborItem, b: PodborItem) =>
    Number(Boolean(b.measure.amount)) - Number(Boolean(a.measure.amount));
  for (const bucket of [groups.forAll, groups.forYou]) {
    for (const key of Object.keys(bucket) as PocketKey[]) {
      bucket[key].sort(withAmountFirst);
    }
  }
  return groups;
}
