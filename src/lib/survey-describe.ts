import { PRIORITY_SITUATIONS } from "@/lib/taxonomy";
import { TAX_SYSTEM_LABEL, type TaxSystem } from "@/lib/measures";

/**
 * Анкета подбора простыми словами — для просмотра координатором.
 *
 * В базе анкета лежит как есть (ключи вроде svoFamily, incomePm). Здесь она
 * превращается в список «вопрос — ответ» на русском. Показываем только то, что
 * человек реально указал: пустые ответы и «нет» не выводим, чтобы строк не
 * было больше, чем смысла.
 */

export interface SurveyRow {
  label: string;
  value: string;
}

const FLAGS: [string, string][] = [
  ["singleParent", "Один родитель"],
  ["svoFamily", "Семья участника СВО"],
  ["lowIncome", "Малоимущая семья"],
  ["disabledChild", "Ребёнок с инвалидностью"],
  ["specialNeedsChild", "Ребёнок с ОВЗ"],
  ["rareDisease", "Редкое заболевание у ребёнка"],
  ["lossOfBreadwinner", "Потеря кормильца"],
  ["fosterParent", "Приёмный родитель или опекун"],
  ["disabledParent", "Родитель с инвалидностью"],
  ["conscriptSpouse", "Муж на срочной службе"],
  ["veteranCombat", "Ветеран боевых действий в семье"],
  ["radiationAffected", "Пострадали от радиации"],
  ["hardship", "Трудная жизненная ситуация"],
  ["mortgageIntent", "Планируют ипотеку"],
  ["hasMortgage", "Есть ипотека"],
  ["ownsHome", "Есть своё жильё"],
  ["student", "Студент"],
  ["teacher", "Педагог"],
  ["selfEmployed", "Самозанятый"],
  ["entrepreneur", "Предприниматель"],
];

const SETTLEMENT: Record<string, string> = {
  city: "Город",
  "small-town": "Город до 50 тысяч",
  village: "Село, посёлок",
};

const EMPLOYMENT: Record<string, string> = {
  working: "Работает",
  "not-working": "Не работает",
  "parental-leave": "В декрете или отпуске по уходу",
};

const PREGNANCY: Record<string, string> = {
  under12: "до 12 недель",
  "12-27": "12–27 недель",
  "28-35": "28–35 недель",
  "36plus": "36 недель и больше",
};

const INCOME: Record<string, string> = {
  "1": "до 1 прожиточного минимума",
  "1.5": "от 1 до 1,5 ПМ",
  "2": "от 1,5 до 2 ПМ",
};

function plural(n: number, one: string, few: string, many: string): string {
  const d10 = n % 10;
  const d100 = n % 100;
  if (d10 === 1 && d100 !== 11) return one;
  if (d10 >= 2 && d10 <= 4 && (d100 < 10 || d100 >= 20)) return few;
  return many;
}

export function describeSurvey(survey: Record<string, unknown> | null): SurveyRow[] {
  if (!survey) return [];
  const rows: SurveyRow[] = [];
  const add = (label: string, value: string | null | undefined) => {
    if (value) rows.push({ label, value });
  };

  if (survey.gender === "female") add("Пол", "Женский");
  if (survey.gender === "male") add("Пол", "Мужской");
  if (typeof survey.region === "string") add("Регион", survey.region);
  if (typeof survey.settlementType === "string") add("Где живёт", SETTLEMENT[survey.settlementType]);

  const prio = PRIORITY_SITUATIONS.find((p) => p.key === survey.prioritySituation);
  add("Самое важное сейчас", prio?.title);

  if (typeof survey.parentAge === "number") add("Возраст", String(survey.parentAge));
  if (typeof survey.spouseAge === "number") add("Возраст супруга", String(survey.spouseAge));

  // Дети: с годом рождения, если анкета новая; иначе — просто число.
  const kids = Array.isArray(survey.children) ? (survey.children as Record<string, unknown>[]) : [];
  if (survey.hasChildren) {
    const count = Number(survey.childrenCount) || kids.length;
    if (kids.length > 0) {
      add(
        "Дети",
        kids
          .map((k) => {
            const year = typeof k.birthYear === "number" ? `${k.birthYear} г. р.` : "возраст не указан";
            return k.studiesFullTime === true ? `${year} (учится очно)` : year;
          })
          .join(", "),
      );
    } else {
      add("Дети", `${count} ${plural(count, "ребёнок", "ребёнка", "детей")}`);
    }
  } else if (survey.hasChildren === false) {
    add("Дети", "нет");
  }

  if (survey.pregnant) {
    const parts = ["да"];
    if (typeof survey.expectingChildNumber === "number") parts.push(`${survey.expectingChildNumber}-й ребёнок`);
    if (typeof survey.pregnancyStage === "string" && PREGNANCY[survey.pregnancyStage]) {
      parts.push(PREGNANCY[survey.pregnancyStage]);
    }
    add("Ждёт ребёнка", parts.join(", "));
  }
  if (typeof survey.multipleBirthCount === "number" && survey.multipleBirthCount > 1) {
    add("Многоплодные роды", `${survey.multipleBirthCount} ребёнка за одни роды`);
  }

  add("Доход на человека", INCOME[String(survey.incomePm)]);
  if (typeof survey.employmentStatus === "string") add("Занятость", EMPLOYMENT[survey.employmentStatus]);
  if (typeof survey.taxSystem === "string") {
    add("Налогообложение ИП", TAX_SYSTEM_LABEL[survey.taxSystem as TaxSystem] ?? survey.taxSystem);
  }

  const flags = FLAGS.filter(([k]) => survey[k] === true).map(([, label]) => label);
  if (flags.length > 0) add("Отметил", flags.join(", "));

  return rows;
}
