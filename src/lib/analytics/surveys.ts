import "server-only";
import { loadSurveys, SURVEY_FLAG_KEYS, type SurveyLite } from "@/lib/analytics/data";
import { inPeriod, type Period } from "@/lib/analytics/period";
import { PRIORITY_SITUATIONS } from "@/lib/taxonomy";

/** Отчёт «Анкеты»: какие ответы люди выбирают чаще всего. */

export interface Distribution {
  key: string;
  title: string;
  /** Сколько людей вообще ответили на этот вопрос. */
  answered: number;
  items: { label: string; value: number }[];
}

export interface SurveysReport {
  total: number;
  regionsAvailable: string[];
  distributions: Distribution[];
  flags: { label: string; value: number }[];
}

const FLAG_LABEL: Record<(typeof SURVEY_FLAG_KEYS)[number], string> = {
  pregnant: "Беременность",
  lowIncome: "Малоимущая семья",
  singleParent: "Одинокий родитель",
  svoFamily: "Семья участника СВО",
  disabledChild: "Ребёнок с инвалидностью",
  specialNeedsChild: "Ребёнок с ОВЗ",
  fosterParent: "Приёмный родитель",
  mortgageIntent: "Планируют ипотеку",
  hasMortgage: "Есть ипотека",
  ownsHome: "Есть своё жильё",
  student: "Студент",
  teacher: "Педагог",
  selfEmployed: "Самозанятый",
  entrepreneur: "Предприниматель",
  disabledParent: "Родитель с инвалидностью",
  hardship: "Трудная жизненная ситуация",
};

const EMPLOYMENT_LABEL: Record<string, string> = {
  working: "Работают",
  "not-working": "Не работают",
  "parental-leave": "В декрете / отпуске по уходу",
};

const SETTLEMENT_LABEL: Record<string, string> = {
  city: "Город",
  "small-town": "Город до 50 тысяч",
  village: "Село, посёлок",
};

function tally(rows: SurveyLite[], get: (r: SurveyLite) => string | null): { label: string; value: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = get(r);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([label, value]) => ({ label, value }));
}

function bySize(a: { value: number }, b: { value: number }) {
  return b.value - a.value;
}

/** Порядок сохраняем как в вопросе, а не по популярности — там это естественнее. */
function ordered(items: { label: string; value: number }[], order: string[]) {
  return order.map((label) => ({ label, value: items.find((i) => i.label === label)?.value ?? 0 })).filter((i) => i.value > 0);
}

export async function getSurveysReport(period: Period, region: string | null): Promise<SurveysReport> {
  const all = await loadSurveys();
  const regionsAvailable = [...new Set(all.map((s) => s.region).filter((r): r is string => Boolean(r)))].sort((a, b) =>
    a.localeCompare(b, "ru"),
  );

  const rows = all.filter(
    (s) => (region ? s.region === region : true) && (s.survey_updated_at ? inPeriod(s.survey_updated_at, period) : !period.from),
  );

  const dist = (key: string, title: string, items: { label: string; value: number }[]): Distribution => ({
    key,
    title,
    answered: items.reduce((s, i) => s + i.value, 0),
    items,
  });

  const kids = tally(rows, (r) => (r.children == null ? null : r.children >= 4 ? "4 и больше" : r.children === 0 ? "Без детей" : `${r.children} ${r.children === 1 ? "ребёнок" : "ребёнка"}`));
  const youngest = tally(rows, (r) => {
    const a = r.youngest;
    if (a == null || (r.children ?? 0) === 0) return null;
    return a < 1 ? "До 1 года" : a < 3 ? "1–3 года" : a < 7 ? "3–7 лет" : a < 14 ? "7–14 лет" : a < 18 ? "14–18 лет" : "Старше 18";
  });
  const income = tally(rows, (r) =>
    r.income === 1 ? "До 1 прожиточного минимума" : r.income === 1.5 ? "От 1 до 1,5 ПМ" : r.income === 2 ? "От 1,5 до 2 ПМ" : "Выше 2 ПМ / не указан",
  );

  const priorityTitle = new Map<string, string>(PRIORITY_SITUATIONS.map((s) => [s.key, s.title]));

  const flags = SURVEY_FLAG_KEYS.map((k) => ({
    label: FLAG_LABEL[k],
    value: rows.filter((r) => r.flags[k] === true).length,
  }))
    .filter((f) => f.value > 0)
    .sort(bySize);

  return {
    total: rows.length,
    regionsAvailable,
    flags,
    distributions: [
      dist("region", "Регионы", tally(rows, (r) => r.region).sort(bySize)),
      dist(
        "kids",
        "Сколько детей в семье",
        ordered(kids, ["Без детей", "1 ребёнок", "2 ребёнка", "3 ребёнка", "4 и больше"]),
      ),
      dist(
        "youngest",
        "Возраст младшего ребёнка",
        ordered(youngest, ["До 1 года", "1–3 года", "3–7 лет", "7–14 лет", "14–18 лет", "Старше 18"]),
      ),
      dist(
        "employment",
        "Занятость",
        tally(rows, (r) => (r.employment ? (EMPLOYMENT_LABEL[r.employment] ?? r.employment) : null)).sort(bySize),
      ),
      dist(
        "priority",
        "Что важнее всего сейчас",
        tally(rows, (r) => (r.priority ? (priorityTitle.get(r.priority) ?? r.priority) : null)).sort(bySize),
      ),
      dist(
        "settlement",
        "Где живут",
        tally(rows, (r) => (r.settlement ? (SETTLEMENT_LABEL[r.settlement] ?? r.settlement) : null)).sort(bySize),
      ),
      dist(
        "income",
        "Доход на человека",
        ordered(income, ["До 1 прожиточного минимума", "От 1 до 1,5 ПМ", "От 1,5 до 2 ПМ", "Выше 2 ПМ / не указан"]),
      ),
    ],
  };
}
