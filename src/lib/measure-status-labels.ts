/** Что человек говорит про меру: пользуется, не подавал, получил отказ. */
export type MeasureStatus = "using" | "not_applied" | "refused";

export const MEASURE_STATUS_LABEL: Record<MeasureStatus, string> = {
  using: "Пользуюсь",
  not_applied: "Не подавал(а)",
  refused: "Отказали",
};

export function isMeasureStatus(v: unknown): v is MeasureStatus {
  return v === "using" || v === "not_applied" || v === "refused";
}
