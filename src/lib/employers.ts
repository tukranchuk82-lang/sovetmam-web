/**
 * Работодатели со своей программой поддержки семей.
 *
 * Меру от работодателя нельзя вывести из общих ответов анкеты: её получают
 * только сотрудники конкретной компании. Поэтому, если человек живёт в нужном
 * регионе и работает по найму, анкета спрашивает, не работает ли он в одной из
 * этих компаний. Ответ «да» хранится в профиле (`employers`) и открывает меры
 * с условием `requiresEmployer` — всем остальным они не показываются.
 *
 * Новая компания — одна запись здесь плюс мера с `requiresEmployer: <id>`.
 */
export interface EmployerProgram {
  /** Код, который лежит в профиле и в условии меры. */
  id: string;
  /** Как компания названа в вопросе. */
  name: string;
  /** Регион, где спрашиваем (как в списке регионов анкеты). */
  region: string;
}

export const EMPLOYER_PROGRAMS: EmployerProgram[] = [
  { id: "trikotazhny-dom", name: "ООО «Трикотажный дом»", region: "Тверская область" },
];

export function employersForRegion(region: string): EmployerProgram[] {
  return EMPLOYER_PROGRAMS.filter((e) => e.region === region);
}
