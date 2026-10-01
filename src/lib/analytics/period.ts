/**
 * Период отчёта: «7 дней / 30 дней / 90 дней / всё время».
 *
 * Хранится в адресе (?period=30), поэтому страницы остаются серверными, а
 * ссылкой на конкретный срез можно поделиться. Для каждого периода считаем
 * и «предыдущий такой же» — от него зависят стрелки роста/падения.
 */

export type PeriodKey = "7" | "30" | "90" | "all";

export const PERIODS: { key: PeriodKey; label: string; days: number | null }[] = [
  { key: "7", label: "7 дней", days: 7 },
  { key: "30", label: "30 дней", days: 30 },
  { key: "90", label: "90 дней", days: 90 },
  { key: "all", label: "Всё время", days: null },
];

export interface Period {
  key: PeriodKey;
  label: string;
  days: number | null;
  /** Начало периода (включительно); null — с самого начала. */
  from: Date | null;
  /** Начало предыдущего периода такой же длины; null для «всё время». */
  prevFrom: Date | null;
}

const DAY = 86_400_000;

export function parsePeriod(raw: string | string[] | undefined, fallback: PeriodKey = "30"): Period {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const found = PERIODS.find((p) => p.key === value) ?? PERIODS.find((p) => p.key === fallback)!;
  const now = Date.now();
  return {
    key: found.key,
    label: found.label,
    days: found.days,
    from: found.days ? new Date(now - found.days * DAY) : null,
    prevFrom: found.days ? new Date(now - found.days * 2 * DAY) : null,
  };
}

/** Попадает ли момент в период. */
export function inPeriod(iso: string, p: Period): boolean {
  return p.from ? new Date(iso) >= p.from : true;
}

/** Попадает ли момент в предыдущий период такой же длины. */
export function inPrevPeriod(iso: string, p: Period): boolean {
  if (!p.from || !p.prevFrom) return false;
  const t = new Date(iso);
  return t >= p.prevFrom && t < p.from;
}

/** Изменение к предыдущему периоду в процентах; null — сравнивать не с чем. */
export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Ряд «по дням» за период: для «всего времени» — с даты самого раннего
 * события, но не длиннее года, иначе график превращается в полоску.
 */
export function dayBuckets(p: Period, earliest?: Date): string[] {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  let start: Date;
  if (p.days) {
    start = new Date(end.getTime() - (p.days - 1) * DAY);
  } else {
    start = earliest ? new Date(earliest) : new Date(end.getTime() - 89 * DAY);
    start.setHours(0, 0, 0, 0);
    const min = new Date(end.getTime() - 364 * DAY);
    if (start < min) start = min;
  }
  const out: string[] = [];
  for (let t = start.getTime(); t <= end.getTime(); t += DAY) {
    out.push(localDay(new Date(t)));
  }
  return out;
}

/** Ключ дня «ГГГГ-ММ-ДД» по местному времени. */
export function localDay(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
