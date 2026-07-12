import { REGIONS } from "@/lib/measures";

/**
 * График регулярной сверки мер с официальными источниками.
 *
 * Вычитывать все 2159 мер за один день невозможно — качество упадёт (именно так
 * и появляются ошибки вроде мордовской, где мера показывалась не тем). Поэтому
 * база обходится за месяц порциями:
 *
 *   1-е число        — федеральные меры (~96)
 *   2-е … 27-е       — по 3–4 региона в день (89 регионов, ~85 мер в день)
 *   28-е и далее     — резерв: спорные меры и обращения пользователей
 *
 * Тот же график считает scripts/verify-schedule.mjs — он читает REGIONS отсюда
 * же, чтобы админка и скрипт не разъехались.
 */
export type DayPlan =
  | { kind: "federal"; title: string }
  | { kind: "regions"; title: string; regions: string[] }
  | { kind: "reserve"; title: string };

/** Первый день, с которого идут регионы. */
const FIRST_REGION_DAY = 2;

/** Разбивка регионов по дням: 3 региона в чётный день, 4 — в нечётный. */
function regionChunks(): { day: number; regions: string[] }[] {
  const chunks: { day: number; regions: string[] }[] = [];
  let i = 0;
  let day = FIRST_REGION_DAY;
  while (i < REGIONS.length) {
    const size = day % 2 === 0 ? 3 : 4;
    chunks.push({ day, regions: [...REGIONS].slice(i, i + size) });
    i += size;
    day++;
  }
  return chunks;
}

export function planFor(day: number): DayPlan {
  if (day === 1) return { kind: "federal", title: "Федеральные меры" };
  const chunk = regionChunks().find((c) => c.day === day);
  if (!chunk) {
    return {
      kind: "reserve",
      title: "Резервный день: спорные меры и обращения пользователей",
    };
  }
  return { kind: "regions", title: chunk.regions.join(", "), regions: chunk.regions };
}

/** Последний день, на который назначены регионы (для подсказки в админке). */
export function lastScheduledDay(): number {
  const chunks = regionChunks();
  return chunks[chunks.length - 1].day;
}
