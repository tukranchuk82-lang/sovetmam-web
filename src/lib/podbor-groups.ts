import {
  deadlineStatus,
  evaluateEligibility,
  type PendingReason,
  type SupportMeasure,
  type UserProfile,
} from "./measures";

/**
 * Раскладка подборки.
 *
 * Сначала подбор отдавал одну плоскую ленту на 30–70 карточек: маткапитал мог
 * оказаться двадцать седьмым, а первым — телефон доверия. Потом мы разложили
 * меры на «положено всем» и «положено вам», но деление оказалось неудачным:
 * человеку важно не то, по какому основанию мера открылась, а кто её даёт и
 * что именно он получит.
 *
 * Поэтому теперь два больших блока — федеральные меры и меры своего региона, —
 * и внутри каждого один и тот же порядок: выплаты, бесплатное, скидки, права и
 * поддержка. Меры со сгорающим сроком поднимаются в самое начало своего блока:
 * деньги теряют не от незнания, а от опоздания.
 */

export type PocketKey = "money" | "free" | "discount" | "support";

/** Порядок карманов внутри блока — от денег к нематериальному. */
export const POCKET_ORDER: PocketKey[] = ["money", "free", "discount", "support"];

export const POCKET_TITLE: Record<PocketKey, string> = {
  money: "Выплаты",
  free: "Бесплатно",
  discount: "Скидки",
  support: "Права и поддержка",
};

export type PodborItem = {
  measure: SupportMeasure;
  /** Каких статусов не хватает — показываем плашкой на карточке. */
  pending: PendingReason[];
  deadline: { text: string; urgent: boolean } | null;
};

/** Один блок выдачи: срочное сверху, затем карманы. */
export type PodborBlock = {
  urgent: PodborItem[];
  pockets: Record<PocketKey, PodborItem[]>;
  count: number;
};

export type PodborGroups = {
  federal: PodborBlock;
  regional: PodborBlock;
  /** Меры, которые ребёнок оформляет сам, — отдельным блоком в конце. */
  child: PodborBlock;
  total: number;
  urgentCount: number;
};

/**
 * Карман меры: выплаты, бесплатное, скидки, права и поддержка.
 *
 * Первые три читаются из меток class-*, которые проставлены почти у всей базы.
 * Четвёртого класса в базе нет, и придумывать метку ради него мы пока не стали:
 * «права и поддержка» — это не отдельный вид помощи, а те же бесплатные услуги,
 * только нематериальные. Отличаем их по разделу каталога: сопровождение семьи
 * (кризисные центры, социальная няня, юрист, психолог) и трудовые гарантии.
 */
const SUPPORT_CATEGORIES = new Set(["Помощь и сопровождение", "Работа и занятость"]);

export function pocketOf(m: SupportMeasure): PocketKey {
  // В measures.segments лежат метки трёх видов: жизненные ситуации, темы
  // (topic-) и классы (class-). Тип SegmentId описывает только ситуации,
  // поэтому классы читаем как строки — так же, как страницы /class/[key].
  const segments = m.segments as unknown as string[];

  if (segments.includes("class-money")) return "money";
  if (segments.includes("class-discount")) return "discount";
  if (segments.includes("class-free")) {
    return SUPPORT_CATEGORIES.has(m.category) ? "support" : "free";
  }
  // Метки нет (таких в базе единицы): если названа сумма — это выплата,
  // иначе относим к правам и поддержке.
  return m.amount ? "money" : "support";
}

function emptyBlock(): PodborBlock {
  return {
    urgent: [],
    pockets: { money: [], free: [], discount: [], support: [] },
    count: 0,
  };
}

/**
 * Порядок внутри кармана: сначала меры с названной суммой.
 *
 * Порядок из базы (sort_order) здесь не работает — он у всех мер нулевой,
 * из-за чего маткапитал когда-то оказывался в хвосте списка.
 */
function withAmountFirst(a: PodborItem, b: PodborItem) {
  return Number(Boolean(b.measure.amount)) - Number(Boolean(a.measure.amount));
}

export function groupPodbor(
  profile: UserProfile,
  measures: SupportMeasure[],
  now: Date = new Date(),
): PodborGroups {
  const groups: PodborGroups = {
    federal: emptyBlock(),
    regional: emptyBlock(),
    child: emptyBlock(),
    total: 0,
    urgentCount: 0,
  };

  for (const measure of measures) {
    const verdict = evaluateEligibility(profile, measure);
    if (!verdict.fits) continue;

    const item: PodborItem = {
      measure,
      pending: verdict.pending,
      deadline: deadlineStatus(profile, measure, now),
    };
    // Меры, которые оформляет сам ребёнок, идут в свой блок, а не к
    // федеральным или региональным: родитель по ним не заявитель.
    const block = measure.appliesByChild
      ? groups.child
      : measure.level === "federal"
        ? groups.federal
        : groups.regional;
    block.count += 1;
    // Общий счёт — только про самого человека: меры, которые оформляет
    // ребёнок, в «вам подходит N мер» не входят, у них свой счётчик.
    if (block !== groups.child) groups.total += 1;

    // Мера со сгорающим сроком живёт только наверху своего блока: показывать
    // её второй раз в кармане — значит сбивать счёт и путать человека.
    if (item.deadline?.urgent) {
      block.urgent.push(item);
      groups.urgentCount += 1;
      continue;
    }
    block.pockets[pocketOf(measure)].push(item);
  }

  for (const block of [groups.federal, groups.regional, groups.child]) {
    block.urgent.sort(withAmountFirst);
    for (const key of POCKET_ORDER) block.pockets[key].sort(withAmountFirst);
  }
  return groups;
}
